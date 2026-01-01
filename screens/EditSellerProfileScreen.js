import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';

const EditSellerProfileScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { seller } = route.params || {};
    // Fallback: If seller object is not passed, handle gracefully (or refetch if needed, though usually passed)
    const sellerId = seller?._id || seller?.id;

    const [loading, setLoading] = useState(false);
    const [businessName, setBusinessName] = useState(seller?.businessName || '');
    const [sellerName, setSellerName] = useState(seller?.sellerName || '');
    const [phone, setPhone] = useState(seller?.phone || '');
    const [description, setDescription] = useState(seller?.description || '');
    const [profileImage, setProfileImage] = useState(seller?.profileImage || '');

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const imgUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
            setProfileImage(imgUri);
        }
    };

    const handleSave = async () => {
        if (!businessName || !sellerName || !phone) {
            Alert.alert("Missing Fields", "Business Name, Seller Name and Phone are required.");
            return;
        }

        setLoading(true);
        try {
            if (!sellerId) {
                Alert.alert("Error", "Seller ID missing.");
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/seller/profile/${sellerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName,
                    sellerName,
                    phone,
                    description,
                    profileImage
                })
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Profile updated successfully!", [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Error", data.message || "Failed to update profile");
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
                    style={{ flex: 1 }}
                >
                    {/* Glassmorphic Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Edit Shop Profile</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Shop Logo Picker */}
                        <View style={styles.imageSection}>
                            <View style={styles.avatarWrapper}>
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                                ) : (
                                    <LinearGradient colors={['#eee', '#ddd']} style={[styles.profileImage, styles.imagePlaceholder]}>
                                        <Text style={styles.initial}>{businessName?.charAt(0) || 'S'}</Text>
                                    </LinearGradient>
                                )}
                                <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
                                    <LinearGradient colors={['#333', '#000']} style={styles.cameraGradient}>
                                        <Ionicons name="camera" size={normalize(18)} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.changePhotoText}>Change Shop Logo</Text>
                        </View>

                        {/* Form Card */}
                        <View style={styles.formCard}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Business Name</Text>
                                <TextInput
                                    style={[styles.input, styles.disabledInput]}
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                    editable={false} // Often business names are locked or need approval
                                />
                                <Text style={styles.helperText}>Business name cannot be changed directly.</Text>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Owner/Seller Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={sellerName}
                                    onChangeText={setSellerName}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Shop Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Tell customers about your shop..."
                                    placeholderTextColor="#999"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <Text style={styles.noteText}>Note: Sensitive details like GSTIN and PAN cannot be edited here.</Text>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#E50914', '#B81C26']}
                                    style={styles.saveBtnGradient}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContent: {
        paddingBottom: hp(5),
    },
    imageSection: {
        alignItems: 'center',
        marginTop: hp(3),
        marginBottom: hp(3),
    },
    avatarWrapper: {
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    profileImage: {
        width: wp(30),
        height: wp(30),
        borderRadius: wp(15),
        borderWidth: 4,
        borderColor: '#fff',
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eee',
    },
    initial: {
        fontSize: normalize(40),
        color: '#888',
        fontWeight: 'bold',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: wp(5), // Circular
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 4,
    },
    cameraGradient: {
        padding: wp(2.2),
        justifyContent: 'center',
        alignItems: 'center',
    },
    changePhotoText: {
        marginTop: hp(1.5),
        color: '#E50914',
        fontWeight: '600',
        fontSize: normalize(14),
    },
    formCard: {
        marginHorizontal: wp(5),
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 20,
        padding: wp(6),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    formGroup: {
        marginBottom: hp(2.5),
    },
    label: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#555',
        marginBottom: hp(1),
        marginLeft: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        fontSize: normalize(15),
        color: '#333',
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#999',
    },
    textArea: {
        height: hp(15),
        textAlignVertical: 'top', // For Android
    },
    helperText: {
        fontSize: normalize(11),
        color: '#999',
        marginTop: 4,
        marginLeft: 4,
    },
    noteText: {
        fontSize: normalize(12),
        color: '#888',
        textAlign: 'center',
        marginBottom: hp(3),
        marginTop: hp(1),
        paddingHorizontal: wp(2),
    },
    saveBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#E50914",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    saveBtnGradient: {
        paddingVertical: hp(1.8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: normalize(16),
        fontWeight: 'bold',
    },
});

export default EditSellerProfileScreen;
