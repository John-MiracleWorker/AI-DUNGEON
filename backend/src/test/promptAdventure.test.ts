import request from 'supertest';
import app from '../server';
import { gameEngine } from '../services/gameEngine';
import { CustomError } from '../middleware/errorHandler';

// Mock the game engine
jest.mock('../services/gameEngine');

describe('POST /api/new-prompt-game', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new prompt adventure successfully', async () => {
    const mockResponse = {
      adventure_id: 'test-adventure-id',
      session_id: 'test-session-id',
      prologue: {
        narration: 'Test prologue narration',
        image_url: 'http://example.com/image.jpg',
        quick_actions: ['Look around', 'Check inventory']
      },
      world_state: {
        location: 'Test Location',
        inventory: ['sword', 'shield'],
        npcs: [],
        flags: {},
        current_chapter: 'Prologue'
      }
    };

    (gameEngine.createCustomGameFromPrompt as jest.Mock).mockResolvedValue(mockResponse);

    const response = await request(app)
      .post('/api/new-prompt-game')
      .set('Authorization', 'Bearer test-token')
      .send({
        prompt: 'Create a fantasy adventure about a brave knight',
        style_preference: 'detailed',
        image_style: 'fantasy_art'
      })
      .expect(201);

    expect(response.body).toEqual(mockResponse);
    expect(gameEngine.createCustomGameFromPrompt).toHaveBeenCalledWith(
      {
        prompt: 'Create a fantasy adventure about a brave knight',
        style_preference: 'detailed',
        image_style: 'fantasy_art'
      },
      expect.any(String)
    );
  });

  it('should return 400 for invalid prompt', async () => {
    const response = await request(app)
      .post('/api/new-prompt-game')
      .set('Authorization', 'Bearer test-token')
      .send({
        prompt: '', // Empty prompt should fail validation
        style_preference: 'detailed',
        image_style: 'fantasy_art'
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should handle game engine errors properly', async () => {
    (gameEngine.createCustomGameFromPrompt as jest.Mock).mockRejectedValue(
      new CustomError('Failed to generate adventure', 500)
    );

    const response = await request(app)
      .post('/api/new-prompt-game')
      .set('Authorization', 'Bearer test-token')
      .send({
        prompt: 'Create a fantasy adventure',
        style_preference: 'detailed',
        image_style: 'fantasy_art'
      })
      .expect(500);

    expect(response.body.error).toBe('Failed to generate adventure');
  });
});