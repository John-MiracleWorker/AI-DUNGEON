import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Turn } from '../../types';

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
  const [imageError, setImageError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = () => {
    setImageError(false);
    setReloadKey((k) => k + 1);
  };

  const renderImage = () => {
    if (!turn.image_url || imageError) {
      return (
        <View style={styles.placeholderContainer} testID="image-placeholder">
          <Text style={styles.placeholderText}>
            {imageError ? 'Failed to load image.' : 'No image available.'}
          </Text>
          {imageError && (
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={onImagePress}
        activeOpacity={0.8}
      >
        <Image
          key={reloadKey}
          source={{ uri: turn.image_url }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      </TouchableOpacity>
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
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: width - 64,
    height: (width - 64) * 0.75,
    backgroundColor: '#404040',
  },
  placeholderContainer: {
    width: width - 64,
    height: (width - 64) * 0.75,
    backgroundColor: '#404040',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
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
});