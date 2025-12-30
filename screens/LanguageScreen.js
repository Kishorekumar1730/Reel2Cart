import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import { wp, hp, normalize } from "../utils/responsive";
import { useLanguage } from "../context/LanguageContext";

const languages = [
  { label: "English", color: "#FFC1C1" },
  { label: "தமிழ்", color: "#B0FFB0" },
  { label: "తెలుగు", color: "#ADD8E6" },
  { label: "हिंदी", color: "#FFE4B5" },
  { label: "മലയാളം", color: "#D1C4E9" },
  { label: "ಕನ್ನಡ", color: "#E1BEE7" },
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Top Section: Logo */}
        <View style={styles.topSection}>
          {fromSettings && (
            <TouchableOpacity style={{ position: 'absolute', left: 0, top: 0, zIndex: 10 }} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
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

        {/* Middle Section: Grid */}
        <View style={styles.grid}>
          {languages.map((lang, index) => {
            const isSelected = selectedLang?.label === lang.label;
            return (
              <Pressable
                key={index}
                style={[
                  styles.card,
                  { backgroundColor: lang.color },
                  isSelected && styles.cardSelected,
                ]}
                onPress={() => setSelectedLang(lang)}
              >
                <Ionicons
                  name="play-circle"
                  size={24}
                  color="rgba(0,0,0,0.15)"
                  style={styles.cardIcon}
                />

                <Text style={[
                  styles.languageText,
                  isSelected && styles.languageTextSelected
                ]}>{lang.label}</Text>

                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Bottom Section: Continue */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.continueWrapper, !selectedLang && styles.disabledButton]}
            disabled={!selectedLang}
            onPress={handleContinue}
          >
            {selectedLang ? (
              <LinearGradient
                colors={['#E50914', '#B20710']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.continueText}>
                  {fromSettings ? t('save') : t('continue')}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.placeholderButton}>
                <Text style={styles.placeholderButtonText}>{t('selectLang')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LanguageScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    paddingVertical: hp(4),
    paddingHorizontal: wp(6),
    alignItems: "center",
    flexGrow: 1,
  },

  // Header / Logo
  topSection: {
    alignItems: 'center',
    marginBottom: hp(4),
    marginTop: hp(2),
  },
  logoContainer: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(28) / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: hp(2),
  },
  logo: {
    width: '95%',
    height: '95%',
  },
  title: {
    fontSize: normalize(22),
    fontWeight: "700",
    color: '#000',
    textAlign: "center",
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: normalize(14),
    color: '#444',
    textAlign: "center",
    paddingHorizontal: wp(4),
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: hp(4),
  },
  card: {
    width: wp(42),
    height: hp(12),
    borderRadius: 16,
    marginBottom: hp(2),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1, // Added for visibility
    borderColor: 'rgba(0,0,0,0.1)', // Subtle border
  },
  cardIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cardSelected: {
    borderWidth: 2.5,
    borderColor: '#E50914',
    transform: [{ scale: 1.02 }],
  },
  languageText: {
    fontSize: normalize(18),
    fontWeight: "700",
    color: '#000',
    zIndex: 1,
    letterSpacing: 0.5,
  },
  languageTextSelected: {
    fontSize: normalize(19),
    fontWeight: "800",
  },
  checkmark: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Continue Button
  bottomSection: {
    width: '100%',
    marginBottom: hp(2),
  },
  continueWrapper: {
    width: '100%',
    borderRadius: 30,
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: 'center',
  },
  placeholderButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  placeholderButtonText: {
    color: '#888',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  continueText: {
    color: "#fff",
    fontSize: normalize(17),
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
});
