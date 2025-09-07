import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreenExpo from 'expo-splash-screen';
import { useAppDispatch } from '../utils/hooks';
import { setFirstLaunch, setOnboardingCompleted } from '../store/launcherSlice';

// Prevent native splash screen from auto-hiding
SplashScreenExpo.preventAutoHideAsync();

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const [isReady, setIsReady] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  
  useEffect(() => {
    prepareLaunch();
  }, []);
  
  const prepareLaunch = async () => {
    try {
      // Start animations
      startAnimations();
      
      // Prepare app data
      await Promise.all([
        preloadAppData(),
        new Promise(resolve => setTimeout(resolve, 2000)),
      ]);
      
      setIsReady(true);
      
      // Check onboarding status
      const needsOnboarding = await checkOnboardingStatus();
      
      setTimeout(() => {
        handleSplashComplete(needsOnboarding);
      }, 1000);
      
    } catch (error) {
      console.error('Error during splash preparation:', error);
      setTimeout(() => {
        handleSplashComplete(true);
      }, 3000);
    }
  };
  
  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const preloadAppData = async () => {
    try {
      await AsyncStorage.getItem('@ai_dungeon:recent_games');
      await AsyncStorage.getItem('@ai_dungeon:user_preferences');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  };
  
  const checkOnboardingStatus = async () => {
    try {
      const hasCompleted = await AsyncStorage.getItem('@ai_dungeon:onboarding_completed');
      const isFirst = await AsyncStorage.getItem('@ai_dungeon:first_launch');
      
      const needsOnboarding = !hasCompleted || isFirst === null;
      
      dispatch(setFirstLaunch(isFirst === null));
      dispatch(setOnboardingCompleted(!!hasCompleted));
      
      return needsOnboarding;
    } catch (error) {
      return true;
    }
  };
  
  const handleSplashComplete = async (needsOnboarding: boolean) => {
    try {
      await SplashScreenExpo.hideAsync();
      
      if (needsOnboarding) {
        navigation.navigate('Onboarding' as never);
      } else {
        navigation.navigate('MainTabs' as never);
      }
    } catch (error) {
      navigation.navigate('MainTabs' as never);
    }
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d1b69', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🏰</Text>
            </View>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>AI Dungeon</Text>
            <Text style={styles.subtitle}>Your adventure awaits</Text>
          </View>
          
          {isReady && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.loadingText}>Preparing your adventure...</Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  logoText: {
    fontSize: 48,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f3f4f6',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '300',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '400',
  },
});