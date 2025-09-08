import { CustomAdventureValidator } from '../customAdventureValidator';
import { AdventureDetails, AdventureValidationResult, AdventureSuggestion } from '../../../../shared/types';

describe('CustomAdventureValidator', () => {

  describe('validateAdventureDetails', () => {
    it('should validate a complete adventure successfully', async () => {
      const adventure: AdventureDetails = {
        title: 'Test Adventure',
        description: 'A test adventure for validation that meets minimum length requirements for proper testing',
        setting: {
          world_description: 'A fantasy world with magic and mysterious creatures roaming the lands',
          time_period: 'medieval',
          environment: 'A lush forest with ancient trees and hidden caves'
        },
        characters: {
          player_role: 'A brave knight on a noble quest to save the realm',
          key_npcs: [{
            name: 'Test NPC',
            description: 'A wise old sage who guides heroes on their journey',
            relationship: 'mentor'
          }]
        },
        plot: {
          main_objective: 'Save the kingdom from an ancient evil that threatens all life',
          secondary_goals: ['Find allies', 'Gather ancient artifacts'],
          plot_hooks: ['Mysterious prophecy', 'Ancient curse awakening'],
          victory_conditions: 'Defeat the dark lord and restore peace to the land'
        },
        style_preferences: {
          tone: 'serious',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };

      const result = CustomAdventureValidator.validateAdventureDetails(adventure);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should identify missing required fields', async () => {
      const incompleteAdventure: Partial<AdventureDetails> = {
        title: '',
        description: 'Test description that meets minimum requirements for validation testing',
        setting: {
          world_description: '',
          time_period: '',
          environment: ''
        },
        characters: {
          player_role: '',
          key_npcs: []
        },
        plot: {
          main_objective: '',
          secondary_goals: [],
          plot_hooks: [],
          victory_conditions: ''
        },
        style_preferences: {
          tone: 'serious',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };

      const result = CustomAdventureValidator.validateAdventureDetails(incompleteAdventure as AdventureDetails);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error: any) => error.field === 'title')).toBe(true);
    });

    it('should detect content length violations', async () => {
      const adventure: AdventureDetails = {
        title: 'A'.repeat(101), // Exceeds MAX_TITLE_LENGTH
        description: 'Test description that meets minimum requirements',
        setting: {
          world_description: 'Test world description that meets minimum requirements for validation',
          time_period: 'medieval',
          environment: 'Test environment description'
        },
        characters: {
          player_role: 'Knight character description',
          key_npcs: []
        },
        plot: {
          main_objective: 'Test objective that meets minimum requirements',
          secondary_goals: [],
          plot_hooks: [],
          victory_conditions: 'Complete the quest successfully'
        },
        style_preferences: {
          tone: 'serious',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };

      const result = CustomAdventureValidator.validateAdventureDetails(adventure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((error: any) => error.field === 'title' && error.message.includes('100'))).toBe(true);
    });

    it('should validate NPC structure', async () => {
      const adventure: AdventureDetails = {
        title: 'Test Adventure',
        description: 'Test description that meets minimum requirements for validation testing',
        setting: {
          world_description: 'Test world description that meets minimum requirements for validation',
          time_period: 'medieval',
          environment: 'Test environment description'
        },
        characters: {
          player_role: 'Knight character description',
          key_npcs: [{
            name: '', // Invalid empty name
            description: 'Test NPC description',
            relationship: 'ally'
          }]
        },
        plot: {
          main_objective: 'Test objective that meets minimum requirements',
          secondary_goals: [],
          plot_hooks: [],
          victory_conditions: 'Complete the quest successfully'
        },
        style_preferences: {
          tone: 'serious',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };

      const result = CustomAdventureValidator.validateAdventureDetails(adventure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((error: any) => error.field?.includes('npc') && error.field?.includes('name'))).toBe(true);
    });
  });

  describe('sanitizeAdventureContent', () => {
    it('should sanitize potentially harmful content', () => {
      const adventure: AdventureDetails = {
        title: 'Test <script>alert("hack")</script> Adventure',
        description: 'Test description with <img src="x" onerror="alert(1)"> content',
        setting: {
          world_description: 'A fantasy world <script>alert("test")</script> with magic',
          time_period: 'medieval',
          environment: 'Test environment <b>description</b>'
        },
        characters: {
          player_role: 'Knight <script>hack</script> character description',
          key_npcs: [{
            name: 'Test <img src=x> NPC',
            description: 'NPC <script>alert(1)</script> description',
            relationship: 'ally'
          }]
        },
        plot: {
          main_objective: 'Test <script>evil</script> objective',
          secondary_goals: ['<script>bad</script> Secondary goal'],
          plot_hooks: ['<img onerror=alert(1)> Plot hook'],
          victory_conditions: 'Safe victory conditions'
        },
        style_preferences: {
          tone: 'serious',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };
      
      const sanitized = CustomAdventureValidator.sanitizeAdventureContent(adventure);

      expect(sanitized.title).not.toContain('<script>');
      expect(sanitized.description).not.toContain('<img');
      expect(sanitized.setting.world_description).not.toContain('<script>');
      expect(sanitized.characters.player_role).not.toContain('<script>');
      expect(sanitized.characters.key_npcs[0].name).not.toContain('<img');
    });

    it('should preserve safe content', () => {
      const adventure: AdventureDetails = {
        title: 'Safe Adventure Title',
        description: 'A completely safe description with proper content',
        setting: {
          world_description: 'A safe fantasy world with detailed descriptions',
          time_period: 'medieval',
          environment: 'Safe environment description'
        },
        characters: {
          player_role: 'A brave knight character description',
          key_npcs: [{
            name: 'Safe NPC Name',
            description: 'Safe NPC description',
            relationship: 'ally'
          }]
        },
        plot: {
          main_objective: 'Safe main objective description',
          secondary_goals: ['Safe secondary goal'],
          plot_hooks: ['Safe plot hook'],
          victory_conditions: 'Safe victory conditions'
        },
        style_preferences: {
          tone: 'serious',
          complexity: 'moderate',
          pacing: 'moderate'
        }
      };
      
      const sanitized = CustomAdventureValidator.sanitizeAdventureContent(adventure);

      expect(sanitized.title).toBe(adventure.title);
      expect(sanitized.description).toBe(adventure.description);
      expect(sanitized.setting.world_description).toBe(adventure.setting.world_description);
    });
  });
});