import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../utils/hooks';
import { 
  startCreating,
  stopCreating,
  nextStep,
  previousStep,
  selectCurrentStep,
  selectIsCreating,
  selectCanNavigateNext,
  selectCanNavigatePrevious,
  selectCurrentAdventure
} from '../store/customAdventureSlice';
import { useCreateCustomGameMutation } from '../services/gameApi';
import { setCurrentSession } from '../store/gameSlice';

// Import step components (to be created)
import BasicInfoStep from '../components/adventure/BasicInfoStep';
import SettingStep from '../components/adventure/SettingStep';
import CharacterStep from '../components/adventure/CharacterStep';
import PlotStep from '../components/adventure/PlotStep';
import StyleStep from '../components/adventure/StyleStep';

const WIZARD_STEPS = [
  {
    id: 0,
    title: 'Basic Info',
    description: 'Adventure title and description',
    icon: 'document-text',
    component: BasicInfoStep,
  },
  {
    id: 1,
    title: 'World Setting',
    description: 'Environment and world details',
    icon: 'globe',
    component: SettingStep,
  },
  {
    id: 2,
    title: 'Plot & Goals',
    description: 'Objectives and story hooks',
    icon: 'map',
    component: PlotStep,
  },
  {
    id: 3,
    title: 'Characters',
    description: 'Player role and NPCs',
    icon: 'people',
    component: CharacterStep,
  },
  {
    id: 4,
    title: 'Style & Tone',
    description: 'Narrative preferences',
    icon: 'color-palette',
    component: StyleStep,
  },
];

export const CustomAdventureScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  
  const currentStep = useAppSelector(selectCurrentStep);
  const isCreating = useAppSelector(selectIsCreating);
  const canGoNext = useAppSelector(selectCanNavigateNext);
  const canGoPrevious = useAppSelector(selectCanNavigatePrevious);
  const currentAdventure = useAppSelector(selectCurrentAdventure);
  
  const [createCustomGame, { isLoading: isCreatingGame }] = useCreateCustomGameMutation();

  useEffect(() => {
    // Initialize the creation workflow
    if (!isCreating) {
      dispatch(startCreating());
    }

    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [isCreating, dispatch]);

  const handleBackPress = (): boolean => {
    if (canGoPrevious) {
      handlePrevious();
      return true; // Prevent default back behavior
    } else {
      handleCancel();
      return true;
    }
  };

  const handleNext = () => {
    if (canGoNext && currentStep < WIZARD_STEPS.length - 1) {
      dispatch(nextStep());
    } else if (currentStep === WIZARD_STEPS.length - 1) {
      handleCreateAdventure();
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      dispatch(previousStep());
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Adventure Creation',
      'Are you sure you want to cancel? All progress will be lost.',
      [
        {
          text: 'Continue Creating',
          style: 'cancel',
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            dispatch(stopCreating());
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleCreateAdventure = async () => {
    if (!currentAdventure) {
      Alert.alert('Error', 'Adventure details are missing');
      return;
    }

    // Validate all required fields before submission
    const validationErrors = [];
    
    // Basic Info validation
    if (!currentAdventure.title?.trim() || currentAdventure.title.trim().length < 3) {
      validationErrors.push('Title must be at least 3 characters');
    }
    
    if (!currentAdventure.description?.trim() || currentAdventure.description.trim().length < 10) {
      validationErrors.push('Description must be at least 10 characters');
    }
    
    // Setting validation
    if (!currentAdventure.setting?.world_description?.trim() || 
        currentAdventure.setting.world_description.trim().length < 50) {
      validationErrors.push('World description must be at least 50 characters');
    }
    
    if (!currentAdventure.setting?.environment?.trim()) {
      validationErrors.push('Environment description is required');
    }
    
    // Plot validation
    if (!currentAdventure.plot?.main_objective?.trim()) {
      validationErrors.push('Main objective is required');
    }
    
    if (!currentAdventure.plot?.victory_conditions?.trim()) {
      validationErrors.push('Victory conditions are required');
    }
    
    // Characters validation
    if (!currentAdventure.characters?.player_role?.trim()) {
      validationErrors.push('Player role description is required');
    }
    
    if (validationErrors.length > 0) {
      Alert.alert(
        'Validation Error',
        'Please fix the following issues:\n' + validationErrors.join('\n')
      );
      return;
    }

    try {
      const customRequest = {
        genre: 'custom' as const,
        style_preference: settings.narrativeStyle || 'detailed' as const,
        image_style: settings.imageStyle || 'fantasy_art' as const,
        safety_filter: settings.safetyFilter,
        content_rating: settings.contentRating,
        adventure_details: currentAdventure,
      };

      const result = await createCustomGame(customRequest).unwrap();

      // Set up the game session in store
      dispatch(setCurrentSession({
        session_id: result.session_id,
        world_state: result.world_state,
        turn_history: [{
          turn_id: 'prologue',
          turn_number: 0,
          player_input: 'START',
          narration: result.prologue.narration,
          image_prompt: '',
          image_url: result.prologue.image_url,
          quick_actions: result.prologue.quick_actions,
          world_state_snapshot: result.world_state,
          timestamp: new Date(),
          processing_metadata: {
            ai_response_time: 0,
            image_generation_time: 0,
            tokens_used: 0,
          },
        }],
        quick_actions: result.prologue.quick_actions,
      }));

      // Clean up and navigate to game
      dispatch(stopCreating());
      
      // Use safer navigation with error handling
      try {
        (navigation as any).navigate('Game', { sessionId: result.session_id });
      } catch (navError) {
        console.error('Navigation failed:', navError);
        Alert.alert(
          'Navigation Error',
          'Adventure created successfully but navigation failed. Please go to the game library to access your adventure.'
        );
        navigation.goBack(); // Navigate back to previous screen as fallback
      }

    } catch (error: any) {
      console.error('Failed to create custom adventure:', error);
      Alert.alert(
        'Creation Failed',
        error.data?.message || 'Failed to create adventure. Please try again.'
      );
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {WIZARD_STEPS.map((step, index) => (
          <View key={step.id} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
                index === currentStep && styles.progressDotCurrent,
              ]}
            >
              <Ionicons
                name={step.icon as any}
                size={12}
                color={index <= currentStep ? '#ffffff' : '#6b7280'}
              />
            </View>
            {index < WIZARD_STEPS.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  index < currentStep && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <Text style={styles.progressText}>
        Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].title}
      </Text>
    </View>
  );

  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      <TouchableOpacity
        style={[styles.navButton, styles.cancelButton]}
        onPress={handleCancel}
      >
        <Ionicons name="close" size={20} color="#ef4444" />
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.navButtonGroup}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.secondaryButton,
            !canGoPrevious && styles.disabledButton,
          ]}
          onPress={handlePrevious}
          disabled={!canGoPrevious}
        >
          <Ionicons name="chevron-back" size={20} color="#6b7280" />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.primaryButton,
            !canGoNext && styles.disabledButton,
            isCreatingGame && styles.loadingButton,
          ]}
          onPress={handleNext}
          disabled={!canGoNext || isCreatingGame}
        >
          {isCreatingGame ? (
            <>
              <Text style={styles.primaryButtonText}>Creating...</Text>
            </>
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                {currentStep === WIZARD_STEPS.length - 1 ? 'Create Adventure' : 'Next'}
              </Text>
              <Ionicons 
                name={currentStep === WIZARD_STEPS.length - 1 ? "play" : "chevron-forward"} 
                size={20} 
                color="#ffffff" 
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const CurrentStepComponent = WIZARD_STEPS[currentStep].component;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Custom Adventure</Text>
        <Text style={styles.subtitle}>
          {WIZARD_STEPS[currentStep].description}
        </Text>
        {renderProgressIndicator()}
      </View>

      <View style={styles.contentContainer}>
        <CurrentStepComponent />
      </View>

      {renderNavigationButtons()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f3f4f6',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: '#6b46c1',
  },
  progressDotCurrent: {
    backgroundColor: '#8b5cf6',
    borderWidth: 2,
    borderColor: '#a78bfa',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#374151',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#6b46c1',
  },
  progressText: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  navButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButton: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  secondaryButtonText: {
    color: '#d1d5db',
    fontWeight: '600',
    marginLeft: 4,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#059669',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 6,
  },
  disabledButton: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    opacity: 0.5,
  },
  loadingButton: {
    backgroundColor: '#6b7280',
  },
});