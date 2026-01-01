import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Platform, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, normalize, isTablet } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';

const OpenScreen = () => {
  const navigation = useNavigation();
  const { language, t } = useLanguage();

  const FEATURES = [
    { id: 1, text: t('feature1'), icon: 'heart-outline', color: '#e31837' },
    { id: 2, text: t('feature2'), icon: 'play-circle-outline', color: '#e31837' },
    { id: 3, text: t('feature3'), icon: 'location-outline', color: '#e31837' },
  ];

  return (
    <LinearGradient
      colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          {/* Back Arrow */}
          <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={normalize(26)} color="#333" />
          </TouchableOpacity>

          {/* Top Section: Logo & Title */}
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/simple-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>{t('openTitle')}</Text>
          </View>

          {/* Middle Section: Features */}
          <View style={styles.middleSection}>
            {FEATURES.map(feature => (
              <View key={feature.id} style={styles.featureItem}>
                <Ionicons name={feature.icon} size={normalize(20)} color={feature.color} style={styles.featureIcon} />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Bottom Section: Actions */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionButtonWrapper}
              onPress={() => navigation.navigate('Login', { language })}
            >
              <LinearGradient
                colors={['#E50914', '#B20710']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.primaryButtonText}>{t('signInBtn')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton]}
              onPress={() => navigation.navigate('Register', { language })}
            >
              <Text style={styles.secondaryButtonText}>{t('createAccountBtn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipLink}
              onPress={() => navigation.navigate('Welcome', { language })}
            >
              <Text style={styles.skipText}>{t('skipBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default OpenScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between', // Distribute space evenly
    paddingBottom: hp(4),
    paddingHorizontal: wp(6),
    maxWidth: 600, // Limit width for tablets
    alignSelf: 'center', // Center on tablets
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

  // SECTION 1: Top
  topSection: {
    flex: 0.45, // Takes ~45% of screen
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(4),
  },
  logoContainer: {
    width: wp(45),
    height: wp(45), // Square container
    maxWidth: 220,
    maxHeight: 220,
    borderRadius: wp(45) / 2, // Optional: circle or just contain
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    backgroundColor: '#fff',
    marginBottom: hp(3),
  },
  logo: {
    width: '85%',
    height: '85%',
  },
  title: {
    fontSize: normalize(22),
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    paddingHorizontal: wp(2),
  },

  // SECTION 2: Middle
  middleSection: {
    flex: 0.25, // Takes ~25%
    justifyContent: 'center',
    alignItems: 'flex-start', // Left align text for better readability
    paddingHorizontal: wp(4),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align back to top for multi-line text
    marginBottom: hp(1.5),
    width: '100%',
  },
  featureIcon: {
    marginRight: wp(3),
    width: normalize(24),
    textAlign: 'center',
    marginTop: 2, // Optical alignment with first line of text
  },
  featureText: {
    flex: 1, // Allow text to take remaining space
    flexWrap: 'wrap', // Ensure long text wraps
    fontSize: normalize(15),
    color: '#555',
    fontWeight: '500',
    lineHeight: normalize(22),
  },

  // SECTION 3: Bottom Actions
  bottomSection: {
    flex: 0.3, // Takes ~30%
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: hp(1),
  },
  actionButtonWrapper: {
    width: '100%',
    borderRadius: 30,
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: hp(2),
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 16, // Fixed comfortable touch height
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  skipLink: {
    alignSelf: 'center',
    padding: 10,
  },
  skipText: {
    fontSize: normalize(14),
    color: '#777',
    textDecorationLine: 'underline',
  },
});
