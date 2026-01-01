import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: false, // width/height don't support native driver
      })
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 4000); // 4 seconds for better experience
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#F9F9FF', '#E8DFF5', '#CBF1F5']}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Image
            source={require('../assets/app-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.welcomeText}>Reel2Cart</Text>
          <Text style={styles.taglineText}>{t('tagline')}</Text>
        </Animated.View>

        <View style={[styles.footer, { marginBottom: insets.bottom + 40 }]}>
          <View style={styles.loaderBarContainer}>
            <Animated.View
              style={[
                styles.loaderBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 300,
    maxHeight: 300,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  welcomeText: {
    fontSize: Math.min(width * 0.1, 42),
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1,
    textAlign: 'center',
  },
  taglineText: {
    fontSize: Math.min(width * 0.045, 18),
    color: '#4A4A4A',
    marginTop: height * 0.01,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  loaderBarContainer: {
    width: width * 0.4,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
});
