import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Turn } from '../../types';
import { ImageDisplay } from './ImageDisplay';

interface TurnDisplayProps {
  turn: Turn;
  onImagePress?: () => void;
  isLatest?: boolean;
}

const { width } = Dimensions.get('window');

export const TurnDisplay: React.FC<TurnDisplayProps> = ({
  turn,
  onImagePress,
  isLatest = false
}) => {
  const handleRetry = () => {
    // Refresh the component to trigger a new image load
    forceUpdate();
  };

  // Simple force update mechanism
  const [, setForceUpdate] = useState(0);
  const forceUpdate = () => {
    setForceUpdate(prev => prev + 1);
  };

  const renderImage = () => {
    return (
      <ImageDisplay
        imageUrl={turn.image_url}
        onRetry={handleRetry}
        onError={() => console.log('Image failed to load')}
        onLoad={() => console.log('Image loaded successfully')}
      />
      {turn.image_error && (
        <View style={styles.errorInfoContainer}>
          <Text style={styles.errorInfoTitle}>Image Generation Issue:</Text>
          <Text style={styles.errorInfoText}>
            {turn.image_error.errorMessage}
          </Text>
          <Text style={styles.errorInfoDetail}>
            Model: {turn.image_error.model} | Type: {turn.image_error.errorType}
          </Text>
        </View>
      )
    );
  };

  return (
    <View style={[styles.container, isLatest && styles.latestTurn]}>
      {/* Player Input */}
      {turn.player_input !== 'START' && (
        <View style={styles.playerInputContainer}>
          <Text style={styles.playerInputLabel}>You:</Text>
          <Text style={styles.playerInput}>{turn.player_input}</Text>
        </View>
      )}
      
      {/* Narration */}
      <View style={styles.narrationContainer}>
        <Text style={styles.narration}>{turn.narration}</Text>
      </View>
      
      {/* Image */}
      {renderImage()}
      
      {/* Quick Actions */}
      {turn.quick_actions && turn.quick_actions.length > 0 && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsLabel}>Suggested actions:</Text>
          {turn.quick_actions.map((action, index) => (
            <Text key={index} style={styles.quickAction}>
              • {action}
            </Text>
          ))}
        </View>
      )}
      
      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {new Date(turn.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  latestTurn: {
    borderColor: '#6b46c1',
    borderWidth: 2,
  },
  playerInputContainer: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  playerInputLabel: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerInput: {
    color: '#e5e5e5',
    fontSize: 14,
    fontStyle: 'italic',
  },
  narrationContainer: {
    marginBottom: 12,
  },
  narration: {
    color: '#f3f4f6',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },

  quickActionsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  quickActionsLabel: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quickAction: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 4,
  },
  timestamp: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'right',
  },
  errorInfoContainer: {
    backgroundColor: '#331d1d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f87171',
  },
  errorInfoTitle: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorInfoText: {
    color: '#fecaca',
    fontSize: 12,
    marginBottom: 4,
  },
  errorInfoDetail: {
    color: '#9ca3af',
    fontSize: 10,
    fontStyle: 'italic',
  },
});