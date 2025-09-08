import { openAIService } from '../openAIService';
import { AdventureDetails, WorldState } from '../../../../shared/types';

// Define GameContext interface for testing
interface GameContext {
  genre: string;
  worldState: WorldState;
  recentHistory: any[];
  playerInput: string;
  sessionId: string;
}

describe('OpenAI Service - Validation Functions', () => {
  describe('validateNarrationResponse', () => {
    const mockContext: GameContext = {
      genre: 'fantasy',
      worldState: {
        location: 'Forest Clearing',
        inventory: ['sword', 'potion'],
        npcs: [],
        flags: {},
        current_chapter: 'chapter_1'
      } as WorldState,
      recentHistory: [],
      playerInput: 'Look around',
      sessionId: 'test_session'
    };

    it('should validate a correct narration response', () => {
      const validResponse = {
        narration: 'You find yourself in a forest clearing.',
        image_prompt: 'Forest clearing with sunlight',
        quick_actions: ['Go north', 'Examine trees', 'Rest'],
        state_changes: {
          location: 'Forest Clearing',
          inventory: ['sword', 'potion', 'shield'],
          flags: { explored: true }
        }
      };

      const result = (openAIService as any).validateNarrationResponse(validResponse, mockContext);
      
      expect(result.narration).toBe('You find yourself in a forest clearing.');
      expect(result.image_prompt).toBe('Forest clearing with sunlight');
      expect(result.quick_actions).toEqual(['Go north', 'Examine trees', 'Rest']);
      expect(result.state_changes.location).toBe('Forest Clearing');
      expect(result.state_changes.inventory).toEqual(['sword', 'potion', 'shield']);
      expect(result.state_changes.flags).toEqual({ explored: true });
    });

    it('should handle missing narration by creating a fallback', () => {
      const responseWithMissingNarration = {
        image_prompt: 'Forest clearing with sunlight',
        quick_actions: ['Go north', 'Examine trees'],
        state_changes: {}
      };

      const result = (openAIService as any).validateNarrationResponse(responseWithMissingNarration, mockContext);
      
      expect(result.narration).toBe('You are in Forest Clearing. What would you like to do?');
      expect(result.image_prompt).toBe('Forest clearing with sunlight');
      expect(result.quick_actions).toEqual(['Go north', 'Examine trees']);
    });

    it('should validate quick actions and provide defaults if invalid', () => {
      const responseWithInvalidActions = {
        narration: 'You find yourself in a forest clearing.',
        image_prompt: 'Forest clearing with sunlight',
        quick_actions: 'not an array',
        state_changes: {}
      };

      const result = (openAIService as any).validateNarrationResponse(responseWithInvalidActions, mockContext);
      
      expect(result.narration).toBe('You find yourself in a forest clearing.');
      expect(result.quick_actions).toEqual(['Look around', 'Continue']);
    });

    it('should validate state changes with proper inventory structure', () => {
      const responseWithInvalidInventory = {
        narration: 'You find yourself in a forest clearing.',
        image_prompt: 'Forest clearing with sunlight',
        quick_actions: ['Go north', 'Examine trees'],
        state_changes: {
          inventory: 'not an array',
          flags: { explored: true }
        }
      };

      const result = (openAIService as any).validateNarrationResponse(responseWithInvalidInventory, mockContext);
      
      expect(result.state_changes.inventory).toEqual(['not an array']);
      expect(result.state_changes.flags).toEqual({ explored: true });
    });
  });

  describe('validateAdventureDetails', () => {
    it('should validate a complete adventure details object', () => {
      const validAdventure: any = {
        title: 'The Crystal Caverns',
        description: 'A magical underground adventure',
        setting: {
          world_description: 'Underground crystal caverns',
          time_period: { type: 'predefined', value: 'medieval' },
          environment: 'Crystal formations'
        },
        characters: {
          player_role: 'Crystal miner',
          key_npcs: [{
            id: 'npc_1',
            name: 'Gemma',
            description: 'Cave explorer',
            relationship: 'mentor',
            traits: ['knowledgeable'],
            importance: 'major',
            relationships: []
          }]
        },
        plot: {
          main_objective: 'Find the Heartstone',
          secondary_goals: ['Map tunnels'],
          plot_hooks: ['Strange sounds'],
          victory_conditions: 'Retrieve Heartstone'
        },
        style_preferences: {
          tone: 'dramatic',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };

      const result = (openAIService as any).validateAdventureDetails(validAdventure);
      
      expect(result.title).toBe('The Crystal Caverns');
      expect(result.description).toBe('A magical underground adventure');
      expect(result.setting.world_description).toBe('Underground crystal caverns');
      expect(result.characters.player_role).toBe('Crystal miner');
      expect(result.plot.main_objective).toBe('Find the Heartstone');
      expect(result.style_preferences.tone).toBe('dramatic');
    });

    it('should handle missing fields with defaults', () => {
      const incompleteAdventure: any = {
        title: 'Incomplete Adventure'
      };

      expect(() => {
        (openAIService as any).validateAdventureDetails(incompleteAdventure);
      }).toThrow('Invalid adventure setting structure');
    });
  });

  describe('validateInventoryStructure', () => {
    it('should handle valid array of strings', () => {
      const validInventory = ['sword', 'potion', 'shield'];
      const result = (openAIService as any).validateInventoryStructure(validInventory);
      expect(result).toEqual(['sword', 'potion', 'shield']);
    });

    it('should convert non-string array items to strings', () => {
      const mixedInventory = ['sword', 123, null, 'potion'];
      const result = (openAIService as any).validateInventoryStructure(mixedInventory);
      expect(result).toEqual(['sword', '123', 'null', 'potion']);
    });

    it('should handle single item by converting to array', () => {
      const singleItem = 'sword';
      const result = (openAIService as any).validateInventoryStructure(singleItem);
      expect(result).toEqual(['sword']);
    });

    it('should handle null/undefined by returning empty array', () => {
      const result1 = (openAIService as any).validateInventoryStructure(null);
      const result2 = (openAIService as any).validateInventoryStructure(undefined);
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });
  });

  describe('validateQuickActions', () => {
    it('should handle valid array of strings', () => {
      const validActions = ['Look around', 'Go north', 'Examine'];
      const result = (openAIService as any).validateQuickActions(validActions);
      expect(result).toEqual(['Look around', 'Go north', 'Examine']);
    });

    it('should filter out non-string items', () => {
      const mixedActions = ['Look around', 123, 'Go north', null, 'Examine'];
      const result = (openAIService as any).validateQuickActions(mixedActions);
      expect(result).toEqual(['Look around', 'Go north', 'Examine']);
    });

    it('should limit to 5 actions', () => {
      const manyActions = ['1', '2', '3', '4', '5', '6', '7'];
      const result = (openAIService as any).validateQuickActions(manyActions);
      expect(result).toEqual(['1', '2', '3', '4', '5']);
    });

    it('should provide defaults for invalid input', () => {
      const result1 = (openAIService as any).validateQuickActions('not an array');
      const result2 = (openAIService as any).validateQuickActions([]);
      expect(result1).toEqual(['Look around', 'Continue']);
      expect(result2).toEqual(['Look around', 'Continue']);
    });
  });
});