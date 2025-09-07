import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GameControlsProps {
  onSaveGame: () => void;
  onLoadGame: () => void;
  onNewGame: () => void;
  onSettings: () => void;
  isLoading?: boolean;
  currentLocation?: string;
  turnCount?: number;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onSaveGame,
  onLoadGame,
  onNewGame,
  onSettings,
  isLoading = false,
  currentLocation,
  turnCount = 0,
}) => {
  const handleNewGame = () => {
    Alert.alert(
      'Start New Game',
      'Are you sure you want to start a new game? Your current progress will be lost if not saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start New Game', onPress: onNewGame, style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Game Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <Ionicons name="location" size={16} color="#10b981" />
          <Text style={styles.statusText} numberOfLines={1}>
            {currentLocation || 'Unknown Location'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="time" size={16} color="#3b82f6" />
          <Text style={styles.statusText}>
            Turn {turnCount}
          </Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, styles.saveButton]}
          onPress={onSaveGame}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#ffffff" />
              <Text style={styles.controlButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.loadButton]}
          onPress={onLoadGame}
          disabled={isLoading}
        >
          <Ionicons name="folder-open" size={20} color="#ffffff" />
          <Text style={styles.controlButtonText}>Load</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.newGameButton]}
          onPress={handleNewGame}
          disabled={isLoading}
        >
          <Ionicons name="add-circle" size={20} color="#ffffff" />
          <Text style={styles.controlButtonText}>New</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.settingsButton]}
          onPress={onSettings}
          disabled={isLoading}
        >
          <Ionicons name="settings" size={20} color="#ffffff" />
          <Text style={styles.controlButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statusText: {
    color: '#d1d5db',
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  loadButton: {
    backgroundColor: '#3b82f6',
  },
  newGameButton: {
    backgroundColor: '#f59e0b',
  },
  settingsButton: {
    backgroundColor: '#6b7280',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});