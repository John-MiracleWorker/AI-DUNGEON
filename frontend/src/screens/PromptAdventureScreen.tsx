import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../utils/hooks';
import { useCreatePromptGameMutation } from '../services/gameApi';
import { setCurrentSession } from '../store/gameSlice';

export const PromptAdventureScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);

  const [prompt, setPrompt] = useState('');
  const [stylePreference, setStylePreference] = useState<'detailed' | 'concise'>('detailed');
  const [imageStyle, setImageStyle] = useState<'fantasy_art' | 'comic_book' | 'painterly'>('fantasy_art');
  const [createPromptGame, { isLoading }] = useCreatePromptGameMutation();

  const handleCreate = async () => {
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

      (navigation as any).navigate('Game', { sessionId: result.session_id });
    } catch (error: any) {
      console.error('Failed to create prompt adventure:', error);
      Alert.alert('Error', error.data?.message || 'Failed to create adventure');
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
      />

      <Text style={styles.label}>Narrative Style</Text>
      <Picker
        selectedValue={stylePreference}
        onValueChange={itemValue => setStylePreference(itemValue as any)}
        style={styles.picker}
      >
        <Picker.Item label="Detailed" value="detailed" />
        <Picker.Item label="Concise" value="concise" />
      </Picker>

      <Text style={styles.label}>Image Style</Text>
      <Picker
        selectedValue={imageStyle}
        onValueChange={itemValue => setImageStyle(itemValue as any)}
        style={styles.picker}
      >
        <Picker.Item label="Fantasy Art" value="fantasy_art" />
        <Picker.Item label="Comic Book" value="comic_book" />
        <Picker.Item label="Painterly" value="painterly" />
      </Picker>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Creating...' : 'Start Adventure'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
    padding: 16,
  },
  label: {
    color: '#f3f4f6',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#374151',
    color: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  picker: {
    backgroundColor: '#374151',
    color: '#f3f4f6',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PromptAdventureScreen;
