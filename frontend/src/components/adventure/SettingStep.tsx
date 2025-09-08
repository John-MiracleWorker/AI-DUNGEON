import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { 
  updateSetting,
  addLocation,
  removeLocation,
  selectCurrentAdventure 
} from '../../store/customAdventureSlice';

const TIME_PERIODS = [
  { value: 'prehistoric', label: 'Prehistoric Era' },
  { value: 'ancient', label: 'Ancient Times' },
  { value: 'medieval', label: 'Medieval Period' },
  { value: 'renaissance', label: 'Renaissance' },
  { value: 'industrial', label: 'Industrial Age' },
  { value: 'modern', label: 'Modern Day' },
  { value: 'near_future', label: 'Near Future' },
  { value: 'far_future', label: 'Far Future' },
  { value: 'post_apocalyptic', label: 'Post-Apocalyptic' },
  { value: 'custom', label: 'Custom Period' },
];

export const SettingStep: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentAdventure = useAppSelector(selectCurrentAdventure);
  
  const setting = currentAdventure?.setting || {
    world_description: '',
    time_period: 'medieval',
    environment: '',
    special_rules: '',
    locations: []
  };

  const handleFieldChange = (field: string, value: string) => {
    dispatch(updateSetting({ [field]: value }));
  };

  const handleAddLocation = (location: string) => {
    if (location.trim()) {
      dispatch(addLocation(location.trim()));
    }
  };

  const handleRemoveLocation = (index: number) => {
    dispatch(removeLocation(index));
  };

  const LocationInput = () => {
    const [newLocation, setNewLocation] = React.useState('');

    const handleSubmit = () => {
      if (newLocation.trim()) {
        handleAddLocation(newLocation);
        setNewLocation('');
      }
    };

    return (
      <View style={styles.locationInputContainer}>
        <View style={styles.locationInput}>
          <TextInput
            style={styles.locationTextInput}
            value={newLocation}
            onChangeText={setNewLocation}
            placeholder="Add a location..."
            placeholderTextColor="#6b7280"
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity
            style={styles.addLocationButton}
            onPress={handleSubmit}
            disabled={!newLocation.trim()}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        {setting.locations && setting.locations.length > 0 && (
          <View style={styles.locationsList}>
            {setting.locations.map((location, index) => (
              <View key={index} style={styles.locationItem}>
                <Text style={styles.locationText}>{location}</Text>
                <TouchableOpacity
                  style={styles.removeLocationButton}
                  onPress={() => handleRemoveLocation(index)}
                >
                  <Ionicons name="close" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>World Description</Text>
        <Text style={styles.sectionDescription}>
          Describe the world where your adventure takes place. Be detailed about the atmosphere, culture, and unique aspects.
        </Text>
        
        <TextInput
          style={styles.textArea}
          value={setting.world_description}
          onChangeText={(value) => handleFieldChange('world_description', value)}
          placeholder="Describe the world - its history, culture, magic systems, technology level, political structure, and what makes it unique..."
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={8}
          maxLength={2000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {setting.world_description.length}/2000
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Period</Text>
        <Text style={styles.sectionDescription}>
          Select the historical or fictional time period for your adventure
        </Text>
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={setting.time_period}
            onValueChange={(value) => handleFieldChange('time_period', value)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {TIME_PERIODS.map((period) => (
              <Picker.Item
                key={period.value}
                label={period.label}
                value={period.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment & Setting</Text>
        <Text style={styles.sectionDescription}>
          Describe the immediate environment where the adventure begins
        </Text>
        
        <TextInput
          style={styles.textArea}
          value={setting.environment}
          onChangeText={(value) => handleFieldChange('environment', value)}
          placeholder="A bustling medieval tavern, a sterile space station, a haunted forest clearing, a cyberpunk alleyway..."
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {setting.environment.length}/500
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Locations (Optional)</Text>
        <Text style={styles.sectionDescription}>
          Add important locations that might be visited during the adventure
        </Text>
        
        <LocationInput />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Rules (Optional)</Text>
        <Text style={styles.sectionDescription}>
          Any unique rules, magic systems, technology, or constraints in your world
        </Text>
        
        <TextInput
          style={styles.textArea}
          value={setting.special_rules || ''}
          onChangeText={(value) => handleFieldChange('special_rules', value)}
          placeholder="Magic is forbidden by law, technology doesn't work in certain areas, gravity is reversed on Sundays..."
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={6}
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {(setting.special_rules || '').length}/1000
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setting Examples</Text>
        <View style={styles.examplesContainer}>
          <TouchableOpacity 
            style={styles.exampleButton}
            onPress={() => {
              handleFieldChange('world_description', 'A realm where floating islands drift through endless skies, connected by ancient bridges of crystallized starlight. Each island harbors its own ecosystem and culture, from the cloud shepherds to the storm riders.');
              handleFieldChange('environment', 'Standing on a swaying rope bridge between two floating islands, clouds rolling beneath your feet');
              handleFieldChange('time_period', 'fantasy');
            }}
          >
            <Text style={styles.exampleTitle}>Sky Realm Fantasy</Text>
            <Text style={styles.exampleText}>Floating islands, sky bridges, cloud cultures</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.exampleButton}
            onPress={() => {
              handleFieldChange('world_description', 'The year is 2087. Mega-corporations rule city-states while the lawless wastes beyond are home to raiders, mutants, and forgotten AI bunkers. Cybernetic enhancement is common but illegal for civilians.');
              handleFieldChange('environment', 'A neon-lit underground market beneath Neo-Tokyo, where black market cyberware dealers peddle their wares');
              handleFieldChange('time_period', 'near_future');
            }}
          >
            <Text style={styles.exampleTitle}>Cyberpunk Dystopia</Text>
            <Text style={styles.exampleText}>Corporate rule, illegal cybernetics, neon underground</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.exampleButton}
            onPress={() => {
              handleFieldChange('world_description', 'Victorian London, but the dead don\'t rest easy. Necromancers work openly alongside Scotland Yard, and every graveyard needs a licensed guardian. Steam-powered automata assist with daily tasks while spirits whisper secrets.');
              handleFieldChange('environment', 'The fog-shrouded streets of London at midnight, gas lamps flickering as spectral figures drift between the shadows');
              handleFieldChange('time_period', 'industrial');
            }}
          >
            <Text style={styles.exampleTitle}>Victorian Necropolis</Text>
            <Text style={styles.exampleText}>Necromantic Victorian London with steam and spirits</Text>
          </TouchableOpacity>
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
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 8,
  },
  pickerContainer: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#f3f4f6',
    backgroundColor: '#2a2a2a',
  },
  pickerItem: {
    color: '#f3f4f6',
    fontSize: 16,
  },
  locationInputContainer: {
    gap: 16,
  },
  locationInput: {
    flexDirection: 'row',
    gap: 8,
  },
  locationTextInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f3f4f6',
  },
  addLocationButton: {
    backgroundColor: '#10b981',
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationsList: {
    gap: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#f3f4f6',
  },
  removeLocationButton: {
    padding: 4,
  },
  examplesContainer: {
    gap: 12,
  },
  exampleButton: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default SettingStep;