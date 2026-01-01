import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, Alert, Switch, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from '../components/AnimatedButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';

const LoginSecurityScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit States
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [twoFactor, setTwoFactor] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const stored = await AsyncStorage.getItem('userInfo');
            if (stored) {
                const u = JSON.parse(stored);
                setUser(u);
                setName(u.name || '');
                setMobile(u.mobileNo || '');
                setEmail(u.email || '');
                setTwoFactor(u.twoFactorEnabled || false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    mobileNo: mobile,
                })
            });
            const data = await response.json();
            if (response.ok) {
                await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
                setUser(data.user);
                Alert.alert(t('success'), t('profileUpdated'));
            } else {
                Alert.alert(t('error'), data.message || t('failedUpdateProfile'));
            }
        } catch (error) {
            Alert.alert(t('error'), t('networkError'));
        } finally {
            setSaving(false);
        }
    };

    const toggleTwoFactor = async (val) => {
        if (!user) return;
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    twoFactorEnabled: val
                })
            });
            const data = await response.json();
            if (response.ok) {
                setTwoFactor(val);
                await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
                setUser(data.user);
            } else {
                Alert.alert(t('error'), data.message || t('failedToggleSecurity'));
            }
        } catch (e) {
            Alert.alert(t('error'), t('networkError'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('deleteAccount'),
            t('deleteAccountConfirm'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('deletePerm'),
                    style: "destructive",
                    onPress: confirmDelete
                }
            ]
        );
    };

    const confirmDelete = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user/${user._id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await AsyncStorage.clear();
                Alert.alert(t('accountDeleted'), t('sorryToSeeYouGo'), [
                    { text: t('ok'), onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Open' }] }) }
                ]);
            } else {
                const data = await response.json();
                Alert.alert(t('error'), data.message || t('failedDeleteAccount') || "Could not delete account");
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            Alert.alert(t('error'), t('somethingWentWrong') || "Something went wrong");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']} style={styles.container}>
                <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#E50914" />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={normalize(26)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('loginSecurity')}</Text>
                    <View style={{ width: 30 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Profile Section */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>{t('profileInfo')}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('fullName')}</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={normalize(18)} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t('enterName') || "Enter your name"}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('mobileNumber')}</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={normalize(18)} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={mobile}
                                    onChangeText={setMobile}
                                    keyboardType="phone-pad"
                                    placeholder="+91"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('emailAddress')}</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0,0,0,0.03)' }]}>
                                <Ionicons name="mail-outline" size={normalize(18)} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: '#888' }]}
                                    value={email}
                                    editable={false}
                                />
                                <Ionicons name="lock-closed-outline" size={normalize(16)} color="#999" style={{ marginRight: 10 }} />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleUpdate}
                            disabled={saving}
                        >
                            <LinearGradient
                                colors={['#E50914', '#B20710']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.saveBtnGradient}
                            >
                                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{t('saveChanges') || 'Save Changes'}</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Security Settings */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>{t('securitySettings')}</Text>

                        <View style={styles.rowItem}>
                            <View style={{ flex: 1, marginRight: wp(4) }}>
                                <Text style={styles.rowTitle}>{t('twoFactorAuth')}</Text>
                                <Text style={styles.rowSubtitle}>{t('twoFactorDesc')}</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#ccc", true: "#E50914" }}
                                thumbColor={"#fff"}
                                onValueChange={toggleTwoFactor}
                                value={twoFactor}
                            />
                        </View>
                    </View>

                    {/* Danger Zone */}
                    <View style={[styles.glassCard, styles.dangerCard]}>
                        <View style={styles.dangerHeader}>
                            <Ionicons name="warning-outline" size={normalize(20)} color="#D32F2F" />
                            <Text style={[styles.sectionTitle, { color: '#D32F2F', marginBottom: 0, marginLeft: 8 }]}>{t('dangerZone')}</Text>
                        </View>

                        <Text style={styles.warningText}>
                            {t('deleteWarning')}
                        </Text>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                            <Text style={styles.deleteButtonText}>{t('deletePerm')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: hp(5) }} />

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: '#1a1a1a',
    },
    backBtn: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    scrollContent: {
        paddingHorizontal: wp(6),
        paddingTop: hp(2),
        paddingBottom: hp(10),
    },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 20,
        padding: wp(5),
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: "#E8DFF5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: hp(2.5),
    },
    inputGroup: {
        marginBottom: hp(2.5),
    },
    label: {
        fontSize: normalize(13),
        color: '#555',
        marginBottom: 8,
        fontWeight: '600',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 12,
        height: hp(6),
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: normalize(15),
        color: '#333',
        height: '100%',
    },
    saveBtn: {
        marginTop: hp(1),
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#E50914",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnGradient: {
        paddingVertical: hp(1.8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: normalize(15),
        fontWeight: 'bold',
    },
    rowItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowTitle: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    rowSubtitle: {
        fontSize: normalize(13),
        color: '#777',
        lineHeight: normalize(18),
    },
    dangerCard: {
        borderColor: 'rgba(229, 9, 20, 0.1)',
        backgroundColor: 'rgba(255, 240, 240, 0.4)',
    },
    dangerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    warningText: {
        fontSize: normalize(13),
        color: '#555',
        lineHeight: normalize(20),
        marginBottom: hp(2.5),
    },
    deleteButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D32F2F',
        borderRadius: 12,
        paddingVertical: hp(1.5),
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#D32F2F',
        fontSize: normalize(14),
        fontWeight: '700',
    }
});

export default LoginSecurityScreen;
