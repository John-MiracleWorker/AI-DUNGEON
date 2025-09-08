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
import { useStartNewGameMutation, useGetAdventureTemplatesQuery } from '../services/gameApi';
import { setCurrentSession } from '../store/gameSlice';
import { NewGameRequest, GameCreationOptions } from '../types';

const gameTypes = [
  {
    key: 'preset',
    label: 'Quick Start',
    icon: 'flash',
    description: 'Choose from preset genres and jump right into adventure',
    color: '#10b981'
  },
  {
    key: 'custom',
    label: 'Custom Adventure',
    icon: 'construct',
    description: 'Create your own unique adventure with custom world and characters',
    color: '#6b46c1'
  },
  {
    key: 'template',
    label: 'Use Template',
    icon: 'library',
    description: 'Start from a community-created adventure template',
    color: '#f59e0b'
  },
  {
    key: 'prompt',
    label: 'Prompt Adventure',
    icon: 'create',
    description: 'Generate an adventure from your own prompt',
    color: '#3b82f6'
  }
];

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
  const { data: templatesData } = useGetAdventureTemplatesQuery({ limit: 10 });

  const [gameType, setGameType] = useState<'preset' | 'custom' | 'template' | 'prompt'>('preset');
  const [selectedGenre, setSelectedGenre] = useState<string>('fantasy');
  const [selectedImageStyle, setSelectedImageStyle] = useState<string>('fantasy_art');
  const [selectedStylePreference, setSelectedStylePreference] = useState<string>('detailed');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleStartGame = async () => {
    if (gameType === 'custom') {
      // Navigate to custom adventure creation wizard
      (navigation as any).navigate('CustomAdventure');
      return;
    }

    if (gameType === 'prompt') {
      (navigation as any).navigate('PromptAdventure');
      return;
    }

    if (gameType === 'template') {
      if (!selectedTemplate) {
        Alert.alert('No Template Selected', 'Please select an adventure template to continue.');
        return;
      }
      // Handle template-based game creation (to be implemented)
      Alert.alert('Coming Soon', 'Template-based adventures will be available in the next update!');
      return;
    }

    // Handle preset game creation
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

      // Navigate to game screen with error handling
      try {
        if (navigation && typeof (navigation as any).navigate === 'function') {
          (navigation as any).navigate('Game', { sessionId: result.session_id });
        } else {
          throw new Error('Navigation not available');
        }
      } catch (navError) {
        console.error('Navigation failed:', navError);
        Alert.alert(
          'Adventure Created',
          'Your adventure was created successfully. Please go to your game library to access it.'
        );
      }

    } catch (error: any) {
      console.error('Failed to start new game:', error);
      
      // Enhanced error categorization
      let errorMessage = 'Failed to start new game. Please try again.';
      
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please log in and try again.';
        // Note: We would need to dispatch a logout action here if we had access to it
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You do not have permission to create adventures.';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait before trying again.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 400) {
        errorMessage = `Invalid request: ${error.data?.error || 'Please check your input'}`;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const renderGameTypeSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Adventure Type</Text>
      <Text style={styles.sectionDescription}>
        Choose how you want to create your adventure
      </Text>
      {gameTypes.map((type) => (
        <TouchableOpacity
          key={type.key}
          style={[
            styles.gameTypeButton,
            gameType === type.key && [styles.selectedGameType, { borderColor: type.color }],
          ]}
          onPress={() => setGameType(type.key as any)}
        >
          <View style={styles.gameTypeContent}>
            <View style={styles.gameTypeHeader}>
              <View style={[styles.gameTypeIcon, { backgroundColor: type.color }]}>
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color="#ffffff"
                />
              </View>
              <View style={styles.gameTypeText}>
                <Text style={[
                  styles.gameTypeLabel,
                  gameType === type.key && styles.selectedGameTypeText,
                ]}>
                  {type.label}
                </Text>
                <Text style={[
                  styles.gameTypeDescription,
                  gameType === type.key && styles.selectedGameTypeDescription,
                ]}>
                  {type.description}
                </Text>
              </View>
              {gameType === type.key && (
                <Ionicons name="checkmark-circle" size={24} color={type.color} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTemplateSection = () => {
    if (gameType !== 'template') return null;

    const templates = templatesData?.templates || [];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Template</Text>
        <Text style={styles.sectionDescription}>
          Choose from popular community-created adventures
        </Text>
        
        {templates.length === 0 ? (
          <View style={styles.emptyTemplates}>
            <Ionicons name="library-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyTemplatesText}>No templates available</Text>
          </View>
        ) : (
          <View style={styles.templatesList}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.adventure_id}
                style={[
                  styles.templateCard,
                  selectedTemplate === template.adventure_id && styles.selectedTemplate,
                ]}
                onPress={() => setSelectedTemplate(template.adventure_id)}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  {selectedTemplate === template.adventure_id && (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  )}
                </View>
                <Text style={styles.templateDescription}>
                  {template.description}
                </Text>
                <View style={styles.templateMeta}>
                  <Text style={styles.templateMetaText}>
                    {template.usage_count} plays • {template.estimated_duration}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPresetOptions = () => {
    if (gameType !== 'preset') return null;

    return (
      <>
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
      </>
    );
  };

  const getStartButtonText = () => {
    if (isLoading) return 'Creating Adventure...';
    
    switch (gameType) {
      case 'custom':
        return 'Create Custom Adventure';
      case 'template':
        return 'Start from Template';
      default:
        return 'Start Adventure';
    }
  };

  const getStartButtonIcon = () => {
    switch (gameType) {
      case 'custom':
        return 'construct';
      case 'template':
        return 'library';
      default:
        return 'play';
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

        {renderGameTypeSection()}
        {renderTemplateSection()}
        {renderPresetOptions()}

        <TouchableOpacity
          style={[styles.startButton, isLoading && styles.startButtonDisabled]}
          onPress={handleStartGame}
          disabled={isLoading}
        >
          <Ionicons name={getStartButtonIcon()} size={24} color="#ffffff" />
          <Text style={styles.startButtonText}>
            {getStartButtonText()}
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
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  gameTypeButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#404040',
  },
  selectedGameType: {
    backgroundColor: '#1f2937',
    borderWidth: 2,
  },
  gameTypeContent: {
    flex: 1,
  },
  gameTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  gameTypeText: {
    flex: 1,
  },
  gameTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 4,
  },
  gameTypeDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  selectedGameTypeText: {
    color: '#ffffff',
  },
  selectedGameTypeDescription: {
    color: '#e5e7eb',
  },
  templatesList: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#404040',
  },
  selectedTemplate: {
    backgroundColor: '#1f2937',
    borderColor: '#10b981',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  templateDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 20,
  },
  templateMeta: {
    marginTop: 4,
  },
  templateMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyTemplates: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTemplatesText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
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