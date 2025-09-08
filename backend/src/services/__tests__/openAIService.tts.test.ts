import { openAIService } from '../openAIService';
import { CustomError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../../../shared/constants';

// Mock the OpenAI module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        apiKey: 'test-api-key',
        audio: {
          speech: {
            create: jest.fn()
          }
        }
      };
    })
  };
});

describe('OpenAI TTS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTTSRequest', () => {
    it('should return true for valid text', () => {
      const validText = 'This is a valid TTS request text.';
      expect(openAIService.validateTTSRequest(validText)).toBe(true);
    });

    it('should return false for empty text', () => {
      expect(openAIService.validateTTSRequest('')).toBe(false);
    });

    it('should return false for text exceeding 4096 characters', () => {
      const longText = 'a'.repeat(4097);
      expect(openAIService.validateTTSRequest(longText)).toBe(false);
    });

    it('should return false for whitespace-only text', () => {
      expect(openAIService.validateTTSRequest('   ')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(openAIService.validateTTSRequest(null as any)).toBe(false);
      expect(openAIService.validateTTSRequest(undefined as any)).toBe(false);
      expect(openAIService.validateTTSRequest(123 as any)).toBe(false);
    });
  });

  describe('getAvailableVoices', () => {
    it('should return an array of available voices', () => {
      const voices = openAIService.getAvailableVoices();
      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBeGreaterThan(0);
      
      // Check that each voice has the required properties
      voices.forEach(voice => {
        expect(voice).toHaveProperty('id');
        expect(voice).toHaveProperty('name');
        expect(voice).toHaveProperty('gender');
      });
    });
  });

  describe('generateSpeech', () => {
    it('should throw error when API key is not configured', async () => {
      // Create a new instance with no API key
      const serviceWithoutKey = new (openAIService.constructor as any)();
      serviceWithoutKey.openai.apiKey = '';
      
      await expect(serviceWithoutKey.generateSpeech('Test text', 'alloy'))
        .rejects
        .toThrow('OpenAI API key not configured');
    });

    it('should throw error for text exceeding 4096 characters', async () => {
      const longText = 'a'.repeat(4097);
      await expect(openAIService.generateSpeech(longText, 'alloy'))
        .rejects
        .toThrow('Text must be between 1 and 4096 characters');
    });

    it('should throw error for invalid voice', async () => {
      const text = 'Test text';
      await expect(openAIService.generateSpeech(text, 'invalid-voice'))
        .rejects
        .toThrow('Invalid voice');
    });

    it('should throw error for speed outside valid range', async () => {
      const text = 'Test text';
      await expect(openAIService.generateSpeech(text, 'alloy', 0.1))
        .rejects
        .toThrow('Speed must be between 0.25 and 4.0');
      
      await expect(openAIService.generateSpeech(text, 'alloy', 5.0))
        .rejects
        .toThrow('Speed must be between 0.25 and 4.0');
    });
  });
});