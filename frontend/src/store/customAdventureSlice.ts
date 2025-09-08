import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  AdventureDetails, 
  AdventureValidationResult,
  AdventureSuggestion,
  CustomAdventureState,
  UserAdventureItem,
  AdventureTemplate,
  AdventureWizardStep,
  TimePeriodSelection
} from '../types';

const initialState: CustomAdventureState = {
  currentAdventure: null,
  validationResult: null,
  suggestions: [],
  userAdventures: [],
  publicTemplates: [],
  isCreating: false,
  isValidating: false,
  currentStep: 0,
  maxSteps: 5,
};

// Initialize adventure details with default structure
const createEmptyAdventure = (): AdventureDetails => ({
  title: '',
  description: '',
  setting: {
    world_description: '',
    time_period: {
      type: 'predefined',
      value: 'medieval',
    },
    environment: '',
    special_rules: '',
    locations: []
  },
  characters: {
    player_role: '',
    key_npcs: [],
    relationships: []
  },
  plot: {
    main_objective: '',
    secondary_goals: [],
    plot_hooks: [],
    victory_conditions: '',
    estimated_turns: 30,
    themes: []
  },
  style_preferences: {
    tone: 'mixed',
    complexity: 'moderate',
    pacing: 'moderate'
  }
});

const customAdventureSlice = createSlice({
  name: 'customAdventure',
  initialState,
  reducers: {
    // Adventure creation workflow
    startCreating: (state) => {
      state.isCreating = true;
      state.currentAdventure = createEmptyAdventure();
      state.currentStep = 0;
      state.validationResult = null;
      state.suggestions = [];
    },

    stopCreating: (state) => {
      state.isCreating = false;
      state.currentAdventure = null;
      state.currentStep = 0;
      state.validationResult = null;
      state.suggestions = [];
    },

    // Step navigation
    setCurrentStep: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.maxSteps) {
        state.currentStep = action.payload;
      }
    },

    nextStep: (state) => {
      if (state.currentStep < state.maxSteps - 1) {
        state.currentStep += 1;
      }
    },

    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },

    // Adventure data updates
    updateAdventureField: (state, action: PayloadAction<{
      section: keyof AdventureDetails;
      field: string;
      value: any;
    }>) => {
      if (state.currentAdventure) {
        const { section, field, value } = action.payload;
        (state.currentAdventure[section] as any)[field] = value;
      }
    },

    updateBasicInfo: (state, action: PayloadAction<{
      title?: string;
      description?: string;
    }>) => {
      if (state.currentAdventure) {
        const { title, description } = action.payload;
        if (title !== undefined) state.currentAdventure.title = title;
        if (description !== undefined) state.currentAdventure.description = description;
      }
    },

    updateSetting: (state, action: PayloadAction<Partial<AdventureDetails['setting']>>) => {
      if (state.currentAdventure) {
        state.currentAdventure.setting = {
          ...state.currentAdventure.setting,
          ...action.payload
        };
      }
    },

    updateTimePeriod: (state, action: PayloadAction<TimePeriodSelection>) => {
      if (state.currentAdventure?.setting) {
        state.currentAdventure.setting.time_period = action.payload;
      }
    },

    updateCharacters: (state, action: PayloadAction<Partial<AdventureDetails['characters']>>) => {
      if (state.currentAdventure) {
        state.currentAdventure.characters = {
          ...state.currentAdventure.characters,
          ...action.payload
        };
      }
    },

    updatePlot: (state, action: PayloadAction<Partial<AdventureDetails['plot']>>) => {
      if (state.currentAdventure) {
        state.currentAdventure.plot = {
          ...state.currentAdventure.plot,
          ...action.payload
        };
      }
    },

    updateStylePreferences: (state, action: PayloadAction<Partial<AdventureDetails['style_preferences']>>) => {
      if (state.currentAdventure) {
        state.currentAdventure.style_preferences = {
          ...state.currentAdventure.style_preferences,
          ...action.payload
        };
      }
    },

    // NPC management
    addNPC: (state, action: PayloadAction<{
      name: string;
      description: string;
      relationship: string;
      personality?: string;
      goals?: string;
      traits?: string[];
      backstory?: string;
      importance?: 'major' | 'minor' | 'background';
      templateId?: string;
    }>) => {
      if (state.currentAdventure) {
        const newNPC = {
          id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...action.payload,
          traits: action.payload.traits || [],
          importance: action.payload.importance || 'minor',
          relationships: []
        };
        state.currentAdventure.characters.key_npcs.push(newNPC);
      }
    },

    updateNPC: (state, action: PayloadAction<{
      index: number;
      npc: Partial<AdventureDetails['characters']['key_npcs'][0]>;
    }>) => {
      if (state.currentAdventure) {
        const { index, npc } = action.payload;
        if (index >= 0 && index < state.currentAdventure.characters.key_npcs.length) {
          state.currentAdventure.characters.key_npcs[index] = {
            ...state.currentAdventure.characters.key_npcs[index],
            ...npc
          };
        }
      }
    },

    removeNPC: (state, action: PayloadAction<number>) => {
      if (state.currentAdventure) {
        const removedNPC = state.currentAdventure.characters.key_npcs[action.payload];
        if (removedNPC) {
          // Remove NPC
          state.currentAdventure.characters.key_npcs.splice(action.payload, 1);
          
          // Remove all relationships involving this NPC
          state.currentAdventure.characters.key_npcs.forEach(npc => {
            npc.relationships = npc.relationships.filter(
              rel => rel.targetNpcId !== removedNPC.id
            );
          });
        }
      }
    },

    // NPC Relationship management
    addNPCRelationship: (state, action: PayloadAction<{
      sourceNpcId: string;
      targetNpcId: string;
      type: 'ally' | 'enemy' | 'neutral' | 'family' | 'romantic' | 'rival';
      description: string;
      strength: number;
    }>) => {
      if (state.currentAdventure) {
        const { sourceNpcId, targetNpcId, type, description, strength } = action.payload;
        const sourceNPC = state.currentAdventure.characters.key_npcs.find(npc => npc.id === sourceNpcId);
        
        if (sourceNPC) {
          // Check if relationship already exists
          const existingIndex = sourceNPC.relationships.findIndex(rel => rel.targetNpcId === targetNpcId);
          
          const newRelationship = {
            targetNpcId,
            type,
            description,
            strength
          };
          
          if (existingIndex >= 0) {
            // Update existing relationship
            sourceNPC.relationships[existingIndex] = newRelationship;
          } else {
            // Add new relationship
            sourceNPC.relationships.push(newRelationship);
          }
        }
      }
    },

    removeNPCRelationship: (state, action: PayloadAction<{
      sourceNpcId: string;
      targetNpcId: string;
    }>) => {
      if (state.currentAdventure) {
        const { sourceNpcId, targetNpcId } = action.payload;
        const sourceNPC = state.currentAdventure.characters.key_npcs.find(npc => npc.id === sourceNpcId);
        
        if (sourceNPC) {
          sourceNPC.relationships = sourceNPC.relationships.filter(
            rel => rel.targetNpcId !== targetNpcId
          );
        }
      }
    },

    updateNPCRelationship: (state, action: PayloadAction<{
      sourceNpcId: string;
      targetNpcId: string;
      updates: Partial<{
        type: 'ally' | 'enemy' | 'neutral' | 'family' | 'romantic' | 'rival';
        description: string;
        strength: number;
      }>;
    }>) => {
      if (state.currentAdventure) {
        const { sourceNpcId, targetNpcId, updates } = action.payload;
        const sourceNPC = state.currentAdventure.characters.key_npcs.find(npc => npc.id === sourceNpcId);
        
        if (sourceNPC) {
          const relationship = sourceNPC.relationships.find(rel => rel.targetNpcId === targetNpcId);
          if (relationship) {
            Object.assign(relationship, updates);
          }
        }
      }
    },

    // Goals and hooks management
    addSecondaryGoal: (state, action: PayloadAction<string>) => {
      if (state.currentAdventure && action.payload.trim()) {
        state.currentAdventure.plot.secondary_goals.push(action.payload.trim());
      }
    },

    removeSecondaryGoal: (state, action: PayloadAction<number>) => {
      if (state.currentAdventure) {
        state.currentAdventure.plot.secondary_goals.splice(action.payload, 1);
      }
    },

    addPlotHook: (state, action: PayloadAction<string>) => {
      if (state.currentAdventure && action.payload.trim()) {
        state.currentAdventure.plot.plot_hooks.push(action.payload.trim());
      }
    },

    removePlotHook: (state, action: PayloadAction<number>) => {
      if (state.currentAdventure) {
        state.currentAdventure.plot.plot_hooks.splice(action.payload, 1);
      }
    },

    addLocation: (state, action: PayloadAction<string>) => {
      if (state.currentAdventure && action.payload.trim()) {
        if (!state.currentAdventure.setting.locations) {
          state.currentAdventure.setting.locations = [];
        }
        state.currentAdventure.setting.locations.push(action.payload.trim());
      }
    },

    removeLocation: (state, action: PayloadAction<number>) => {
      if (state.currentAdventure && state.currentAdventure.setting.locations) {
        state.currentAdventure.setting.locations.splice(action.payload, 1);
      }
    },

    // Validation
    setValidationStarted: (state) => {
      state.isValidating = true;
    },

    setValidationResult: (state, action: PayloadAction<AdventureValidationResult>) => {
      state.validationResult = action.payload;
      state.isValidating = false;
    },

    clearValidationResult: (state) => {
      state.validationResult = null;
      state.isValidating = false;
    },

    // Suggestions
    setSuggestions: (state, action: PayloadAction<AdventureSuggestion[]>) => {
      state.suggestions = action.payload;
    },

    clearSuggestions: (state) => {
      state.suggestions = [];
    },

    // User adventures
    setUserAdventures: (state, action: PayloadAction<UserAdventureItem[]>) => {
      state.userAdventures = action.payload;
    },

    addUserAdventure: (state, action: PayloadAction<UserAdventureItem>) => {
      state.userAdventures.unshift(action.payload);
    },

    // Public templates
    setPublicTemplates: (state, action: PayloadAction<AdventureTemplate[]>) => {
      state.publicTemplates = action.payload;
    },

    // Load from template
    loadFromTemplate: (state, action: PayloadAction<AdventureDetails>) => {
      state.currentAdventure = action.payload;
      state.isCreating = true;
      state.currentStep = 0;
    },

    // Batch updates
    setCurrentAdventure: (state, action: PayloadAction<AdventureDetails>) => {
      state.currentAdventure = action.payload;
    },

    resetWizard: (state) => {
      state.currentStep = 0;
      state.validationResult = null;
      state.suggestions = [];
    },
  },
});

export const {
  startCreating,
  stopCreating,
  setCurrentStep,
  nextStep,
  previousStep,
  updateAdventureField,
  updateBasicInfo,
  updateSetting,
  updateTimePeriod,
  updateCharacters,
  updatePlot,
  updateStylePreferences,
  addNPC,
  updateNPC,
  removeNPC,
  addNPCRelationship,
  removeNPCRelationship,
  updateNPCRelationship,
  addSecondaryGoal,
  removeSecondaryGoal,
  addPlotHook,
  removePlotHook,
  addLocation,
  removeLocation,
  setValidationStarted,
  setValidationResult,
  clearValidationResult,
  setSuggestions,
  clearSuggestions,
  setUserAdventures,
  addUserAdventure,
  setPublicTemplates,
  loadFromTemplate,
  setCurrentAdventure,
  resetWizard,
} = customAdventureSlice.actions;

export default customAdventureSlice.reducer;

// Selectors
export const selectCurrentAdventure = (state: { customAdventure: CustomAdventureState }) => 
  state.customAdventure.currentAdventure;

export const selectValidationResult = (state: { customAdventure: CustomAdventureState }) => 
  state.customAdventure.validationResult;

export const selectSuggestions = (state: { customAdventure: CustomAdventureState }) => 
  state.customAdventure.suggestions;

export const selectCurrentStep = (state: { customAdventure: CustomAdventureState }) => 
  state.customAdventure.currentStep;

export const selectIsCreating = (state: { customAdventure: CustomAdventureState }) => 
  state.customAdventure.isCreating;

export const selectUserAdventures = (state: { customAdventure: CustomAdventureState }) => 
  state.customAdventure.userAdventures;

export const selectPublicTemplates = (state: { customAdventure: CustomAdventureState }) => 
  state.customAdventure.publicTemplates;

export const selectCanNavigateNext = (state: { customAdventure: CustomAdventureState }) => {
  const { currentStep, maxSteps, currentAdventure } = state.customAdventure;
  
  if (!currentAdventure) return false;
  if (currentStep >= maxSteps - 1) return false;
  
  // Check if current step is complete
  switch (currentStep) {
    case 0: // Basic Info
      return currentAdventure.title?.trim().length >= 3 && 
             currentAdventure.description?.trim().length >= 10;
    case 1: // Setting
      return currentAdventure.setting?.world_description?.trim().length >= 50 &&
             currentAdventure.setting?.environment?.trim().length > 0 &&
             (typeof currentAdventure.setting?.time_period === 'object' 
               ? currentAdventure.setting?.time_period?.value?.trim().length > 0
               : currentAdventure.setting?.time_period?.trim().length > 0);
    case 2: // Plot
      return currentAdventure.plot?.main_objective?.trim().length > 0 &&
             currentAdventure.plot?.victory_conditions?.trim().length > 0;
    case 3: // Characters
      return currentAdventure.characters?.player_role?.trim().length > 0;
    case 4: // Style
      return true; // Style has defaults
    default:
      return false;
  }
};

export const selectCanNavigatePrevious = (state: { customAdventure: CustomAdventureState }) => 
  state.customAdventure.currentStep > 0;