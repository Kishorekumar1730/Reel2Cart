import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated, Text, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';


const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  // Animation values
  const logoScale = new Animated.Value(0.8);
  const fadeAnim = new Animated.Value(0);
  const progressAnim = new Animated.Value(0);

  // Fixed Text (Simpler & More Stable)
  const appName = "Reel2Cart";
  const tagline = "Future of Shopping";

  useEffect(() => {
    // Parallel Start: FadeIn, ScaleUp, and ProgressBar
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2800, // Finish slightly before navigation
        useNativeDriver: false, // width/height needs native:false
        easing: Easing.out(Easing.ease),
      })
    ]).start(() => {
      // Continuous gentle pulse after entrance
      startPulse();
    });

    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.centerContent}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: logoScale }]
                }
              ]}
            >
              <Image
                source={require('../../assets/simple-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
              <Text style={styles.appName}>{appName}</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
            </View>

            <Text style={styles.copyright}>© 2025 Reel2Cart</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50, // Visual offset
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    maxWidth: 220,
    maxHeight: 220,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937', // Dark Gray
    letterSpacing: 1,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280', // Medium Gray
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  progressContainer: {
    width: width * 0.5, // 50% width
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E50914', // Brand Red
    borderRadius: 2,
  },
  copyright: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  }
});
