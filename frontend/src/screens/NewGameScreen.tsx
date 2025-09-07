import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../utils/hooks';
import { useStartNewGameMutation } from '../services/gameApi';
import { setCurrentSession } from '../store/gameSlice';
import { NewGameRequest } from '../types';

const genres = [
  { key: 'fantasy', label: 'Fantasy', icon: 'flame', description: 'Magic, dragons, and medieval adventures' },
  { key: 'sci-fi', label: 'Sci-Fi', icon: 'planet', description: 'Space exploration and futuristic technology' },
  { key: 'horror', label: 'Horror', icon: 'skull', description: 'Scary encounters and dark mysteries' },
  { key: 'modern', label: 'Modern', icon: 'business', description: 'Contemporary settings and realistic scenarios' },
];

const imageStyles = [
  { key: 'fantasy_art', label: 'Fantasy Art', description: 'Epic digital illustrations with detailed fantasy elements' },
  { key: 'comic_book', label: 'Comic Book', description: 'Bold lines and vibrant comic book style art' },
  { key: 'painterly', label: 'Painterly', description: 'Artistic oil painting style with brush strokes' },
];

const stylePreferences = [
  { key: 'detailed', label: 'Detailed', description: 'Rich, descriptive narration with lots of detail' },
  { key: 'concise', label: 'Concise', description: 'Brief, action-focused storytelling' },
];

export const NewGameScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  const [startNewGame, { isLoading }] = useStartNewGameMutation();

  const [selectedGenre, setSelectedGenre] = useState<string>('fantasy');
  const [selectedImageStyle, setSelectedImageStyle] = useState<string>('fantasy_art');
  const [selectedStylePreference, setSelectedStylePreference] = useState<string>('detailed');

  const handleStartGame = async () => {
    try {
      const gameRequest: NewGameRequest = {
        genre: selectedGenre as any,
        style_preference: selectedStylePreference as any,
        image_style: selectedImageStyle as any,
        safety_filter: settings.safetyFilter,
        content_rating: settings.contentRating,
      };

      const result = await startNewGame(gameRequest).unwrap();

      // Set up the game session in store
      dispatch(setCurrentSession({
        session_id: result.session_id,
        world_state: result.world_state,
        turn_history: [{
          turn_id: 'prologue',
          turn_number: 0,
          player_input: 'START',
          narration: result.prologue.narration,
          image_prompt: '',
          image_url: result.prologue.image_url,
          quick_actions: result.prologue.quick_actions,
          world_state_snapshot: result.world_state,
          timestamp: new Date(),
          processing_metadata: {
            ai_response_time: 0,
            image_generation_time: 0,
            tokens_used: 0,
          },
        }],
        quick_actions: result.prologue.quick_actions,
      }));

      // Navigate to game screen
      (navigation as any).navigate('Game', { sessionId: result.session_id });

    } catch (error: any) {
      console.error('Failed to start new game:', error);
      Alert.alert('Error', error.data?.message || 'Failed to start new game');
    }
  };

  const renderOptionSection = (
    title: string,
    options: any[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.optionButton,
            selectedValue === option.key && styles.selectedOption,
          ]}
          onPress={() => onSelect(option.key)}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              {option.icon && (
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selectedValue === option.key ? '#ffffff' : '#6b46c1'}
                  style={styles.optionIcon}
                />
              )}
              <Text style={[
                styles.optionLabel,
                selectedValue === option.key && styles.selectedOptionText,
              ]}>
                {option.label}
              </Text>
            </View>
            <Text style={[
              styles.optionDescription,
              selectedValue === option.key && styles.selectedOptionDescription,
            ]}>
              {option.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create New Adventure</Text>
          <Text style={styles.subtitle}>
            Choose your preferences to begin your AI-powered journey
          </Text>
        </View>

        {renderOptionSection(
          'Genre',
          genres,
          selectedGenre,
          setSelectedGenre
        )}

        {renderOptionSection(
          'Image Style',
          imageStyles,
          selectedImageStyle,
          setSelectedImageStyle
        )}

        {renderOptionSection(
          'Narration Style',
          stylePreferences,
          selectedStylePreference,
          setSelectedStylePreference
        )}

        <TouchableOpacity
          style={[styles.startButton, isLoading && styles.startButtonDisabled]}
          onPress={handleStartGame}
          disabled={isLoading}
        >
          <Ionicons name="play" size={24} color="#ffffff" />
          <Text style={styles.startButtonText}>
            {isLoading ? 'Creating Adventure...' : 'Start Adventure'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f3f4f6',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 12,
  },
  optionButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#404040',
  },
  selectedOption: {
    backgroundColor: '#6b46c1',
    borderColor: '#8b5cf6',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionIcon: {
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  optionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  selectedOptionDescription: {
    color: '#e5e7eb',
  },
  startButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  startButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});