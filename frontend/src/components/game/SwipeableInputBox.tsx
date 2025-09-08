import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface SwipeableInputBoxProps {
  onSubmit: (input: string) => void;
  onUndo?: () => void;
  onQuickAction?: (action: string) => void;
  disabled?: boolean;
  placeholder?: string;
  quickActions?: string[];
  enableHaptics?: boolean;
}

export const SwipeableInputBox: React.FC<SwipeableInputBoxProps> = ({
  onSubmit,
  onUndo,
  onQuickAction,
  disabled = false,
  placeholder = "What do you do?",
  quickActions = [],
  enableHaptics = true,
}) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swipeAction, setSwipeAction] = useState<'undo' | 'quick' | null>(null);
  
  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeOpacity = useRef(new Animated.Value(0)).current;
  
  // Gesture handling
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
    },
    
    onPanResponderGrant: async () => {
      if (enableHaptics) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    
    onPanResponderMove: (_, gestureState) => {
      const { dx } = gestureState;
      const maxSwipe = width * 0.3;
      const clampedDx = Math.max(-maxSwipe, Math.min(maxSwipe, dx));
      
      translateX.setValue(clampedDx);
      
      // Update swipe action based on direction
      if (Math.abs(clampedDx) > 50) {
        const newAction = clampedDx > 0 ? 'quick' : 'undo';
        if (newAction !== swipeAction) {
          setSwipeAction(newAction);
          swipeOpacity.setValue(1);
        }
      } else {
        setSwipeAction(null);
        swipeOpacity.setValue(0);
      }
    },
    
    onPanResponderRelease: async (_, gestureState) => {
      const { dx, velocityX } = gestureState;
      const threshold = 100;
      const velocityThreshold = 500;
      
      if ((Math.abs(dx) > threshold || Math.abs(velocityX) > velocityThreshold) && swipeAction) {
        // Trigger action
        if (enableHaptics) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        
        if (swipeAction === 'undo' && onUndo) {
          onUndo();
        } else if (swipeAction === 'quick' && onQuickAction && quickActions.length > 0) {
          onQuickAction(quickActions[0]);
        }
      }
      
      // Reset animations
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web',
          tension: 100,
          friction: 8,
        }),
        Animated.timing(swipeOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
      
      setSwipeAction(null);
    },
  });

  const handleSubmit = async () => {
    if (input.trim().length === 0) {
      if (enableHaptics) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Alert.alert('Invalid Input', 'Please enter a command.');
      return;
    }

    if (input.length > 500) {
      if (enableHaptics) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Input Too Long', 'Please keep your input under 500 characters.');
      return;
    }

    if (enableHaptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);
    try {
      await onSubmit(input.trim());
      setInput('');
      
      if (enableHaptics) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Submit error:', error);
      if (enableHaptics) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickActionPress = async (action: string) => {
    if (enableHaptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInput(action);
  };

  const isDisabled = disabled || isSubmitting || input.trim().length === 0;

  return (
    <View style={styles.container}>
      {/* Swipe Action Indicators */}
      <Animated.View style={[styles.swipeIndicator, styles.leftIndicator, { opacity: swipeOpacity }]}>
        {swipeAction === 'undo' && (
          <>
            <Ionicons name="arrow-undo" size={24} color="#ef4444" />
            <Text style={[styles.swipeText, { color: '#ef4444' }]}>Undo</Text>
          </>
        )}
      </Animated.View>
      
      <Animated.View style={[styles.swipeIndicator, styles.rightIndicator, { opacity: swipeOpacity }]}>
        {swipeAction === 'quick' && (
          <>
            <Text style={[styles.swipeText, { color: '#10b981' }]}>Quick</Text>
            <Ionicons name="flash" size={24} color="#10b981" />
          </>
        )}
      </Animated.View>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <View style={styles.quickActionsContainer}>
          {quickActions.slice(0, 3).map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => handleQuickActionPress(action)}
              disabled={isSubmitting}
            >
              <Text style={styles.quickActionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input Container with Gesture Support */}
      <Animated.View
        style={[
          styles.inputContainer,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={placeholder}
            placeholderTextColor="#6b7280"
            multiline
            maxLength={500}
            editable={!isSubmitting}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, isDisabled && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={isDisabled}
            testID="submit-button"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Character Count and Gesture Hints */}
      <View style={styles.footer}>
        <Text style={styles.gestureHint}>
          ← Swipe left to undo | Swipe right for quick action →
        </Text>
        <Text style={styles.characterCount}>
          {input.length}/500
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f1f1f',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  leftIndicator: {
    left: 20,
  },
  rightIndicator: {
    right: 20,
  },
  swipeText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    backgroundColor: '#374151',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  quickActionText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#404040',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    color: '#f3f4f6',
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#6b46c1',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gestureHint: {
    color: '#6b7280',
    fontSize: 10,
    flex: 1,
  },
  characterCount: {
    color: '#6b7280',
    fontSize: 12,
  },
});