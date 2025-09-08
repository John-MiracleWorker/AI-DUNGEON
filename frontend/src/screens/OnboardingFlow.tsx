import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAppDispatch } from '../utils/hooks';
import { setOnboardingCompleted, addFavoriteGenre } from '../store/launcherSlice';

const { width } = Dimensions.get('window');

const genres = [
  { key: 'fantasy', label: 'Fantasy', icon: 'flame', color: '#8b5cf6' },
  { key: 'sci-fi', label: 'Sci-Fi', icon: 'planet', color: '#06d6a0' },
  { key: 'horror', label: 'Horror', icon: 'skull', color: '#ef4444' },
  { key: 'modern', label: 'Modern', icon: 'business', color: '#f59e0b' },
];

interface OnboardingSlideProps {
  onNext: () => void;
  onSkip: () => void;
  isLast?: boolean;
}

const WelcomeSlide: React.FC<OnboardingSlideProps> = ({ onNext, onSkip }) => {
  return (
    <View style={styles.slide}>
      <Text style={styles.slideTitle}>Welcome to AI Dungeon</Text>
      <Text style={styles.slideText}>
        Embark on unlimited adventures powered by artificial intelligence.
        Your choices shape the story!
      </Text>
      <View style={styles.iconContainer}>
        <Ionicons name="home" size={80} color="#8b5cf6" />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const GenrePreviewSlide: React.FC<OnboardingSlideProps> = ({ onNext, onSkip }) => {
  const dispatch = useAppDispatch();
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['fantasy']);
  
  const toggleGenre = (genreKey: string) => {
    const newSelection = selectedGenres.includes(genreKey)
      ? selectedGenres.filter(g => g !== genreKey)
      : [...selectedGenres, genreKey];
    setSelectedGenres(newSelection);
  };
  
  const handleNext = () => {
    // Save preferred genres
    selectedGenres.forEach(genre => {
      dispatch(addFavoriteGenre(genre));
    });
    onNext();
  };
  
  return (
    <View style={styles.slide}>
      <Text style={styles.slideTitle}>Choose Your Adventures</Text>
      <Text style={styles.slideText}>
        What genres interest you? We'll personalize your experience.
      </Text>
      
      <View style={styles.genreGrid}>
        {genres.map((genre) => (
          <TouchableOpacity
            key={genre.key}
            style={[
              styles.genreCard,
              selectedGenres.includes(genre.key) && styles.genreCardSelected,
            ]}
            onPress={() => toggleGenre(genre.key)}
          >
            <Ionicons
              name={genre.icon as any}
              size={32}
              color={selectedGenres.includes(genre.key) ? '#ffffff' : genre.color}
            />
            <Text
              style={[
                styles.genreLabel,
                selectedGenres.includes(genre.key) && styles.genreLabelSelected,
              ]}
            >
              {genre.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const NotificationPermissionSlide: React.FC<OnboardingSlideProps> = ({ onNext, onSkip, isLast }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  
  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Notification permission status:', status);
    } catch (error) {
      console.error('Error requesting notifications:', error);
    }
    setIsRequesting(false);
    onNext();
  };
  
  return (
    <View style={styles.slide}>
      <Text style={styles.slideTitle}>Stay Connected</Text>
      <Text style={styles.slideText}>
        Get notified about game updates and continue your adventures on the go.
      </Text>
      <View style={styles.iconContainer}>
        <Ionicons name="notifications" size={80} color="#06d6a0" />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.primaryButton, isRequesting && styles.buttonDisabled]}
          onPress={requestPermission}
          disabled={isRequesting}
        >
          <Text style={styles.primaryButtonText}>
            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onNext}>
          <Text style={styles.secondaryButtonText}>
            {isLast ? 'Start Playing' : 'Maybe Later'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const OnboardingFlow: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [WelcomeSlide, GenrePreviewSlide, NotificationPermissionSlide];
  
  const goToNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({ x: width * nextSlide, animated: true });
    } else {
      completeOnboarding();
    }
  };
  
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@ai_dungeon:onboarding_completed', 'true');
      dispatch(setOnboardingCompleted(true));
      navigation.navigate('MainTabs' as never);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigation.navigate('MainTabs' as never);
    }
  };
  
  const skipOnboarding = () => {
    completeOnboarding();
  };
  
  return (
    <LinearGradient
      colors={['#1a1a1a', '#2a2a2a']}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {slides.map((SlideComponent, index) => (
          <SlideComponent
            key={index}
            onNext={goToNext}
            onSkip={skipOnboarding}
            isLast={index === slides.length - 1}
          />
        ))}
      </ScrollView>
      
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              currentSlide === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f3f4f6',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideText: {
    fontSize: 18,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 26,
  },
  iconContainer: {
    marginVertical: 40,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  genreCard: {
    width: '45%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#404040',
  },
  genreCardSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#a78bfa',
  },
  genreLabel: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  genreLabelSelected: {
    color: '#ffffff',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#404040',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#8b5cf6',
  },
});