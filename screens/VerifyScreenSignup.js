import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';

const VerifyScreenSignup = ({ route }) => {
  const navigation = useNavigation();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // Use global language context
  const { t, language } = useLanguage();

  const input = route?.params?.userInput || '';
  const mode = route?.params?.mode || 'signup';

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
      const response = await fetch(`${API_BASE_URL}/verify-signup`, {
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
        navigation.navigate('Welcome', { selectedLanguage: language, token: data.token, user: data.user });
      } else {
        setError(data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (isResendDisabled) return;

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: input, language }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to resend OTP');
      } else {
        setTimer(60);
        setIsResendDisabled(true);
        setError('');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('Network error. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>

            {/* Back Arrow */}
            <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={normalize(26)} color="#333" />
            </TouchableOpacity>

            {/* Top Section */}
            <View style={styles.topSection}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/simple-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>{mode === 'login' ? t('signInTitle') : t('verifyDetails')}</Text>

              <View style={styles.otpInfo}>
                <Ionicons name="checkmark-circle" size={normalize(18)} color="#20B15A" />
                <Text style={styles.otpSentText}>
                  {t('otpSent')} <Text style={{ fontWeight: 'bold' }}>{input}</Text>
                </Text>
              </View>
            </View>

            {/* Middle Section */}
            <View style={styles.middleSection}>
              <Text style={styles.inputLabel}>{t('enterOtp')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={6}
                value={otp}
                onChangeText={(t) => {
                  setOtp(t);
                  setError('');
                }}
                placeholder="• • • • • •"
                placeholderTextColor="#ccc"
              />
              {error !== '' && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.actionButtonWrapper}
                onPress={handleContinue}
              >
                <LinearGradient
                  colors={['#E50914', '#FF4F58']} // Red gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.primaryButtonText}>{t('verifyAndContinue')}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResendOtp} disabled={isResendDisabled}>
                <Text style={[styles.resendLink, isResendDisabled && styles.disabledText]}>
                  {isResendDisabled ? `${t('wait')} ${timer}s` : t('resendOtpText')}
                </Text>
              </TouchableOpacity>

              <View style={styles.footerLinks}>
                <Text style={styles.footerText}>© 2025 Reel2Cart</Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyScreenSignup;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: wp(6),
    paddingBottom: hp(3), // Reduced slightly
    minHeight: hp(85), // Compact height
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  backIcon: {
    position: 'absolute',
    top: Platform.OS === 'android' ? hp(2) : hp(1),
    left: wp(5),
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  // TOP SECTION
  topSection: {
    flex: 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(5),
  },
  logoContainer: {
    width: wp(26), // Concise logo
    height: wp(26),
    borderRadius: wp(26) / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, // Subtle shadow
    shadowRadius: 10,
    elevation: 3,
    marginBottom: hp(2),
  },
  logo: {
    width: '85%',
    height: '85%',
  },
  title: {
    fontSize: normalize(21),
    fontWeight: '700',
    color: '#000', // Visible Black
    marginBottom: hp(0.5),
    textAlign: 'center',
  },
  otpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9', // Sharper Background
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(4),
    borderRadius: 20,
    marginTop: hp(1),
    borderWidth: 1,
    borderColor: '#c8e6c9', // Defined Border
  },
  otpSentText: {
    marginLeft: wp(2),
    fontSize: normalize(12.5),
    color: '#2e7d32', // Visible Green
    fontWeight: '500',
  },

  // MIDDLE SECTION
  middleSection: {
    flex: 0.25,
    justifyContent: 'center',
    width: '100%',
  },
  inputLabel: {
    fontSize: normalize(13.5),
    color: '#333', // Visible Dark Gray
    fontWeight: '600',
    marginBottom: hp(1.5),
    alignSelf: 'center',
    letterSpacing: 0.3,
  },
  input: {
    width: '100%',
    height: hp(6.5), // Balanced
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 14,
    fontSize: normalize(22),
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: '#f8f9fa', // Professional Off-White
    color: '#000', // Visible Black
    fontWeight: '700',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: normalize(12),
    marginTop: hp(1),
    textAlign: 'center',
    fontWeight: '500',
  },

  // BOTTOM SECTION
  bottomSection: {
    flex: 0.3,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  actionButtonWrapper: {
    width: '100%',
    borderRadius: 28,
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: hp(2.5),
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: normalize(15.5),
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  resendLink: {
    color: '#0066CC', // Visible Link Blue
    fontSize: normalize(13.5),
    fontWeight: '600',
    marginBottom: hp(4),
  },
  disabledText: {
    color: '#999',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: normalize(11),
    color: '#666', // Visible Footer
    fontWeight: '500',
  },
});
