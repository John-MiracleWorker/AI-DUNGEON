import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { 
  updateStylePreferences,
  selectCurrentAdventure 
} from '../../store/customAdventureSlice';

const TONE_OPTIONS = [
  {
    value: 'serious',
    label: 'Serious',
    description: 'Dramatic, intense, and focused on meaningful stakes',
    icon: 'shield',
    color: '#dc2626'
  },
  {
    value: 'humorous',
    label: 'Humorous',
    description: 'Light-hearted, witty, and entertaining with comedic moments',
    icon: 'happy',
    color: '#f59e0b'
  },
  {
    value: 'dramatic',
    label: 'Dramatic',
    description: 'Emotionally charged with high tension and character development',
    icon: 'flame',
    color: '#7c2d12'
  },
  {
    value: 'mixed',
    label: 'Mixed',
    description: 'Balanced blend of serious moments and lighter elements',
    icon: 'color-palette',
    color: '#6b46c1'
  }
];

const COMPLEXITY_OPTIONS = [
  {
    value: 'simple',
    label: 'Simple',
    description: 'Straightforward plot with clear objectives and minimal subplots',
    icon: 'ellipse',
    color: '#10b981'
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Balanced complexity with some branching paths and side elements',
    icon: 'git-branch',
    color: '#3b82f6'
  },
  {
    value: 'complex',
    label: 'Complex',
    description: 'Intricate plot with multiple layers, subplots, and deep world-building',
    icon: 'grid',
    color: '#8b5cf6'
  }
];

const PACING_OPTIONS = [
  {
    value: 'slow',
    label: 'Slow Burn',
    description: 'Deliberate pacing with detailed descriptions and character development',
    icon: 'hourglass',
    color: '#6b7280'
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Balanced pacing with good mix of action and reflection',
    icon: 'speedometer',
    color: '#059669'
  },
  {
    value: 'fast',
    label: 'Fast-Paced',
    description: 'Quick progression with frequent action and rapid story developments',
    icon: 'flash',
    color: '#dc2626'
  }
];

export const StyleStep: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentAdventure = useAppSelector(selectCurrentAdventure);
  
  const stylePreferences = currentAdventure?.style_preferences || {
    tone: 'mixed',
    complexity: 'moderate',
    pacing: 'moderate'
  };

  const handleStyleChange = (field: string, value: string) => {
    dispatch(updateStylePreferences({ [field]: value }));
  };

  const renderOptionSection = (
    title: string,
    description: string,
    options: any[],
    selectedValue: string,
    field: string
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
      
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              selectedValue === option.value && [
                styles.selectedOption,
                { borderColor: option.color }
              ]
            ]}
            onPress={() => handleStyleChange(field, option.value)}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                <Ionicons
                  name={option.icon}
                  size={20}
                  color="#ffffff"
                />
              </View>
              <Text style={[
                styles.optionLabel,
                selectedValue === option.value && styles.selectedOptionLabel
              ]}>
                {option.label}
              </Text>
              {selectedValue === option.value && (
                <Ionicons name="checkmark-circle" size={20} color={option.color} />
              )}
            </View>
            <Text style={[
              styles.optionDescription,
              selectedValue === option.value && styles.selectedOptionDescription
            ]}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPreviewSection = () => {
    const getPreviewText = () => {
      const toneDescriptions = {
        serious: 'with gravity and weight',
        humorous: 'with wit and levity',
        dramatic: 'with emotional intensity',
        mixed: 'with varied emotional tones'
      };

      const complexityDescriptions = {
        simple: 'straightforward narrative paths',
        moderate: 'thoughtful plot developments',
        complex: 'intricate story weaving'
      };

      const pacingDescriptions = {
        slow: 'deliberate, detailed storytelling',
        moderate: 'balanced narrative progression',
        fast: 'dynamic, action-driven scenes'
      };

      return `Your adventure will be told ${toneDescriptions[stylePreferences.tone as keyof typeof toneDescriptions]} through ${complexityDescriptions[stylePreferences.complexity as keyof typeof complexityDescriptions]} and ${pacingDescriptions[stylePreferences.pacing as keyof typeof pacingDescriptions]}.`;
    };

    return (
      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>Style Preview</Text>
        <View style={styles.previewCard}>
          <Ionicons name="eye" size={24} color="#6b46c1" />
          <Text style={styles.previewText}>{getPreviewText()}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderOptionSection(
        'Tone & Atmosphere',
        'Choose the overall emotional tone for your adventure',
        TONE_OPTIONS,
        stylePreferences.tone,
        'tone'
      )}

      {renderOptionSection(
        'Story Complexity',
        'How intricate should the plot and world-building be?',
        COMPLEXITY_OPTIONS,
        stylePreferences.complexity,
        'complexity'
      )}

      {renderOptionSection(
        'Pacing Style',
        'How quickly should the story progress and develop?',
        PACING_OPTIONS,
        stylePreferences.pacing,
        'pacing'
      )}

      {renderPreviewSection()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Style Guidelines</Text>
        <View style={styles.guidelinesContainer}>
          <View style={styles.guideline}>
            <Ionicons name="information-circle" size={16} color="#3b82f6" />
            <View style={styles.guidelineContent}>
              <Text style={styles.guidelineTitle}>Tone Balance</Text>
              <Text style={styles.guidelineText}>
                Even serious adventures can have moments of levity, and humorous ones can have meaningful depth
              </Text>
            </View>
          </View>

          <View style={styles.guideline}>
            <Ionicons name="information-circle" size={16} color="#3b82f6" />
            <View style={styles.guidelineContent}>
              <Text style={styles.guidelineTitle}>Complexity Scaling</Text>
              <Text style={styles.guidelineText}>
                Complex adventures may require more turns to fully develop all plot threads
              </Text>
            </View>
          </View>

          <View style={styles.guideline}>
            <Ionicons name="information-circle" size={16} color="#3b82f6" />
            <View style={styles.guidelineContent}>
              <Text style={styles.guidelineTitle}>Pacing Flexibility</Text>
              <Text style={styles.guidelineText}>
                The AI will adjust pacing based on player actions while maintaining your preferred style
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ready to Create</Text>
        <Text style={styles.readyDescription}>
          Your adventure preferences are set! Click "Create Adventure" to generate your custom story and begin your journey.
        </Text>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Adventure Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Title:</Text>
            <Text style={styles.summaryValue}>
              {currentAdventure?.title || 'Untitled Adventure'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Setting:</Text>
            <Text style={styles.summaryValue}>
              {currentAdventure?.setting.time_period} • {currentAdventure?.setting.environment.substring(0, 50)}...
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Style:</Text>
            <Text style={styles.summaryValue}>
              {stylePreferences.tone} • {stylePreferences.complexity} • {stylePreferences.pacing}
            </Text>
          </View>
        </View>
      </View>
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
    marginBottom: 20,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#374151',
  },
  selectedOption: {
    backgroundColor: '#1e1b4b',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  selectedOptionLabel: {
    color: '#ffffff',
  },
  optionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  selectedOptionDescription: {
    color: '#e5e7eb',
  },
  previewSection: {
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#312e81',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#4c1d95',
  },
  previewText: {
    flex: 1,
    fontSize: 16,
    color: '#e0e7ff',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  guidelinesContainer: {
    gap: 16,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guidelineContent: {
    flex: 1,
  },
  guidelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 4,
  },
  guidelineText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  readyDescription: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 20,
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: '#064e3b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#059669',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a7f3d0',
    minWidth: 60,
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    color: '#ecfdf5',
  },
});

export default StyleStep;