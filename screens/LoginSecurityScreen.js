import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, Alert, Switch, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
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
                // Simulated 2FA state from local storage preference for now
                const twoFactorPref = await AsyncStorage.getItem(`2fa_${u._id}`);
                setTwoFactor(twoFactorPref === 'true');
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
                    // Email update might require re-verification logic, skipping for safety or allow if backend permits
                    // Backend allows it.
                })
            });
            const data = await response.json();
            if (response.ok) {
                await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
                setUser(data.user);
                Alert.alert("Success", "Profile updated successfully");
            } else {
                Alert.alert("Error", data.message || "Failed to update profile");
            }
        } catch (error) {
            Alert.alert("Error", "Network error");
        } finally {
            setSaving(false);
        }
    };

    const toggleTwoFactor = async (val) => {
        setTwoFactor(val);
        if (user) {
            await AsyncStorage.setItem(`2fa_${user._id}`, val.toString());
            // In a real app, this would call an API to enable server-side 2FA checks
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your Reel2Cart account? This action is permanent and cannot be undone. All your data, orders, and history will be lost.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Permanent",
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
                Alert.alert("Account Deleted", "We are sorry to see you go.", [
                    { text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Open' }] }) }
                ]);
            } else {
                const data = await response.json();
                Alert.alert("Error", data.message || "Could not delete account");
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Login & Security</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                        />
                        <AnimatedButton style={styles.editBtn} onPress={handleUpdate}>
                            <Text style={styles.editBtnText}>Edit</Text>
                        </AnimatedButton>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            value={mobile}
                            onChangeText={setMobile}
                            keyboardType="phone-pad"
                            placeholder="+91"
                        />
                        <AnimatedButton style={styles.editBtn} onPress={handleUpdate}>
                            <Text style={styles.editBtnText}>Edit</Text>
                        </AnimatedButton>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#f0f0f0', color: '#888' }]}
                            value={email}
                            editable={false}
                        />
                        {/* Email usually locked or requires specific flow */}
                    </View>
                </View>

                {/* Save Changes Button Area */}
                <AnimatedButton
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleUpdate}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                </AnimatedButton>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security Settings</Text>

                    <View style={styles.rowItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>Two-Step Verification</Text>
                            <Text style={styles.rowSubtitle}>Require an OTP for every new login.</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: "#E50914" }}
                            thumbColor={twoFactor ? "#fff" : "#f4f3f4"}
                            onValueChange={toggleTwoFactor}
                            value={twoFactor}
                        />
                    </View>
                </View>

                <View style={[styles.section, { marginTop: 20, borderColor: '#ffcccb', borderWidth: 1 }]}>
                    <Text style={[styles.sectionTitle, { color: '#D32F2F' }]}>Danger Zone</Text>
                    <Text style={styles.warningText}>
                        Deleting your account will permanently remove all your data, including order history and wishlist.
                    </Text>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                        <Text style={styles.deleteButtonText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#333',
    },
    backBtn: {
        padding: 5,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    inputGroup: {
        marginBottom: 15,
        position: 'relative'
    },
    label: {
        fontSize: normalize(13),
        color: '#666',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: normalize(15),
        color: '#333',
        backgroundColor: '#fff'
    },
    editBtn: {
        position: 'absolute',
        right: 10,
        bottom: 12,
        paddingHorizontal: 10,
    },
    editBtnText: {
        color: '#E50914',
        fontWeight: '600',
        fontSize: normalize(13)
    },
    saveButton: {
        backgroundColor: '#000',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: normalize(16),
        fontWeight: 'bold',
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowTitle: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: '#333',
    },
    rowSubtitle: {
        fontSize: normalize(12),
        color: '#888',
        marginTop: 2,
    },
    warningText: {
        fontSize: normalize(13),
        color: '#555',
        marginBottom: 15,
        lineHeight: 20,
    },
    deleteButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D32F2F',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: normalize(14),
    }
});

export default LoginSecurityScreen;
