import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputBoxProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  placeholder?: string;
  quickActions?: string[];
}

export const InputBox: React.FC<InputBoxProps> = ({ 
  onSubmit, 
  disabled = false, 
  placeholder = "What do you do?",
  quickActions = []
}) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (input.trim().length === 0) {
      Alert.alert('Invalid Input', 'Please enter a command.');
      return;
    }

    if (input.length > 500) {
      Alert.alert('Input Too Long', 'Please keep your input under 500 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(input.trim());
      setInput('');
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const isDisabled = disabled || isSubmitting || input.trim().length === 0;

  return (
    <View style={styles.container}>
      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <View style={styles.quickActionsContainer}>
          {quickActions.slice(0, 3).map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action)}
              disabled={isSubmitting}
            >
              <Text style={styles.quickActionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input Container */}
      <View style={styles.inputContainer}>
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
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="send" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Character Count */}
      <Text style={styles.characterCount}>
        {input.length}/500
      </Text>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#404040',
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
  characterCount: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});