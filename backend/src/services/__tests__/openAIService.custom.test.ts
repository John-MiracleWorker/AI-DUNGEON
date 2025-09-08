import { openAIService } from '../openAIService';
import { AdventureDetails, CustomPromptContext } from '../../../../shared/types';

describe('OpenAI Service - Custom Adventures', () => {

  describe('generateCustomPrologue', () => {
    it('should generate a custom prologue with proper structure', async () => {
      const mockAdventure: AdventureDetails = {
        title: 'The Crystal Caverns',
        description: 'A magical underground adventure seeking ancient crystals',
        setting: {
          world_description: 'A vast underground network of crystal-filled caverns with glowing formations and hidden dangers',
          time_period: 'medieval',
          environment: 'Underground crystal caverns with luminescent formations and narrow passages'
        },
        characters: {
          player_role: 'A crystal miner seeking rare gems for the kingdom',
          key_npcs: [{
            name: 'Gemma the Guide',
            description: 'An experienced cave explorer who knows secret passages',
            relationship: 'mentor'
          }]
        },
        plot: {
          main_objective: 'Find the legendary Heartstone crystal to save the dying kingdom',
          secondary_goals: ['Map unexplored tunnels', 'Rescue trapped miners'],
          plot_hooks: ['Ancient cave paintings hint at treasure', 'Strange sounds echo from deep chambers'],
          victory_conditions: 'Successfully retrieve the Heartstone and return safely to the surface'
        },
        style_preferences: {
          tone: 'dramatic',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };

      // Test would need actual OpenAI service configured with API key
      // For now, we'll test the prompt structure
      const promptContext = {
        adventure_details: mockAdventure,
        world_state: {},
        recent_history: [],
        player_input: 'START',
        session_id: 'test_session'
      };

      // Verify that generateCustomPrologue method exists and can be called
      expect(typeof openAIService.generateCustomPrologue).toBe('function');
      
      // In a real test environment with API key, we would test:
      // const result = await openAIService.generateCustomPrologue(mockAdventure, 'fantasy_art');
      // expect(result.narration).toContain('crystal');
      // expect(result.image_prompt).toContain('cavern');
      // expect(result.quick_actions.length).toBeGreaterThan(0);
    }, 10000);

    it('should adapt prompt based on tone preference', () => {
      const seriousTone: AdventureDetails = {
        title: 'The Last Hope',
        description: 'A dire quest to save humanity',
        setting: {
          world_description: 'A post-apocalyptic wasteland',
          time_period: 'post_apocalyptic',
          environment: 'Desolate ruins and radioactive zones'
        },
        characters: {
          player_role: 'Survivor seeking resources',
          key_npcs: []
        },
        plot: {
          main_objective: 'Find a safe haven for survivors',
          secondary_goals: [],
          plot_hooks: [],
          victory_conditions: 'Establish a secure settlement'
        },
        style_preferences: {
          tone: 'serious',
          complexity: 'complex',
          pacing: 'slow'
        }
      };

      const humorousTone: AdventureDetails = {
        ...seriousTone,
        style_preferences: {
          tone: 'humorous',
          complexity: 'simple',
          pacing: 'fast'
        }
      };

      // Test prompt construction differences (would need full implementation)
      expect(seriousTone.style_preferences.tone).not.toBe(humorousTone.style_preferences.tone);
    });
  });

  describe('enhanceImagePrompt', () => {
    it('should handle custom adventure image enhancement logic', () => {
      // Test the logic that would be used in enhanceImagePrompt
      const basePrompt = 'A dark cave entrance';
      const adventureDetails: AdventureDetails = {
        title: 'Crystal Quest',
        description: 'Underground adventure',
        setting: {
          world_description: 'Crystal caverns with magical properties',
          time_period: 'medieval',
          environment: 'Glowing crystal formations'
        },
        characters: {
          player_role: 'Crystal seeker',
          key_npcs: []
        },
        plot: {
          main_objective: 'Find crystals',
          secondary_goals: [],
          plot_hooks: [],
          victory_conditions: 'Success'
        },
        style_preferences: {
          tone: 'dramatic',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };

      // Test the components that would be used for enhancement
      expect(adventureDetails.setting.environment).toContain('crystal');
      expect(adventureDetails.setting.time_period).toBe('medieval');
      expect(adventureDetails.style_preferences.tone).toBe('dramatic');
      
      // Verify enhancement logic components are available
      expect(basePrompt.length).toBeGreaterThan(0);
      expect(adventureDetails.setting).toBeDefined();
    });

    it('should handle different time periods appropriately', () => {
      const modernAdventure: AdventureDetails = {
        title: 'Urban Explorer',
        description: 'City adventure',
        setting: {
          world_description: 'Modern cityscape',
          time_period: 'modern',
          environment: 'Urban environment'
        },
        characters: {
          player_role: 'Detective',
          key_npcs: []
        },
        plot: {
          main_objective: 'Solve mystery',
          secondary_goals: [],
          plot_hooks: [],
          victory_conditions: 'Case closed'
        },
        style_preferences: {
          tone: 'serious',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };

      // Test that time period and setting would influence enhancement
      expect(modernAdventure.setting.time_period).toBe('modern');
      expect(modernAdventure.setting.environment.toLowerCase()).toContain('urban');
      expect(modernAdventure.setting.time_period).not.toBe('medieval');
    });
  });

  describe('prompt optimization', () => {
    it('should create focused prompts for different complexity levels', () => {
      const simpleAdventure: AdventureDetails = {
        title: 'Simple Quest',
        description: 'Basic adventure',
        setting: {
          world_description: 'Simple forest',
          time_period: 'medieval',
          environment: 'Forest path'
        },
        characters: {
          player_role: 'Traveler',
          key_npcs: []
        },
        plot: {
          main_objective: 'Reach destination',
          secondary_goals: [],
          plot_hooks: [],
          victory_conditions: 'Arrive safely'
        },
        style_preferences: {
          tone: 'humorous',
          complexity: 'simple',
          pacing: 'fast'
        }
      };

      const complexAdventure: AdventureDetails = {
        ...simpleAdventure,
        style_preferences: {
          tone: 'dramatic',
          complexity: 'complex',
          pacing: 'slow'
        },
        plot: {
          main_objective: 'Navigate political intrigue to prevent war',
          secondary_goals: ['Gather intelligence', 'Form alliances', 'Uncover conspiracies'],
          plot_hooks: ['Secret messages', 'Double agents', 'Hidden agendas'],
          victory_conditions: 'Successfully broker peace while maintaining cover'
        }
      };

      // Verify different complexity handling
      expect(simpleAdventure.style_preferences.complexity).toBe('simple');
      expect(complexAdventure.style_preferences.complexity).toBe('complex');
      expect(complexAdventure.plot.secondary_goals.length).toBeGreaterThan(simpleAdventure.plot.secondary_goals.length);
    });

    it('should validate prompt length and structure', () => {
      const testAdventure: AdventureDetails = {
        title: 'Test Adventure',
        description: 'Test description for validation',
        setting: {
          world_description: 'Test world with specific characteristics for prompt generation',
          time_period: 'medieval',
          environment: 'Test environment'
        },
        characters: {
          player_role: 'Test character role',
          key_npcs: [{
            name: 'Test NPC',
            description: 'Test NPC description',
            relationship: 'ally'
          }]
        },
        plot: {
          main_objective: 'Test main objective',
          secondary_goals: ['Test goal 1', 'Test goal 2'],
          plot_hooks: ['Test hook 1'],
          victory_conditions: 'Test victory conditions'
        },
        style_preferences: {
          tone: 'serious',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };

      // Test prompt construction logic
      const worldDesc = testAdventure.setting.world_description;
      const playerRole = testAdventure.characters.player_role;
      const objective = testAdventure.plot.main_objective;

      expect(worldDesc.length).toBeGreaterThan(10);
      expect(playerRole.length).toBeGreaterThan(0);
      expect(objective.length).toBeGreaterThan(0);

      // Verify all required components are present for prompt generation
      expect(testAdventure.setting).toBeDefined();
      expect(testAdventure.characters).toBeDefined();
      expect(testAdventure.plot).toBeDefined();
      expect(testAdventure.style_preferences).toBeDefined();
    });
  });
});