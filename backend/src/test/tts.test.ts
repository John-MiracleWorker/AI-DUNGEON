import request from 'supertest';
import app from '../server';
import { openAIService } from '../services/openAIService';

// Mock the OpenAI service
jest.mock('../services/openAIService');

// Mock the auth middleware to bypass authentication
jest.mock('../middleware/auth', () => {
  return {
    authMiddleware: (req: any, res: any, next: any) => {
      req.user = { id: 'test-user-id', email: 'test@example.com' };
      next();
    }
  };
});

describe('TTS API Endpoints', () => {
  const sessionId = 'test-session-id';
  const validRequestBody = {
    text: 'This is a test narration for TTS.',
    voice: 'alloy',
    speed: 1.0,
    quality: 'standard',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/voices', () => {
    it('should return available voices', async () => {
      const mockVoices = [
        { id: 'alloy', name: 'Alloy', gender: 'neutral' },
        { id: 'echo', name: 'Echo', gender: 'male' },
      ];

      (openAIService.getAvailableVoices as jest.Mock).mockReturnValue(mockVoices);

      const response = await request(app)
        .get('/api/voices')
        .expect(200);

      expect(response.body).toEqual({ voices: mockVoices });
      expect(openAIService.getAvailableVoices).toHaveBeenCalled();
    });
  });

  describe('POST /api/game/:sessionId/speech', () => {
    it('should generate speech for valid request', async () => {
      const mockAudioBuffer = Buffer.from('mock-audio-data');
      
      (openAIService.validateTTSRequest as jest.Mock).mockReturnValue(true);
      (openAIService.generateSpeech as jest.Mock).mockResolvedValue(mockAudioBuffer);

      const response = await request(app)
        .post(`/api/game/${sessionId}/speech`)
        .send(validRequestBody)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/audio/);
      expect(openAIService.validateTTSRequest).toHaveBeenCalledWith(validRequestBody.text);
      expect(openAIService.generateSpeech).toHaveBeenCalledWith(
        validRequestBody.text,
        validRequestBody.voice,
        validRequestBody.speed,
        validRequestBody.quality
      );
    });

    it('should return 400 for invalid text length', async () => {
      const invalidRequestBody = {
        ...validRequestBody,
        text: 'a'.repeat(5000), // Exceeds 4096 character limit
      };

      await request(app)
        .post(`/api/game/${sessionId}/speech`)
        .send(invalidRequestBody)
        .expect(400);
    });

    it('should return 400 for invalid voice', async () => {
      const invalidRequestBody = {
        ...validRequestBody,
        voice: 'invalid-voice',
      };

      await request(app)
        .post(`/api/game/${sessionId}/speech`)
        .send(invalidRequestBody)
        .expect(400);
    });

    it('should return 400 for invalid speed', async () => {
      const invalidRequestBody = {
        ...validRequestBody,
        speed: 5.0, // Exceeds max speed of 4.0
      };

      await request(app)
        .post(`/api/game/${sessionId}/speech`)
        .send(invalidRequestBody)
        .expect(400);
    });

    it('should return 400 for invalid quality', async () => {
      const invalidRequestBody = {
        ...validRequestBody,
        quality: 'invalid-quality',
      };

      await request(app)
        .post(`/api/game/${sessionId}/speech`)
        .send(invalidRequestBody)
        .expect(400);
    });

    it('should return 400 for invalid text content', async () => {
      (openAIService.validateTTSRequest as jest.Mock).mockReturnValue(false);

      await request(app)
        .post(`/api/game/${sessionId}/speech`)
        .send({
          ...validRequestBody,
          text: '', // Invalid empty text
        })
        .expect(400);
    });

    it('should return 500 if speech generation fails', async () => {
      (openAIService.validateTTSRequest as jest.Mock).mockReturnValue(true);
      (openAIService.generateSpeech as jest.Mock).mockRejectedValue(new Error('TTS service error'));

      await request(app)
        .post(`/api/game/${sessionId}/speech`)
        .send(validRequestBody)
        .expect(500);
    });
  });
});