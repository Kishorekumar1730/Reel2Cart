import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';

const EditSellerProfileScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { seller } = route.params || {};
    // Fallback: If seller object is not passed, handle gracefully (or refetch)
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
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={["#1a1a1a", "#000"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Shop Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="#E50914" /> : <Text style={styles.saveText}>Save</Text>}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Profile Image Picker */}
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={[styles.profileImage, styles.imagePlaceholder]}>
                                <Text style={styles.initial}>{businessName?.charAt(0)}</Text>
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.changePhotoText}>Change Shop Logo</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Business Name</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={businessName}
                        onChangeText={setBusinessName}
                        editable={false}
                    />
                    <Text style={styles.helperText}>Business name cannot be changed.</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Owner/Seller Name</Text>
                    <TextInput
                        style={styles.input}
                        value={sellerName}
                        onChangeText={setSellerName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Shop Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Tell customers about your shop..."
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <Text style={styles.noteText}>Note: Sensitive details like GSTIN and PAN cannot be edited directly. Please contact support.</Text>

            </ScrollView>
        </SafeAreaView>
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
    imageSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imageWrapper: {
        position: 'relative',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#eee',
    },
    imagePlaceholder: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    initial: {
        fontSize: 40,
        color: '#666',
        fontWeight: 'bold',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#E50914',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    changePhotoText: {
        marginTop: 10,
        color: '#E50914',
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 100,
    },
    noteText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
    disabledInput: {
        backgroundColor: '#e0e0e0',
        color: '#888',
    },
    helperText: {
        fontSize: 11,
        color: '#999',
        marginTop: 5,
        marginLeft: 2
    }
});

export default EditSellerProfileScreen;
