import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';

const { width } = Dimensions.get('window');

const VideoPreview = ({ uri, style }) => {
    // Handle relative path if editing an existing product
    const fullUri = (uri && !uri.startsWith('http') && !uri.startsWith('file://'))
        ? `${API_BASE_URL}/${uri}`
        : uri;

    const player = useVideoPlayer(fullUri, player => {
        player.loop = true;
        player.play();
    });

    return <VideoView style={style} player={player} contentFit="cover" allowFullScreen allowPictureInPicture />;
};

const CATEGORIES = [
    { id: 1, key: 'Fashion', icon: 'shirt-outline' },
    { id: 2, key: 'Electronics', icon: 'phone-portrait-outline' },
    { id: 3, key: 'Home', icon: 'home-outline' },
    { id: 4, key: 'Beauty', icon: 'rose-outline' },
    { id: 5, key: 'Sports', icon: 'football-outline' },
    { id: 6, key: 'Fresh', icon: 'nutrition-outline' },
];

const AddProductScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    // Check if Edit Mode
    const { isEdit, product, sellerId, mode } = route.params || {};
    const isReelMode = mode === 'reel';

    const [currentSellerId, setCurrentSellerId] = useState(sellerId);

    useEffect(() => {
        const ensureSellerId = async () => {
            if (currentSellerId) return;
            try {
                const userStr = await AsyncStorage.getItem('userInfo');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const res = await fetch(`${API_BASE_URL}/seller/dashboard/${user._id}`);
                    const data = await res.json();
                    if (res.ok && data.seller) {
                        setCurrentSellerId(data.seller._id);
                    }
                }
            } catch (error) {
                console.error("Error ensuring seller ID:", error);
            }
        };
        ensureSellerId();
    }, []);

    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [category, setCategory] = useState(product?.category || 'General');
    const [stock, setStock] = useState(product?.stock?.toString() || '1');
    const [images, setImages] = useState(product?.images || []);
    const [videoUrl, setVideoUrl] = useState(product?.videoUrl || '');
    // Default country to Global if not set
    const [country, setCountry] = useState(product?.country || 'Global');
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const newImages = result.assets.map(asset =>
                asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
            );
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const pickVideo = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                setVideoUrl(result.assets[0].uri);
            }
        } catch (error) {
            console.log("Error picking video:", error);
            Alert.alert("Error", "Could not pick video.");
        }
    };

    const handleSave = async () => {
        let activeSellerId = currentSellerId;

        // Retry fetching ID if missing
        if (!activeSellerId) {
            try {
                const userStr = await AsyncStorage.getItem('userInfo');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const res = await fetch(`${API_BASE_URL}/seller/dashboard/${user._id}`);
                    const data = await res.json();
                    if (res.ok && data.seller) {
                        activeSellerId = data.seller._id;
                        setCurrentSellerId(activeSellerId);
                    }
                }
            } catch (e) {
                console.error("Seller ID retry failed", e);
            }
        }

        if (!activeSellerId) {
            Alert.alert("Error", "Seller identity missing. Please check your internet or re-login.");
            return;
        }

        if (!name || !price || !description || images.length === 0) {
            Alert.alert("Missing Fields", "Please fill required fields and add at least one image.");
            return;
        }

        if (isReelMode && !videoUrl) {
            Alert.alert("Missing Reel", "Please select a video for your Reel.");
            return;
        }

        setLoading(true);
        try {
            let finalVideoUrl = videoUrl;

            // Check if uploading a new local video (Reel Mode)
            if (isReelMode && videoUrl && !videoUrl.startsWith('http')) {
                const formData = new FormData();
                formData.append('file', {
                    uri: videoUrl,
                    name: 'upload.mp4', // Simple default name
                    type: 'video/mp4'
                });

                try {
                    const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
                        method: 'POST',
                        body: formData,
                        // Do NOT set Content-Type header for FormData in React Native
                        // The engine will set it with the correct boundary
                    });

                    const uploadData = await uploadRes.json();
                    if (uploadRes.ok) {
                        finalVideoUrl = uploadData.url;
                    } else {
                        throw new Error(uploadData.message || "Video upload failed");
                    }
                } catch (err) {
                    console.error("Upload error:", err);
                    Alert.alert("Upload Failed", "Could not upload video. Please try again.");
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                sellerId: activeSellerId,
                name,
                description,
                price: parseFloat(price),
                category,
                stock: parseInt(stock),
                images,
                videoUrl: finalVideoUrl,
                images,
                videoUrl: finalVideoUrl,
                country: country, // Crucial for regional algorithm
            };

            let url = `${API_BASE_URL}/products/add`;
            let method = 'POST';

            if (isEdit) {
                url = `${API_BASE_URL}/products/${product._id}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                Alert.alert("Success", `${isReelMode ? 'Reel uploaded' : (isEdit ? 'Product updated' : 'Product added')} successfully!`, [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Error", data.message || "Something went wrong.");
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={["#1a1a1a", "#000"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => {
                        if (navigation.canGoBack()) navigation.goBack();
                        else navigation.navigate('Home');
                    }}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEdit ? 'Edit Details' : (isReelMode ? 'New Reel' : 'Add Product')}
                    </Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="#E50914" /> : <Text style={styles.saveText}>Share</Text>}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>

                {/* --- VIDEO UPLOAD SECTION (Reel Mode) --- */}
                {isReelMode && (
                    <View style={styles.reelUploadSection}>
                        <TouchableOpacity style={styles.videoPlaceholder} onPress={pickVideo}>
                            {videoUrl ? (
                                <VideoPreview
                                    uri={videoUrl}
                                    style={styles.videoPreview}
                                />
                            ) : (
                                <View style={styles.uploadPrompt}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="videocam" size={40} color="#E50914" />
                                    </View>
                                    <Text style={styles.uploadText}>Select Video</Text>
                                    <Text style={styles.uploadSubText}>From Gallery</Text>
                                </View>
                            )}

                            {/* Edit Overlay if video exists */}
                            {videoUrl && (
                                <View style={styles.editVideoOverlay}>
                                    <Ionicons name="pencil" size={20} color="#fff" />
                                    <Text style={styles.editText}>Change</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.helperText}>Recommended: 9:16 Vertical Video</Text>
                    </View>
                )}

                {/* --- DETAILS SECTION --- */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionHeader}>{isReelMode ? 'Product Details' : 'Product Info'}</Text>

                    {/* Cover Image */}
                    {/* Images Section */}
                    <Text style={styles.label}>{isReelMode ? 'Cover Photo' : 'Product Images (Max 5)'}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 15 }}>
                        {images.map((img, index) => (
                            <View key={index} style={[styles.imagePicker, { marginRight: 10 }]}>
                                <Image source={{ uri: img }} style={styles.previewImage} />
                                <TouchableOpacity
                                    style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 12 }}
                                    onPress={() => removeImage(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#E50914" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {images.length < 5 && (
                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                <View style={styles.placeholder}>
                                    <Ionicons name="add-circle-outline" size={30} color="#666" />
                                    <Text style={styles.placeholderText}>Add</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    <Text style={styles.label}>Caption / Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Write a caption..."
                    />

                    {!isReelMode && <Text style={styles.label}>Description</Text>}
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder={isReelMode ? "Describe this reel..." : "Product description..."}
                        multiline={true}
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>Price (₹)</Text>
                    <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        keyboardType="numeric"
                    />

                    {/* Category Selection */}
                    <Text style={styles.label}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.catChip, category === cat.key && styles.activeCatChip]}
                                onPress={() => setCategory(cat.key)}
                            >
                                <Ionicons
                                    name={cat.icon}
                                    size={16}
                                    color={category === cat.key ? '#fff' : '#666'}
                                    style={{ marginRight: 5 }}
                                />
                                <Text style={[styles.catText, category === cat.key && styles.activeCatText]}>
                                    {cat.key}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Stock</Text>
                            <TextInput
                                style={styles.input}
                                value={stock}
                                onChangeText={setStock}
                                placeholder="Qty"
                                keyboardType="numeric"
                            />
                        </View>
                        {/* Space for future field */}
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Country / Region</Text>
                            <TextInput
                                style={styles.input}
                                value={country}
                                onChangeText={setCountry}
                                placeholder="e.g. India, USA, Global"
                            />
                            <Text style={{ fontSize: 10, color: '#999', marginTop: -12, marginBottom: 10 }}>
                                Leave 'Global' for worldwide visibility
                            </Text>
                        </View>
                    </View>
                </View>

            </ScrollView >
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 15,
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    saveText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E50914',
    },
    content: {
        padding: 20,
    },
    reelUploadSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    videoPlaceholder: {
        width: width * 0.6, // Instagram-ish aspect ratio
        height: (width * 0.6) * (16 / 9),
        backgroundColor: '#f0f0f0',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    videoPreview: {
        width: '100%',
        height: '100%',
    },
    uploadPrompt: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 2,
    },
    uploadText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    uploadSubText: {
        fontSize: 12,
        color: '#888',
    },
    editVideoOverlay: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    editText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 5,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 10,
    },
    formSection: {
        flex: 1,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    imagePicker: {
        width: 80,
        height: 80,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#fafafa',
        marginBottom: 15,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    textArea: {
        height: 80,
    },
    catScroll: {
        marginBottom: 15,
        flexDirection: 'row',
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    activeCatChip: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    catText: {
        fontSize: 13,
        color: '#666',
    },
    activeCatText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default AddProductScreen;
