import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GameTurn } from '../../types';

const { width, height } = Dimensions.get('window');

interface MobileOptimizedChatProps {
  turns: GameTurn[];
  isLoading?: boolean;
  onImageTap?: (imageUrl: string) => void;
  enableHaptics?: boolean;
}

interface TurnDisplayProps {
  turn: GameTurn;
  onImageTap?: (imageUrl: string) => void;
  onTextLongPress?: (text: string) => void;
  enableHaptics?: boolean;
}

const TurnDisplay: React.FC<TurnDisplayProps> = ({
  turn,
  onImageTap,
  onTextLongPress,
  enableHaptics = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleImagePress = async () => {
    if (enableHaptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onImageTap && turn.image_url) {
      onImageTap(turn.image_url);
    }
  };

  const handleTextLongPress = async () => {
    if (enableHaptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onTextLongPress) {
      onTextLongPress(turn.narration);
    }
  };

  const handleRetry = () => {
    setImageError(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <View style={styles.turnContainer}>
      {/* Player Input */}
      {turn.player_input && turn.player_input !== 'START' && (
        <View style={styles.playerInputContainer}>
          <View style={styles.playerBubble}>
            <Text style={styles.playerText}>{turn.player_input}</Text>
          </View>
        </View>
      )}

      {/* AI Response */}
      <View style={styles.aiResponseContainer}>
        {/* Image */}
        {!turn.image_url || imageError ? (
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
        ) : (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleImagePress}
            activeOpacity={0.8}
          >
            <Image
              key={reloadKey}
              source={{ uri: turn.image_url }}
              style={styles.turnImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="expand" size={20} color="white" />
            </View>
          </TouchableOpacity>
        )}

        {/* Narration */}
        <TouchableOpacity
          style={styles.narrationContainer}
          onLongPress={handleTextLongPress}
          delayLongPress={500}
          activeOpacity={0.95}
        >
          <Text style={styles.narrationText}>{turn.narration}</Text>
          
          {/* Turn metadata */}
          <View style={styles.turnMetadata}>
            <Text style={styles.turnNumber}>Turn {turn.turn_number}</Text>
            <Text style={styles.timestamp}>
              {new Date(turn.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ImageModal: React.FC<{
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}> = ({ visible, imageUrl, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={onClose}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export const MobileOptimizedChat: React.FC<MobileOptimizedChatProps> = ({
  turns,
  isLoading = false,
  onImageTap,
  enableHaptics = true,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageTap = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    if (onImageTap) {
      onImageTap(imageUrl);
    }
  }, [onImageTap]);

  const handleTextLongPress = useCallback(async (text: string) => {
    Alert.alert(
      'Text Options',
      'What would you like to do with this text?',
      [
        {
          text: 'Copy to Clipboard',
          onPress: async () => {
            await Clipboard.setString(text);
            if (enableHaptics) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert('Copied', 'Text copied to clipboard!');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [enableHaptics]);

  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        onContentSizeChange={scrollToBottom}
      >
        {turns.map((turn) => (
          <TurnDisplay
            key={turn.turn_id}
            turn={turn}
            onImageTap={handleImageTap}
            onTextLongPress={handleTextLongPress}
            enableHaptics={enableHaptics}
          />
        ))}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBubble}>
              <View style={styles.typingIndicator}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Image Modal */}
      <ImageModal
        visible={!!selectedImage}
        imageUrl={selectedImage || ''}
        onClose={() => setSelectedImage(null)}
      />
    </View>
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
    paddingVertical: 16,
  },
  turnContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  playerInputContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  playerBubble: {
    backgroundColor: '#6b46c1',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: width * 0.75,
  },
  playerText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
  },
  aiResponseContainer: {
    alignItems: 'flex-start',
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  turnImage: {
    width: width * 0.8,
    height: (width * 0.8) * 0.6,
    borderRadius: 12,
  },
  placeholderContainer: {
    width: width * 0.8,
    height: (width * 0.8) * 0.6,
    backgroundColor: '#404040',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
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
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  narrationContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: width * 0.85,
    borderWidth: 1,
    borderColor: '#404040',
  },
  narrationText: {
    color: '#f3f4f6',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  turnMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnNumber: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  timestamp: {
    color: '#6b7280',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  loadingBubble: {
    backgroundColor: '#2a2a2a',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b7280',
    marginRight: 4,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});