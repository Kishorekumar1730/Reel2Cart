import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import { wp, hp, normalize } from "../utils/responsive";
import { useLanguage } from "../context/LanguageContext";

const languages = [
  { label: "English", sub: "English" },
  { label: "العربية", sub: "Arabic (UAE)" },
  { label: "தமிழ்", sub: "Tamil" },
  { label: "తెలుగు", sub: "Telugu" },
  { label: "हिंदी", sub: "Hindi" },
  { label: "മലയാളം", sub: "Malayalam" },
  { label: "ಕನ್ನಡ", sub: "Kannada" },
];

const LanguageScreen = ({ route }) => {
  const { language, setLanguage, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(null);
  const navigation = useNavigation();
  const { fromSettings } = route.params || {};

  // Pre-select current language
  useEffect(() => {
    const current = languages.find(l => l.label === language);
    if (current) setSelectedLang(current);
  }, [language]);

  const handleContinue = async () => {
    if (selectedLang) {
      await setLanguage(selectedLang.label);
      if (fromSettings) {
        navigation.goBack();
      } else {
        navigation.navigate("Open");
      }
    }
  };

  return (
    <LinearGradient
      colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Header Section */}
          <View style={styles.topSection}>
            {fromSettings && (
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={normalize(26)} color="#333" />
              </TouchableOpacity>
            )}

            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/simple-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>{t('langTitle')}</Text>
            <Text style={styles.subtitle}>{t('langSubtitle')}</Text>
          </View>

          {/* Language Grid */}
          <View style={styles.grid}>
            {languages.map((lang, index) => {
              const isSelected = selectedLang?.label === lang.label;
              return (
                <Pressable
                  key={index}
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                  onPress={() => setSelectedLang(lang)}
                >
                  <View style={styles.cardContent}>
                    <Text style={[
                      styles.languageText,
                      isSelected && styles.languageTextSelected
                    ]}>{lang.label}</Text>
                    <Text style={[
                      styles.subText,
                      isSelected && styles.subTextSelected
                    ]}>{lang.sub}</Text>
                  </View>

                  {/* Minimal Radio Indicator */}
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

        </ScrollView>

        {/* Bottom Button Area */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.continueButtonShadow, !selectedLang && styles.disabledShadow]}
            disabled={!selectedLang}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={selectedLang ? ['#E50914', '#B20710'] : ['#E0E0E0', '#F5F5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={[styles.continueText, !selectedLang && { color: '#AAA' }]}>
                {fromSettings ? t('save') : t('continue')}
              </Text>
              {selectedLang && <Ionicons name="arrow-forward" size={normalize(20)} color="#fff" style={{ marginLeft: 8 }} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
};

export default LanguageScreen;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: hp(4),
    paddingHorizontal: wp(6),
    paddingBottom: hp(15),
    alignItems: "center",
  },

  // Header
  topSection: {
    alignItems: 'center',
    marginBottom: hp(5),
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 15,
  },
  logoContainer: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3),
    shadowColor: "#E8DFF5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    width: '70%',
    height: '70%',
  },
  title: {
    fontSize: normalize(26),
    fontWeight: "800",
    color: '#1a1a1a',
    textAlign: "center",
    marginBottom: hp(1),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: normalize(15),
    color: '#666',
    textAlign: "center",
    lineHeight: normalize(26),
    maxWidth: '85%',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  card: {
    width: '48%',
    minHeight: hp(16),
    paddingVertical: hp(2),
    borderRadius: 24,
    marginBottom: hp(2.5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 0, // No border implies clean minimal look
    shadowColor: "#E8DFF5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Subtle shadow for lift
    shadowRadius: 10,
    elevation: 1,
  },
  cardSelected: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E50914',
    shadowColor: "#E50914",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    marginTop: -10,
  },
  languageText: {
    fontSize: normalize(20),
    fontWeight: "700",
    color: '#333',
    marginBottom: 6,
  },
  languageTextSelected: {
    color: '#E50914',
  },
  subText: {
    fontSize: normalize(12),
    color: '#999',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  subTextSelected: {
    color: '#E50914',
    opacity: 0.8,
  },

  // Radio
  radioOuter: {
    position: 'absolute',
    bottom: 15,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)', // Extremely subtle ring for layout
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  radioOuterSelected: {
    borderColor: '#E50914',
    backgroundColor: '#fff',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E50914',
  },

  // Bottom Area
  bottomContainer: {
    position: 'absolute',
    bottom: hp(5),
    left: wp(6),
    right: wp(6),
  },
  continueButtonShadow: {
    width: '100%',
    borderRadius: 30,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledShadow: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientButton: {
    paddingVertical: hp(2.2),
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: 'center',
  },
  continueText: {
    color: "#fff",
    fontSize: normalize(18),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
