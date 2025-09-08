import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../utils/hooks';
import { 
  useSubmitTurnMutation, 
  useLoadGameQuery,
  useSaveGameMutation 
} from '../services/gameApi';
import { 
  setCurrentSession, 
  addTurn, 
  updateWorldState, 
  updateQuickActions 
} from '../store/gameSlice';
import { setLoading, setError } from '../store/uiSlice';
import { updateAudioSettings } from '../store/settingsSlice';
import { ChatContainer, InputBox, GameControls } from '../components/game';
import AudioPlayer from '../components/game/AudioPlayer';
import SaveGameModal from '../components/SaveGameModal';

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  
  const { currentSession } = useAppSelector((state) => state.game);
  const { isLoading, error } = useAppSelector((state) => state.ui);
  const { isAudioEnabled } = useAppSelector((state) => state.settings);
  
  const [submitTurn, { isLoading: isSubmittingTurn }] = useSubmitTurnMutation();
  const [saveGame, { isLoading: isSaving }] = useSaveGameMutation();

  const [isReady, setIsReady] = useState(false);
  const [isSaveModalVisible, setSaveModalVisible] = useState(false);
  
  // Get session ID from route params
  const sessionId = (route.params as any)?.sessionId || currentSession?.session_id;
  
  // Load game data if we have a session ID
  const { data: gameData, isLoading: isLoadingGame } = useLoadGameQuery(
    sessionId,
    { skip: !sessionId }
  );

  useEffect(() => {
    if (!sessionId) {
      Alert.alert('Error', 'No session ID provided');
      (navigation as any).navigate('NewGame');
    }
  }, [sessionId, navigation]);

  useEffect(() => {
    if (gameData && !currentSession) {
      dispatch(setCurrentSession({
        session_id: gameData.session_id,
        world_state: gameData.world_state,
        turn_history: gameData.turn_history,
        quick_actions: gameData.turn_history[gameData.turn_history.length - 1]?.quick_actions || []
      }));
    }
  }, [gameData, currentSession, dispatch]);

  useEffect(() => {
    if (!isLoadingGame && currentSession) {
      setIsReady(true);
    }
  }, [isLoadingGame, currentSession]);

  const handleSubmitTurn = async (playerInput: string) => {
    if (!currentSession) {
      Alert.alert('Error', 'No active game session');
      return;
    }

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const result = await submitTurn({
        session_id: currentSession.session_id,
        player_input: playerInput,
        context: {
          previous_turn_id: currentSession.turn_history[currentSession.turn_history.length - 1]?.turn_id,
          retry_count: 0
        }
      }).unwrap();

      // Create new turn object
      const newTurn = {
        turn_id: result.turn_id,
        turn_number: result.metadata.turn_number,
        player_input: playerInput,
        narration: result.narration,
        image_prompt: '', // Not needed on frontend
        image_url: result.image_url,
        image_error: result.image_error,
        quick_actions: result.quick_actions,
        world_state_snapshot: currentSession.world_state, // Will be updated below
        timestamp: new Date(result.metadata.timestamp),
        processing_metadata: {
          ai_response_time: 0,
          image_generation_time: 0,
          tokens_used: 0
        }
      };

      // Update store
      dispatch(addTurn(newTurn));
      dispatch(updateQuickActions(result.quick_actions));
      
      // Apply world state changes
      if (result.world_state_changes.location) {
        dispatch(updateWorldState({ location: result.world_state_changes.location }));
      }
      
      if (result.world_state_changes.inventory_changes.added.length > 0) {
        const newInventory = [
          ...currentSession.world_state.inventory,
          ...result.world_state_changes.inventory_changes.added
        ];
        dispatch(updateWorldState({ inventory: newInventory }));
      }

    } catch (error: any) {
      console.error('Turn submission error:', error);
      dispatch(setError(error.data?.message || 'Failed to process turn'));
      Alert.alert('Error', error.data?.message || 'Failed to process turn');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const openSaveGameModal = () => {
    if (!currentSession) {
      Alert.alert('Error', 'No active game session to save');
      return;
    }
    setSaveModalVisible(true);
  };

  const handleSaveGame = async (saveName: string): Promise<boolean> => {
    if (!currentSession) {
      Alert.alert('Error', 'No active game session to save');
      return false;
    }

    try {
      await saveGame({
        session_id: currentSession.session_id,
        save_name: saveName.trim()
      }).unwrap();

      Alert.alert('Success', 'Game saved successfully!');
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.data?.message || 'Failed to save game');
      return false;
    }
  };

  const handleLoadGame = () => {
    navigation.navigate('Library' as never);
  };

  const handleNewGame = () => {
    navigation.navigate('NewGame' as never);
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const toggleAudio = () => {
    dispatch(updateAudioSettings({ isAudioEnabled: !isAudioEnabled }));
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <ChatContainer turns={currentSession?.turn_history || []} isLoading={true} />
      </SafeAreaView>
    );
  }

  // Get the latest turn for audio playback
  const latestTurn = currentSession?.turn_history[currentSession.turn_history.length - 1];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ChatContainer 
          turns={currentSession.turn_history} 
          isLoading={isSubmittingTurn}
        />
        
        {/* Audio Player - only show if audio is enabled and we have a turn */}
        {isAudioEnabled && latestTurn && (
          <AudioPlayer
            sessionId={currentSession.session_id}
            narrationText={latestTurn.narration}
          />
        )}
        
        <InputBox
          onSubmit={handleSubmitTurn}
          disabled={isSubmittingTurn || isLoading}
          quickActions={currentSession.quick_actions}
        />
        
        <GameControls
          onSaveGame={openSaveGameModal}
          onLoadGame={handleLoadGame}
          onNewGame={handleNewGame}
          onSettings={handleSettings}
          isLoading={isSaving}
          currentLocation={currentSession.world_state.location}
          turnCount={currentSession.turn_history.length}
        />

        <SaveGameModal
          visible={isSaveModalVisible}
          onClose={() => setSaveModalVisible(false)}
          onSave={handleSaveGame}
          isSaving={isSaving}
        />
        
        {/* Audio Toggle Button */}
        <TouchableOpacity 
          style={styles.audioToggle}
          onPress={toggleAudio}
        >
          <Ionicons 
            name={isAudioEnabled ? "volume-high" : "volume-mute"} 
            size={24} 
            color="#ffffff" 
          />
          <Text style={styles.audioToggleText}>
            {isAudioEnabled ? "Audio ON" : "Audio OFF"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  keyboardView: {
    flex: 1,
  },
  audioToggle: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: '#6b46c1',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  audioToggleText: {
    color: '#ffffff',
    fontSize: 12,
    marginLeft: 4,
  },
});