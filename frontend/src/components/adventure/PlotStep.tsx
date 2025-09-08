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
  updatePlot,
  addSecondaryGoal,
  removeSecondaryGoal,
  addPlotHook,
  removePlotHook,
  selectCurrentAdventure 
} from '../../store/customAdventureSlice';

export const PlotStep: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentAdventure = useAppSelector(selectCurrentAdventure);
  
  const [newSecondaryGoal, setNewSecondaryGoal] = useState('');
  const [newPlotHook, setNewPlotHook] = useState('');

  const plot = currentAdventure?.plot || {
    main_objective: '',
    secondary_goals: [],
    plot_hooks: [],
    victory_conditions: '',
    estimated_turns: 30,
    themes: []
  };

  const handleFieldChange = (field: string, value: string | number) => {
    dispatch(updatePlot({ [field]: value }));
  };

  const handleAddSecondaryGoal = () => {
    if (newSecondaryGoal.trim()) {
      dispatch(addSecondaryGoal(newSecondaryGoal.trim()));
      setNewSecondaryGoal('');
    }
  };

  const handleAddPlotHook = () => {
    if (newPlotHook.trim()) {
      dispatch(addPlotHook(newPlotHook.trim()));
      setNewPlotHook('');
    }
  };

  const SecondaryGoalsSection = () => (
    <View style={styles.listSection}>
      <Text style={styles.sectionTitle}>Secondary Goals (Optional)</Text>
      <Text style={styles.sectionDescription}>
        Additional objectives that provide alternative paths and depth to the adventure
      </Text>

      <View style={styles.inputWithButton}>
        <TextInput
          style={styles.listInput}
          value={newSecondaryGoal}
          onChangeText={setNewSecondaryGoal}
          placeholder="Add a secondary goal..."
          placeholderTextColor="#6b7280"
          onSubmitEditing={handleAddSecondaryGoal}
        />
        <TouchableOpacity
          style={styles.addListButton}
          onPress={handleAddSecondaryGoal}
          disabled={!newSecondaryGoal.trim()}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {plot.secondary_goals.length > 0 && (
        <View style={styles.itemsList}>
          {plot.secondary_goals.map((goal, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listItemText}>{goal}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => dispatch(removeSecondaryGoal(index))}
              >
                <Ionicons name="close" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.examplesContainer}>
        <Text style={styles.examplesTitle}>Example Secondary Goals:</Text>
        {[
          'Discover the true identity of the mysterious benefactor',
          'Form an alliance with a rival faction',
          'Collect three ancient artifacts of power',
          'Rescue captured allies along the way'
        ].map((example, index) => (
          <TouchableOpacity
            key={index}
            style={styles.exampleButton}
            onPress={() => dispatch(addSecondaryGoal(example))}
          >
            <Text style={styles.exampleText}>+ {example}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const PlotHooksSection = () => (
    <View style={styles.listSection}>
      <Text style={styles.sectionTitle}>Plot Hooks (Optional)</Text>
      <Text style={styles.sectionDescription}>
        Interesting story elements the AI can use to create unexpected twists and developments
      </Text>

      <View style={styles.inputWithButton}>
        <TextInput
          style={styles.listInput}
          value={newPlotHook}
          onChangeText={setNewPlotHook}
          placeholder="Add a plot hook..."
          placeholderTextColor="#6b7280"
          onSubmitEditing={handleAddPlotHook}
        />
        <TouchableOpacity
          style={styles.addListButton}
          onPress={handleAddPlotHook}
          disabled={!newPlotHook.trim()}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {plot.plot_hooks.length > 0 && (
        <View style={styles.itemsList}>
          {plot.plot_hooks.map((hook, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listItemText}>{hook}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => dispatch(removePlotHook(index))}
              >
                <Ionicons name="close" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.examplesContainer}>
        <Text style={styles.examplesTitle}>Example Plot Hooks:</Text>
        {[
          'A trusted ally harbors a dark secret',
          'The villain shares a connection to the hero\'s past',
          'An ancient prophecy mentions the player by name',
          'A recurring mysterious figure appears at key moments'
        ].map((example, index) => (
          <TouchableOpacity
            key={index}
            style={styles.exampleButton}
            onPress={() => dispatch(addPlotHook(example))}
          >
            <Text style={styles.exampleText}>+ {example}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Main Objective</Text>
        <Text style={styles.sectionDescription}>
          The primary goal or quest that drives the adventure forward
        </Text>
        
        <TextInput
          style={styles.textArea}
          value={plot.main_objective}
          onChangeText={(value) => handleFieldChange('main_objective', value)}
          placeholder="Stop the dark ritual before the blood moon rises, recover the stolen crown jewels, escape the alien mothership..."
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {plot.main_objective.length}/500
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Victory Conditions</Text>
        <Text style={styles.sectionDescription}>
          How does the player succeed? What constitutes winning this adventure?
        </Text>
        
        <TextInput
          style={styles.textArea}
          value={plot.victory_conditions}
          onChangeText={(value) => handleFieldChange('victory_conditions', value)}
          placeholder="The ritual is stopped and the city is saved, the crown is returned to the rightful heir, the player escapes with vital intelligence..."
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={4}
          maxLength={400}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {plot.victory_conditions.length}/400
        </Text>
      </View>

      <SecondaryGoalsSection />

      <PlotHooksSection />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adventure Length</Text>
        <Text style={styles.sectionDescription}>
          Estimated number of turns/interactions for this adventure
        </Text>
        
        <View style={styles.sliderContainer}>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Short (10-20)</Text>
            <Text style={styles.sliderLabel}>Medium (20-40)</Text>
            <Text style={styles.sliderLabel}>Long (40+)</Text>
          </View>
          
          <View style={styles.turnButtons}>
            {[15, 30, 50, 75].map((turns) => (
              <TouchableOpacity
                key={turns}
                style={[
                  styles.turnButton,
                  plot.estimated_turns === turns && styles.turnButtonSelected
                ]}
                onPress={() => handleFieldChange('estimated_turns', turns)}
              >
                <Text style={[
                  styles.turnButtonText,
                  plot.estimated_turns === turns && styles.turnButtonTextSelected
                ]}>
                  {turns} turns
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.customTurnInput}>
            <Text style={styles.customTurnLabel}>Custom:</Text>
            <TextInput
              style={styles.customTurnTextInput}
              value={plot.estimated_turns?.toString() || '30'}
              onChangeText={(value) => {
                const num = parseInt(value) || 30;
                if (num >= 5 && num <= 200) {
                  handleFieldChange('estimated_turns', num);
                }
              }}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor="#6b7280"
            />
            <Text style={styles.customTurnLabel}>turns</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plot Development Tips</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Make your main objective clear but leave room for creative interpretation
            </Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Secondary goals should offer meaningful choices and alternative paths
            </Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Plot hooks give the AI interesting directions to take the story
            </Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Consider moral dilemmas and character-driven conflicts, not just action
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
  listSection: {
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
  textArea: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f3f4f6',
    minHeight: 100,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  listInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f3f4f6',
  },
  addListButton: {
    backgroundColor: '#10b981',
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsList: {
    gap: 8,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#f3f4f6',
  },
  removeButton: {
    padding: 4,
  },
  examplesContainer: {
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
  },
  exampleButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  exampleText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  sliderContainer: {
    gap: 16,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  turnButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  turnButton: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  turnButtonSelected: {
    backgroundColor: '#6b46c1',
    borderColor: '#8b5cf6',
  },
  turnButtonText: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '500',
  },
  turnButtonTextSelected: {
    color: '#ffffff',
  },
  customTurnInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTurnLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  customTurnTextInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#f3f4f6',
    width: 60,
    textAlign: 'center',
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
});

export default PlotStep;