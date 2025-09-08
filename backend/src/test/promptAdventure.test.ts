import { gameEngine } from '../services/gameEngine';
import { openAIService } from '../services/openAIService';
import { CustomError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../../../shared/constants';
import { PromptAdventureRequest, AdventureDetails } from '../../../shared/types';

// Mock the OpenAI service
jest.mock('../services/openAIService');

describe('Prompt Adventure Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a custom game from a prompt successfully', async () => {
    // Mock the OpenAI service response
    const mockAdventureDetails: AdventureDetails = {
      title: 'Test Adventure',
      description: 'A test adventure with sufficient description to pass validation requirements',
      setting: {
        world_description: 'A fantasy world with rich lore and detailed environments that meet the minimum character requirements for validation',
        time_period: { type: 'predefined', value: 'medieval' },
        environment: 'forest'
      },
      characters: {
        player_role: 'brave knight',
        key_npcs: [{
          id: 'test-npc-1',
          name: 'Test NPC',
          description: 'A test NPC',
          relationship: 'ally',
          traits: [],
          relationships: [],
          importance: 'major'
        }]
      },
      plot: {
        main_objective: 'Save the kingdom',
        secondary_goals: [],
        plot_hooks: [],
        victory_conditions: 'Defeat the dragon'
      },
      style_preferences: {
        tone: 'serious',
        complexity: 'moderate',
        pacing: 'moderate'
      }
    };

    (openAIService.generateAdventureFromPrompt as jest.Mock).mockResolvedValue(mockAdventureDetails);

    const request: PromptAdventureRequest = {
      prompt: 'Create a fantasy adventure about a brave knight',
      style_preference: 'detailed',
      image_style: 'fantasy_art'
    };

    // Mock the createCustomGame method to avoid database connections in tests
    const mockCreateCustomGame = jest.spyOn(gameEngine, 'createCustomGame').mockResolvedValue({
      adventure_id: 'test-adventure-id',
      session_id: 'test-session-id',
      prologue: {
        narration: 'Test prologue',
        image_url: 'test-image-url',
        quick_actions: ['Look around', 'Continue']
      },
      world_state: {
        location: 'Test Location',
        inventory: [],
        npcs: [],
        flags: {},
        current_chapter: 'Prologue'
      }
    });

    const result = await gameEngine.createCustomGameFromPrompt(request, 'test-user-id');

    expect(result).toHaveProperty('session_id');
    expect(result).toHaveProperty('adventure_id');
    expect(openAIService.generateAdventureFromPrompt).toHaveBeenCalledWith('Create a fantasy adventure about a brave knight');
    
    // Clean up mock
    mockCreateCustomGame.mockRestore();
  });

  it('should handle OpenAI service errors gracefully', async () => {
    // Mock the OpenAI service to throw an error
    (openAIService.generateAdventureFromPrompt as jest.Mock).mockRejectedValue(
      new CustomError('OpenAI service error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );

    const request: PromptAdventureRequest = {
      prompt: 'Create a fantasy adventure',
      style_preference: 'detailed',
      image_style: 'fantasy_art'
    };

    await expect(gameEngine.createCustomGameFromPrompt(request, 'test-user-id'))
      .rejects
      .toThrow('OpenAI service error');
  });

  it('should validate prompt length', async () => {
    const request: PromptAdventureRequest = {
      prompt: '', // Empty prompt
      style_preference: 'detailed',
      image_style: 'fantasy_art'
    };

    // This should be caught by the route validation, but let's make sure our service handles it gracefully
    await expect(gameEngine.createCustomGameFromPrompt(request, 'test-user-id'))
      .rejects
      .toThrow();
  });
});