import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, Pressable, Platform, KeyboardAvoidingView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, normalize } from '../utils/responsive';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../context/LanguageContext';

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

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
            mediaTypes: ['images'],
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
                Alert.alert(t('error'), "Server returned an invalid response.");
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
                Alert.alert(t('success'), t('profileUpdated'));
                navigation.goBack();
            } else {
                Alert.alert(t('error'), data.message || t('failedToUpdate'));
            }

        } catch (e) {
            console.log("Error updating", e);
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
                        <Text style={styles.headerTitle}>{t('editProfile')}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Profile Image */}
                        <View style={styles.imageContainer}>
                            <View style={styles.avatarWrapper}>
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={styles.avatar} />
                                ) : (
                                    <LinearGradient colors={['#eee', '#ddd']} style={[styles.avatar, styles.placeholderAvatar]}>
                                        <Text style={styles.placeholderText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                                    </LinearGradient>
                                )}
                                <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
                                    <LinearGradient colors={['#333', '#000']} style={styles.cameraGradient}>
                                        <Ionicons name="camera" size={normalize(18)} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formCard}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('fullName')}</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    style={styles.input}
                                    placeholder={t('enterFullName')}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('mobileNumber')}</Text>
                                <TextInput
                                    value={mobileNo}
                                    onChangeText={setMobileNo}
                                    style={styles.input}
                                    placeholder={t('enterMobile')}
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: wp(3) }]}>
                                    <Text style={styles.label}>{t('gender')}</Text>
                                    <TouchableOpacity
                                        style={styles.pickerInput}
                                        onPress={() => { setPickerType('gender'); setModalVisible(true); }}
                                    >
                                        <Text style={{ color: gender ? '#333' : '#999', fontSize: normalize(14) }}>{gender ? t(gender.toLowerCase()) : t('select')}</Text>
                                        <Ionicons name="chevron-down" size={normalize(16)} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>{t('dob')}</Text>
                                    <TouchableOpacity
                                        style={styles.pickerInput}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Text style={{ color: dob ? '#333' : '#999', fontSize: normalize(14) }}>{dob || "DD/MM/YYYY"}</Text>
                                        <Ionicons name="calendar-outline" size={normalize(16)} color="#666" />
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

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#E50914', '#B81C26']}
                                    style={styles.saveBtnGradient}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('saveChanges')}</Text>}
                                </LinearGradient>
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
                                        <Text style={styles.modalTitle}>{t('selectGender')}</Text>
                                        {['Male', 'Female', 'Other'].map(opt => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={styles.modalOption}
                                                onPress={() => { setGender(opt); setModalVisible(false); }}
                                            >
                                                <Text style={[styles.optionText, gender === opt && { color: '#E50914', fontWeight: 'bold' }]}>{t(opt.toLowerCase())}</Text>
                                                {gender === opt && <Ionicons name="checkmark" size={normalize(18)} color="#E50914" />}
                                            </TouchableOpacity>
                                        ))}
                                    </>
                                )}
                            </View>
                        </Pressable>
                    </Modal>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default EditProfileScreen;

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
    imageContainer: {
        alignItems: 'center',
        marginTop: hp(4),
        marginBottom: hp(4),
    },
    avatarWrapper: {
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    avatar: {
        width: wp(32),
        height: wp(32),
        borderRadius: wp(16),
        borderWidth: 4,
        borderColor: '#fff',
    },
    placeholderAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: normalize(40),
        color: '#888',
        fontWeight: 'bold',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: wp(5),
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 4,
    },
    cameraGradient: {
        padding: wp(2.5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    formCard: {
        marginHorizontal: wp(5),
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 20,
        padding: wp(6),
        // Removed shadows/elevation for clean look
    },
    inputGroup: {
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
        borderRadius: 12,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        fontSize: normalize(15),
        color: '#333',
        backgroundColor: '#fff',
        // Removed borders and shadows
    },
    pickerInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        backgroundColor: '#fff',
        // Removed borders and shadows
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    saveBtn: {
        marginTop: hp(2),
        borderRadius: 12,
        overflow: 'hidden',
        // Removed shadow for consistency or keep if it's a call to action? keeping valid shadow for button is usually okay, but let's stick to flat if requested. 
        // User asked "remove grey borders", usually means on boxes/inputs. I'll leave button shadow as it's 'glow' usually.
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '80%',
        borderRadius: 16,
        padding: wp(5),
        // Keep elevation for modal to float
        elevation: 5,
    },
    modalTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        marginBottom: hp(2),
        textAlign: 'center',
        color: '#333',
    },
    modalOption: {
        paddingVertical: hp(1.8),
        // Removed borderBottom
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        fontSize: normalize(16),
        color: '#333',
    },
});
