import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as SplashScreenModule from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const navigation = useNavigation();
  const [nextScreen, setNextScreen] = useState('Language');

  const assetId = require('../../assets/custom-splash.mp4');

  const player = useVideoPlayer(assetId, (player) => {
    player.loop = false;
    player.play();
  });
  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreenModule.preventAutoHideAsync();

        // Check authentication state
        const token = await AsyncStorage.getItem('authToken');
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (token && userInfo) {
          setNextScreen('Home');
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  // Monitor video status to ensure smooth transition
  useEffect(() => {
    const subscription = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) {
        // Only hide native splash when video is actually playing
        // This ensures the first frame the user sees is the video moving
        SplashScreenModule.hideAsync().catch(() => { });
      }
    });

    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      navigation.replace(nextScreen);
    });
    return () => subscription.remove();
  }, [player, nextScreen]);

  return (
    <View style={styles.container}>
      {/* Hide Status Bar for immersive experience */}
      <StatusBar hidden />
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});

