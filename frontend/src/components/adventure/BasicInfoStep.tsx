import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { 
  updateBasicInfo,
  selectCurrentAdventure,
  selectValidationResult 
} from '../../store/customAdventureSlice';
import { useValidateAdventureMutation } from '../../services/gameApi';

export const BasicInfoStep: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentAdventure = useAppSelector(selectCurrentAdventure);
  const validationResult = useAppSelector(selectValidationResult);
  
  const [validateAdventure] = useValidateAdventureMutation();
  const [isValidating, setIsValidating] = useState(false);

  const title = currentAdventure?.title || '';
  const description = currentAdventure?.description || '';

  const handleTitleChange = (value: string) => {
    dispatch(updateBasicInfo({ title: value }));
  };

  const handleDescriptionChange = (value: string) => {
    dispatch(updateBasicInfo({ description: value }));
  };

  const handleValidate = async () => {
    if (!currentAdventure) return;
    
    setIsValidating(true);
    try {
      await validateAdventure({ adventure_details: currentAdventure });
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return validationResult?.errors?.find(error => 
      error.field === fieldName || error.field.includes(fieldName)
    );
  };

  const titleError = getFieldError('title');
  const descriptionError = getFieldError('description');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adventure Title</Text>
        <Text style={styles.sectionDescription}>
          Give your adventure a compelling name that captures its essence
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              titleError && styles.inputError
            ]}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Enter adventure title..."
            placeholderTextColor="#6b7280"
            maxLength={100}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>
              {title.length}/100
            </Text>
            {titleError && (
              <Text style={styles.errorText}>
                {titleError.message}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>Example Titles:</Text>
          <View style={styles.examplesList}>
            <TouchableOpacity 
              style={styles.exampleButton}
              onPress={() => handleTitleChange('The Lost City of Aethermoor')}
            >
              <Text style={styles.exampleText}>The Lost City of Aethermoor</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exampleButton}
              onPress={() => handleTitleChange('Shadows of the Crimson Empire')}
            >
              <Text style={styles.exampleText}>Shadows of the Crimson Empire</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exampleButton}
              onPress={() => handleTitleChange('The Quantum Heist')}
            >
              <Text style={styles.exampleText}>The Quantum Heist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adventure Description</Text>
        <Text style={styles.sectionDescription}>
          Provide a brief overview of your adventure. This helps the AI understand the tone and setting.
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textArea,
              descriptionError && styles.inputError
            ]}
            value={description}
            onChangeText={handleDescriptionChange}
            placeholder="Describe your adventure concept, setting, and what makes it unique..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>
              {description.length}/1000
            </Text>
            {descriptionError && (
              <Text style={styles.errorText}>
                {descriptionError.message}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips for Success</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Keep your title concise but evocative - it sets expectations
            </Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Include the genre, mood, or key theme in your description
            </Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Mention any unique elements or twists that make your adventure special
            </Text>
          </View>
        </View>
      </View>

      {validationResult && (
        <View style={styles.validationContainer}>
          <View style={styles.validationHeader}>
            <Ionicons 
              name={validationResult.isValid ? "checkmark-circle" : "warning"} 
              size={20} 
              color={validationResult.isValid ? "#10b981" : "#f59e0b"} 
            />
            <Text style={styles.validationTitle}>
              {validationResult.isValid ? 'Validation Passed' : 'Validation Issues'}
            </Text>
          </View>
          
          {validationResult.warnings && validationResult.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              {validationResult.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  • {warning}
                </Text>
              ))}
            </View>
          )}
          
          {validationResult.suggestions && validationResult.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions:</Text>
              {validationResult.suggestions.map((suggestion, index) => (
                <Text key={index} style={styles.suggestionText}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={styles.validateButton}
        onPress={handleValidate}
        disabled={isValidating || !title.trim() || !description.trim()}
      >
        <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
        <Text style={styles.validateButtonText}>
          {isValidating ? 'Validating...' : 'Validate Info'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f3f4f6',
    minHeight: 50,
  },
  textArea: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f3f4f6',
    minHeight: 120,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  examplesContainer: {
    marginTop: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
  },
  examplesList: {
    gap: 8,
  },
  exampleButton: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  exampleText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  tipsContainer: {
    gap: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  validationContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  warningsContainer: {
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#f59e0b',
    marginBottom: 4,
  },
  suggestionsContainer: {
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#6ee7b7',
    marginBottom: 4,
  },
  validateButton: {
    backgroundColor: '#6b46c1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default BasicInfoStep;