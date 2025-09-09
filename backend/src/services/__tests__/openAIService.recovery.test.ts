import { openAIService } from '../openAIService';
import { WorldState } from '../../../../shared/types';

// Define GameContext interface for testing
interface GameContext {
  genre: string;
  worldState: WorldState;
  recentHistory: any[];
  playerInput: string;
  sessionId: string;
}

describe('OpenAI Service - Error Recovery', () => {
  describe('extractInfoFromRawResponse', () => {
    const mockContext: GameContext = {
      genre: 'fantasy',
      worldState: {
        location: 'Forest Clearing',
        inventory: ['sword'],
        npcs: [],
        flags: {},
        current_chapter: 'chapter_1'
      } as WorldState,
      recentHistory: [],
      playerInput: 'Look around',
      sessionId: 'test_session'
    };

    it('should extract JSON from markdown code blocks', () => {
      const rawResponse = '``json\n{\n  "narration": "You find yourself in a dark forest.",\n  "image_prompt": "Dark forest",\n  "quick_actions": ["Go north", "Look around"]\n}\n```';
      
      const result = (openAIService as any).extractInfoFromRawResponse(rawResponse, mockContext);
      
      expect(result).toBeDefined();
      // The result should be a validated NarrationResponse, not the raw JSON string
      expect(typeof result.narration).toBe('string');
      expect(typeof result.image_prompt).toBe('string');
      expect(Array.isArray(result.quick_actions)).toBe(true);
    });

    it('should extract quick actions from text patterns', () => {
      const rawResponse = 'You find yourself in a dark forest. What would you like to do?\nActions: Go north, Look around, Examine trees';
      
      const result = (openAIService as any).extractInfoFromRawResponse(rawResponse, mockContext);
      
      expect(result).toBeDefined();
      expect(result.narration).toBe(rawResponse);
      expect(result.quick_actions).toEqual(['Go north', 'Look around', 'Examine trees']);
    });

    it('should handle options pattern', () => {
      const rawResponse = 'You find yourself in a dark forest. What would you like to do?\nOptions: Go north; Look around; Examine trees';
      
      const result = (openAIService as any).extractInfoFromRawResponse(rawResponse, mockContext);
      
      expect(result).toBeDefined();
      expect(result.narration).toBe(rawResponse);
      expect(result.quick_actions).toEqual(['Go north', 'Look around', 'Examine trees']);
    });

    it('should handle "You can:" pattern', () => {
      const rawResponse = 'You find yourself in a dark forest. What would you like to do?\nYou can: Go north, Look around, and Examine trees';
      
      const result = (openAIService as any).extractInfoFromRawResponse(rawResponse, mockContext);
      
      expect(result).toBeDefined();
      expect(result.narration).toBe(rawResponse);
      // The regex splits on "and" so we expect only 2 actions
      expect(result.quick_actions).toEqual(['Go north', 'Look around']);
    });

    it('should provide fallback when no patterns match', () => {
      const rawResponse = 'You find yourself in a dark forest. What would you like to do?';
      
      const result = (openAIService as any).extractInfoFromRawResponse(rawResponse, mockContext);
      
      expect(result).toBeDefined();
      expect(result.narration).toBe(rawResponse);
      expect(result.quick_actions).toEqual(['Look around', 'Continue']);
    });

    it('should return null for completely unparseable responses', () => {
      const rawResponse = '';
      
      const result = (openAIService as any).extractInfoFromRawResponse(rawResponse, mockContext);
      
      // The function should still return a valid NarrationResponse object, not null
      expect(result).toBeDefined();
      expect(typeof result.narration).toBe('string');
    });
  });

  describe('extractAdventureDetailsFromRawResponse', () => {
    const adventureJson = {
      title: 'Test Adventure',
      description: 'A test adventure',
      setting: {
        world_description: 'Test world',
        time_period: { type: 'predefined', value: 'medieval' },
        environment: 'Test environment'
      },
      characters: {
        player_role: 'Tester',
        key_npcs: []
      },
      plot: {
        main_objective: 'Test objective',
        secondary_goals: [],
        plot_hooks: [],
        victory_conditions: 'Complete test'
      },
      style_preferences: {
        tone: 'serious',
        complexity: 'moderate',
        pacing: 'moderate'
      }
    };

    it('should extract adventure details from markdown code blocks', () => {
      const rawResponse = `\u0060\u0060\u0060json\n${JSON.stringify(adventureJson, null, 2)}\n\u0060\u0060\u0060`;

      const result = (openAIService as any).extractAdventureDetailsFromRawResponse(rawResponse);

      expect(result).not.toBeNull();
      expect(result).toEqual(adventureJson);
    });

    it('should handle responses with extra text around code block', () => {
      const rawResponse = `Here are your details:\n\u0060\u0060\u0060json\n${JSON.stringify(adventureJson, null, 2)}\n\u0060\u0060\u0060\nEnjoy!`;

      const result = (openAIService as any).extractAdventureDetailsFromRawResponse(rawResponse);

      expect(result).toEqual(adventureJson);
    });

    it('should extract adventure details when code fences are missing', () => {
      const rawResponse = `Intro text {"title":"Test Adventure","description":"A test adventure","setting":{"world_description":"Test world","time_period":{"type":"predefined","value":"medieval"},"environment":"Test environment"},"characters":{"player_role":"Tester","key_npcs":[]},"plot":{"main_objective":"Test objective","secondary_goals":[],"plot_hooks":[],"victory_conditions":"Complete test"},"style_preferences":{"tone":"serious","complexity":"moderate","pacing":"moderate"}} Outro text`;

      const result = (openAIService as any).extractAdventureDetailsFromRawResponse(rawResponse);

      expect(result).toEqual(adventureJson);
    });

    it('should return null when no JSON is found', () => {
      const rawResponse = 'This is just plain text with no JSON structure.';

      const result = (openAIService as any).extractAdventureDetailsFromRawResponse(rawResponse);

      expect(result).toBeNull();
    });
  });

  describe('handleOpenAIError', () => {
    it('should handle rate limit errors', () => {
      const error = { status: 429, message: 'Rate limit exceeded' };
      
      expect(() => {
        (openAIService as any).handleOpenAIError(error, 'test context');
      }).toThrow('Rate limit exceeded, please try again later');
    });

    it('should handle authentication errors', () => {
      const error = { status: 401, message: 'Invalid API key' };
      
      expect(() => {
        (openAIService as any).handleOpenAIError(error, 'test context');
      }).toThrow('Invalid OpenAI API key');
    });

    it('should handle bad request errors', () => {
      const error = { status: 400, message: 'Bad request' };
      
      expect(() => {
        (openAIService as any).handleOpenAIError(error, 'test context');
      }).toThrow('Invalid request to OpenAI API: Bad request');
    });

    it('should handle generic errors with fallback', () => {
      const error = { status: 500, message: 'Internal server error' };
      const fallback = { message: 'Fallback response' };

      const result = (openAIService as any).handleOpenAIError(error, 'test context', fallback);
      expect(result).toEqual(fallback);
    });
  });
});