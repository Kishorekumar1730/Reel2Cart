import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, normalize } from '../utils/responsive';
import DateTimePicker from '@react-native-community/datetimepicker';

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [profileImage, setProfileImage] = useState(null); // URI

    // Picker Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [pickerType, setPickerType] = useState(''); // 'gender' or 'dob' (simplified dob for now)

    // Date Picker
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios'); // Keep open for iOS
        setDate(currentDate);

        if (selectedDate) {
            let fDate = currentDate.getDate().toString().padStart(2, '0') + '/' +
                (currentDate.getMonth() + 1).toString().padStart(2, '0') + '/' +
                currentDate.getFullYear();
            setDob(fDate);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const stored = await AsyncStorage.getItem('userInfo');
            if (stored) {
                const parsed = JSON.parse(stored);
                setUserId(parsed._id);
                // Fetch latest from API
                const resp = await fetch(`${API_BASE_URL}/user/${parsed._id}`);
                const text = await resp.text(); // Get text first to debug
                try {
                    const data = JSON.parse(text);
                    if (resp.ok && data.user) {
                        const u = data.user;
                        setName(u.name || '');
                        setMobileNo(u.mobileNo || '');
                        setGender(u.gender || '');
                        setDob(u.dob || '');
                        setProfileImage(u.profileImage || null);
                        if (u.dob) {
                            const parts = u.dob.split('/');
                            if (parts.length === 3) {
                                setDate(new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
                            }
                        }
                    } else {
                        console.log("Failed to fetch user data:", data);
                    }
                } catch (e) {
                    console.log("Error parsing user data JSON:", text);
                }
            }
        } catch (e) {
            console.log("Error fetching user profile", e);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true, // We need base64 to send to backend easily without S3
        });

        if (!result.canceled) {
            // Use base64 string
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setProfileImage(base64Img);
        }
    };

    const handleSave = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const body = {
                name,
                mobileNo,
                gender,
                dob,
                profileImage
            };
            const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.log("Error parsing update response:", text);
                Alert.alert("Error", "Server returned an invalid response.");
                return;
            }

            if (response.ok) {
                // Update local storage too to keep it loosely synced
                const stored = await AsyncStorage.getItem('userInfo');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const updatedLocal = { ...parsed, ...data.user };
                    await AsyncStorage.setItem('userInfo', JSON.stringify(updatedLocal));
                }
                Alert.alert("Success", "Profile Updated Successfully");
                navigation.goBack();
            } else {
                Alert.alert("Error", data.message || "Failed to update profile");
            }

        } catch (e) {
            console.log("Error updating", e);
            Alert.alert("Error", "Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#E50914', '#B20710']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Image */}
                <View style={styles.imageContainer}>
                    <View style={styles.avatarWrapper}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Text style={styles.placeholderText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                            placeholder="Enter your full name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <TextInput
                            value={mobileNo}
                            onChangeText={setMobileNo}
                            style={styles.input}
                            placeholder="Enter mobile number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Gender</Text>
                            <TouchableOpacity
                                style={styles.pickerInput}
                                onPress={() => { setPickerType('gender'); setModalVisible(true); }}
                            >
                                <Text style={{ color: gender ? '#000' : '#888' }}>{gender || "Select"}</Text>
                                <Ionicons name="chevron-down" size={16} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Date of Birth</Text>
                            <TouchableOpacity
                                style={styles.pickerInput}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={{ color: dob ? '#000' : '#888' }}>{dob || "DD/MM/YYYY"}</Text>
                                <Ionicons name="calendar-outline" size={16} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Selection Modal */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        {pickerType === 'gender' && (
                            <>
                                <Text style={styles.modalTitle}>Select Gender</Text>
                                {['Male', 'Female', 'Other'].map(opt => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={styles.modalOption}
                                        onPress={() => { setGender(opt); setModalVisible(false); }}
                                    >
                                        <Text style={styles.optionText}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </View>
                </Pressable>
            </Modal>

        </SafeAreaView>
    );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageContainer: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 30,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#E50914',
    },
    placeholderAvatar: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 40,
        color: '#E50914',
        fontWeight: 'bold',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#333',
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#f9f9f9',
    },
    pickerInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#f9f9f9',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    saveBtn: {
        backgroundColor: '#E50914',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '80%',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },

});
