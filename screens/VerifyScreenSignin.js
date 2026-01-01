import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Image, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const VerifyScreenSignin = ({ route }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(60);
    const [isResendDisabled, setIsResendDisabled] = useState(true);

    const { t, language } = useLanguage();

    const input = route?.params?.userInput || '';
    const mode = 'signin'; // Explicitly signin/2FA

    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            setIsResendDisabled(true);
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setIsResendDisabled(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleContinue = async () => {
        if (!/^\d{6}$/.test(otp)) {
            setError(t('otpError'));
            return;
        }
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/verify-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: input, otp }),
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('authToken', data.token);
                if (data.user) {
                    await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
                }
                // Navigate to Welcome
                navigation.navigate('Welcome', { selectedLanguage: language, token: data.token, user: data.user });
            } else {
                setError(data.message || t('verificationFailed'));
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            setError(t('networkError'));
        }
    };

    const handleResendOtp = async () => {
        if (isResendDisabled) return;

        try {
            // Reuse login request to resend OTP
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: input, language }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || t('failedResendOtp'));
            } else {
                setTimer(60);
                setIsResendDisabled(true);
                setError('');
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            setError(t('networkError'));
        }
    };

    return (
        <View style={styles.masterContainer}>
            <LinearGradient
                colors={['#F9F9FF', '#E8DFF5', '#CBF1F5']}
                style={styles.container}
            >
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
                <SafeAreaView style={styles.safeArea}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContainer}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => navigation.goBack()}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.content}>
                                {/* Top Section */}
                                <View style={styles.topSection}>
                                    <View style={styles.logoWrapper}>
                                        <LinearGradient
                                            colors={['#FFFFFF', '#F3F4F6']}
                                            style={styles.logoGradient}
                                        >
                                            <Image
                                                source={require('../assets/simple-logo.png')}
                                                style={styles.logo}
                                                resizeMode="contain"
                                            />
                                        </LinearGradient>
                                    </View>

                                    <Text style={styles.title}>{t('twoStepVerification')}</Text>

                                    <View style={styles.otpStatusBadge}>
                                        <MaterialCommunityIcons name="shield-check" size={18} color="#059669" />
                                        <Text style={styles.otpSentText}>
                                            {t('secureCodeSent')} <Text style={styles.boldEmail}>{input}</Text>
                                        </Text>
                                    </View>
                                </View>

                                {/* Middle Section */}
                                <View style={styles.formContainer}>
                                    <Text style={styles.inputLabel}>{t('enterSixDigit')}</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.otpInput}
                                            keyboardType="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChangeText={(v) => {
                                                setOtp(v);
                                                setError('');
                                            }}
                                            placeholder="000000"
                                            placeholderTextColor="#D1D5DB"
                                        />
                                    </View>
                                    {error !== '' && (
                                        <View style={styles.errorContainer}>
                                            <Ionicons name="alert-circle" size={16} color="#DC2626" />
                                            <Text style={styles.errorText}>{error}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Bottom Section */}
                                <View style={styles.actionSection}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={handleContinue}
                                    >
                                        <LinearGradient
                                            colors={['#FF512F', '#DD2476']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.submitButton}
                                        >
                                            <Text style={styles.submitButtonText}>{t('confirmIdentity')}</Text>
                                            <Ionicons name="shield-checkmark" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleResendOtp}
                                        disabled={isResendDisabled}
                                        style={styles.resendButton}
                                    >
                                        <Text style={[styles.resendText, isResendDisabled && styles.disabledResendText]}>
                                            {isResendDisabled ? t('resendAvailable').replace('{timer}', timer) : t('resendCode')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.footer}>
                                <Text style={styles.copyrightText}>{t('securityByGuard')}</Text>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

export default VerifyScreenSignin;

const styles = StyleSheet.create({
    masterContainer: { flex: 1 },
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    topSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoWrapper: {
        width: 80,
        height: 80,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 4,
    },
    logoGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    otpStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    otpSentText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#4338CA',
        fontWeight: '500',
    },
    boldEmail: {
        fontWeight: '700',
    },
    formContainer: {
        width: '100%',
        marginBottom: 40,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 16,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    otpInput: {
        fontSize: 36,
        fontWeight: '800',
        textAlign: 'center',
        color: '#111827',
        letterSpacing: 12,
        paddingHorizontal: 20,
        height: 70,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    actionSection: {
        width: '100%',
    },
    submitButton: {
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#FF512F",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    resendButton: {
        marginTop: 20,
        alignItems: 'center',
        paddingVertical: 10,
    },
    resendText: {
        fontSize: 15,
        color: '#4F46E5',
        fontWeight: '700',
    },
    disabledResendText: {
        color: '#9CA3AF',
        fontWeight: '600',
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingTop: 30,
    },
    copyrightText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
});
