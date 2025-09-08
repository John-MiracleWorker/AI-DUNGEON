import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../utils/hooks';
import { useCreatePromptGameMutation } from '../services/gameApi';
import { setCurrentSession } from '../store/gameSlice';
import { logout } from '../store/authSlice';

export const PromptAdventureScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  const [prompt, setPrompt] = useState('');
  const [stylePreference, setStylePreference] = useState<'detailed' | 'concise'>('detailed');
  const [imageStyle, setImageStyle] = useState<'fantasy_art' | 'comic_book' | 'painterly'>('fantasy_art');
  const [createPromptGame, { isLoading }] = useCreatePromptGameMutation();

  const handleCreate = async () => {
    // Check authentication state
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'You must be logged in to create an adventure. Please log in and try again.'
      );
      return;
    }

    if (!prompt.trim()) {
      Alert.alert('Prompt Required', 'Please enter a prompt to continue.');
      return;
    }

    try {
      const result = await createPromptGame({
        prompt,
        style_preference: stylePreference,
        image_style: imageStyle,
        safety_filter: settings.safetyFilter,
        content_rating: settings.contentRating,
      }).unwrap();

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

      // Use safer navigation with error handling
      try {
        if (navigation && typeof navigation.navigate === 'function') {
          // Navigate to the main tabs first, then to the game screen
          navigation.navigate('MainTabs' as never, { 
            screen: 'Games', 
            params: { 
              screen: 'Game', 
              params: { sessionId: result.session_id } 
            } 
          } as never);
        } else {
          throw new Error('Navigation not available');
        }
      } catch (navError) {
        console.error('Navigation failed:', navError);
        Alert.alert(
          'Navigation Error',
          'Adventure created successfully but navigation failed. Please go to the game library to access your adventure.'
        );
      }
    } catch (error: any) {
      console.error('Failed to create prompt adventure:', error);
      
      // Enhanced error categorization
      let errorMessage = 'Failed to create adventure. Please try again.';
      
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please log in and try again.';
        dispatch(logout());
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You do not have permission to create adventures.';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait before trying again.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 503) {
        errorMessage = 'Service unavailable. Please try again later.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request. Please check your input.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Adventure Prompt</Text>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Describe your adventure..."
        placeholderTextColor="#9ca3af"
        value={prompt}
        onChangeText={setPrompt}
        editable={!isLoading}
      />

      <Text style={styles.label}>Narrative Style</Text>
      <Picker
        selectedValue={stylePreference}
        onValueChange={itemValue => setStylePreference(itemValue as any)}
        style={styles.picker}
        enabled={!isLoading}
      >
        <Picker.Item label="Detailed" value="detailed" />
        <Picker.Item label="Concise" value="concise" />
      </Picker>

      <Text style={styles.label}>Image Style</Text>
      <Picker
        selectedValue={imageStyle}
        onValueChange={itemValue => setImageStyle(itemValue as any)}
        style={styles.picker}
        enabled={!isLoading}
      >
        <Picker.Item label="Fantasy Art" value="fantasy_art" />
        <Picker.Item label="Comic Book" value="comic_book" />
        <Picker.Item label="Painterly" value="painterly" />
      </Picker>

      <TouchableOpacity
        style={[styles.button, (isLoading || !isAuthenticated) && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={isLoading || !isAuthenticated}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#ffffff" size="small" />
            <Text style={styles.buttonText}>Creating...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Start Adventure</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ... existing styles ...