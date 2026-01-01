import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator, Dimensions, StatusBar, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';

const ALL_COUNTRIES = [
    { code: 'Global', name: 'Global Store', flag: '🌍' },
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
    { code: 'AL', name: 'Albania', flag: '🇦🇱' },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'IR', name: 'Iran', flag: '🇮🇷' },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' }
];

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
    const { t } = useLanguage();
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
    const [isCountryPickerVisible, setCountryPickerVisible] = useState(false);

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
            Alert.alert(t('error'), t('couldNotPickVideo') || "Could not pick video.");
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
            Alert.alert(t('error'), t('sellerIdentityMissing') || "Seller identity missing. Please re-login.");
            return;
        }

        if (!name || !price || !description || images.length === 0) {
            Alert.alert(t('missingFields'), t('fillRequired'));
            return;
        }

        if (isReelMode && !videoUrl) {
            Alert.alert(t('missingReel'), t('selectReelVideo'));
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
                    Alert.alert(t('uploadFailed'), t('couldNotUpload'));
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
                Alert.alert(t('success'), isReelMode ? t('reelUploaded') : (isEdit ? t('productUpdated') : t('productAdded')), [
                    { text: t('ok'), onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert(t('error'), data.message || t('somethingWentWrong'));
            }

        } catch (error) {
            console.error(error);
            Alert.alert(t('error'), t('networkError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
                    style={{ flex: 1 }}
                >
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity onPress={() => {
                                if (navigation.canGoBack()) navigation.goBack();
                                else navigation.navigate('Home');
                            }}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>
                                {isEdit ? t('editDetails') : (isReelMode ? t('newReel') : t('addProduct'))}
                            </Text>
                            <TouchableOpacity onPress={handleSave} disabled={loading}>
                                {loading ? <ActivityIndicator color="#E50914" /> : <Text style={styles.saveText}>{t('share')}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

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
                                            <Text style={styles.uploadText}>{t('selectVideo')}</Text>
                                            <Text style={styles.uploadSubText}>{t('fromGallery')}</Text>
                                        </View>
                                    )}

                                    {/* Edit Overlay if video exists */}
                                    {videoUrl && (
                                        <View style={styles.editVideoOverlay}>
                                            <Ionicons name="pencil" size={20} color="#fff" />
                                            <Text style={styles.editText}>{t('change')}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.helperText}>{t('recommendedVertical')}</Text>
                            </View>
                        )}

                        {/* --- DETAILS SECTION --- */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionHeader}>{isReelMode ? t('productDetails') : t('productInfo')}</Text>

                            {/* Images Section */}
                            <Text style={styles.label}>{isReelMode ? t('coverPhoto') : t('productImages')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 15 }}>
                                {images.map((img, index) => (
                                    <View key={index} style={[styles.imagePicker, { marginRight: 10 }]}>
                                        <Image source={{ uri: img }} style={styles.previewImage} />
                                        <TouchableOpacity
                                            style={styles.removeBtn}
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
                                            <Text style={styles.placeholderText}>{t('add')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>

                            <Text style={styles.label}>{t('captionName')}</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder={t('writeCaption')}
                                placeholderTextColor="#999"
                            />

                            {!isReelMode && <Text style={styles.label}>{t('description')}</Text>}
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder={isReelMode ? t('describeReel') : t('productDescription')}
                                placeholderTextColor="#999"
                                multiline={true}
                                textAlignVertical="top"
                            />

                            <Text style={styles.label}>{t('price')}</Text>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                placeholder="0.00"
                                placeholderTextColor="#999"
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
                                            size={18}
                                            color={category === cat.key ? '#fff' : '#666'}
                                            style={{ marginRight: 5 }}
                                        />
                                        <Text style={[styles.catText, category === cat.key && styles.activeCatText]}>
                                            {t(`cat${cat.key}`) || cat.key}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('stock')}</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={stock}
                                        onChangeText={setStock}
                                        placeholder="Qty"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                    />
                                </View>
                                {/* Space for future field */}
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('countryRegion')}</Text>
                                    <TouchableOpacity
                                        style={styles.input}
                                        onPress={() => setCountryPickerVisible(true)}
                                    >
                                        <Text style={{ color: country ? '#333' : '#999', fontSize: normalize(15) }}>{
                                            country === 'Global' ? `🌍 ${t('globalStore')}` :
                                                (ALL_COUNTRIES.find(c => c.name === country)?.flag || '🏳️') + ' ' + (country || t('select'))
                                        }</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.helperTextSmall}>
                                        {t('leaveGlobal')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
                {/* Country Picker Modal */}
                <Modal
                    visible={isCountryPickerVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setCountryPickerVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('selectCountry')}</Text>
                                <TouchableOpacity onPress={() => setCountryPickerVisible(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={ALL_COUNTRIES}
                                keyExtractor={(item) => item.code}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.countryItem}
                                        onPress={() => {
                                            setCountry(item.name);
                                            setCountryPickerVisible(false);
                                        }}
                                    >
                                        <Text style={styles.countryFlag}>{item.flag}</Text>
                                        <Text style={[styles.countryName, country === item.name && styles.selectedCountry]}>
                                            {item.name}
                                        </Text>
                                        {country === item.name && <Ionicons name="checkmark" size={20} color="#E50914" />}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background color handled by Gradient
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: 'rgba(255,255,255,0.5)', // Glass effect
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.6)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#333',
    },
    saveText: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#E50914',
    },
    content: {
        padding: wp(5),
        paddingBottom: hp(10),
    },
    reelUploadSection: {
        alignItems: 'center',
        marginBottom: hp(3),
    },
    videoPlaceholder: {
        width: wp(60),
        height: wp(60) * (16 / 9),
        backgroundColor: '#fff',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        elevation: 2,
    },
    videoPreview: {
        width: '100%',
        height: '100%',
    },
    uploadPrompt: {
        alignItems: 'center',
    },
    iconCircle: {
        width: wp(15),
        height: wp(15),
        borderRadius: wp(7.5),
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    uploadText: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#333',
    },
    uploadSubText: {
        fontSize: normalize(12),
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
        fontSize: normalize(12),
        marginLeft: 5,
        fontWeight: '600',
    },
    helperText: {
        fontSize: normalize(12),
        color: '#666',
        marginTop: 10,
    },
    formSection: {
        flex: 1,
    },
    sectionHeader: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        marginBottom: hp(2),
        color: '#333',
    },
    imagePicker: {
        width: wp(20),
        height: wp(20),
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeBtn: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#fff',
        borderRadius: 15,
        elevation: 2,
    },
    placeholder: {
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: normalize(10),
        color: '#666',
        marginTop: 4,
    },
    label: {
        fontSize: normalize(13),
        fontWeight: '600',
        color: '#444',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: wp(3.5),
        fontSize: normalize(15),
        backgroundColor: '#fff',
        marginBottom: hp(2),
        color: '#333',
        elevation: 1, // Card effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    textArea: {
        height: hp(12),
    },
    catScroll: {
        marginBottom: hp(2),
        flexDirection: 'row',
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 1,
    },
    activeCatChip: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
        elevation: 3,
    },
    catText: {
        fontSize: normalize(13),
        color: '#666',
    },
    activeCatText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    helperTextSmall: {
        fontSize: normalize(10),
        color: '#666',
        marginTop: -hp(1.5),
        marginBottom: hp(2),
        marginLeft: 2,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: hp(70),
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    modalTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#333',
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    countryFlag: {
        fontSize: normalize(20),
        marginRight: 10,
    },
    countryName: {
        fontSize: normalize(16),
        color: '#333',
        flex: 1,
    },
    selectedCountry: {
        color: '#E50914',
        fontWeight: 'bold',
    },
});

export default AddProductScreen;
