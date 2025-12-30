import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const WelcomeScreen = ({ navigation }) => {
  const { t } = useLanguage();

  // Auto-navigation after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/app-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.welcomeText}>{t('langTitle')}</Text>
      <Text style={styles.taglineText}>{t('tagline')}</Text>

      <TouchableOpacity
        style={styles.bottomIndicator}
      />
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    marginBottom: 10,
  },
  taglineText: {
    fontSize: 16,
    color: '#000',
    marginTop: 6,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: 15,
    width: 200,
    height: 5,
    backgroundColor: '#000',
    borderRadius: 3,
  },
});
