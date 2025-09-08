import request from 'supertest';
import express from 'express';
import gameRoutes from '../routes/game';
import { CustomError } from '../middleware/errorHandler';

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api', gameRoutes);

// Mock the game engine
jest.mock('../services/gameEngine', () => {
  return {
    gameEngine: {
      createNewGame: jest.fn(),
      createCustomGame: jest.fn(),
      createCustomGameFromPrompt: jest.fn(),
    }
  };
});

// Mock auth middleware
jest.mock('../middleware/auth', () => {
  return {
    authenticateToken: (req: any, res: any, next: any) => {
      req.user = { id: 'test-user-id' };
      next();
    }
  };
});

// Mock validation
jest.mock('express-validator', () => {
  return {
    body: () => ({ isEmpty: () => false, isIn: () => ({ withMessage: () => ({}) }) }),
    param: () => ({ isEmpty: () => false, notEmpty: () => ({ withMessage: () => ({}) }) }),
    validationResult: () => ({ isEmpty: () => true }),
  };
});

// Mock asyncHandler
jest.mock('../middleware/errorHandler', () => {
  return {
    asyncHandler: (fn: any) => fn,
    CustomError: jest.requireActual('../middleware/errorHandler').CustomError
  };
});

describe('Game API - Error Responses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/new-game', () => {
    it('should return detailed validation errors', async () => {
      // Mock validation errors
      jest.mock('express-validator', () => {
        return {
          body: () => ({ isEmpty: () => false, isIn: () => ({ withMessage: () => ({}) }) }),
          param: () => ({ isEmpty: () => false, notEmpty: () => ({ withMessage: () => ({}) }) }),
          validationResult: () => ({
            isEmpty: () => false,
            array: () => [{ msg: 'Invalid genre', param: 'genre' }]
          }),
        };
      });

      const response = await request(app)
        .post('/api/new-game')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('message', 'Invalid genre');
      expect(response.body).toHaveProperty('details');
    });

    it('should return detailed error for CustomError', async () => {
      const { gameEngine } = require('../services/gameEngine');
      gameEngine.createNewGame.mockRejectedValue(
        new CustomError('Test custom error', 422)
      );

      const response = await request(app)
        .post('/api/new-game')
        .send({
          genre: 'fantasy',
          style_preference: 'detailed',
          image_style: 'fantasy_art'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error', 'Test custom error');
      expect(response.body).toHaveProperty('message', 'Test custom error');
      expect(response.body).toHaveProperty('statusCode', 422);
    });

    it('should return generic error for unknown errors', async () => {
      const { gameEngine } = require('../services/gameEngine');
      gameEngine.createNewGame.mockRejectedValue(new Error('Unknown error'));

      const response = await request(app)
        .post('/api/new-game')
        .send({
          genre: 'fantasy',
          style_preference: 'detailed',
          image_style: 'fantasy_art'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to create new game');
      expect(response.body).toHaveProperty('message', 'An unexpected error occurred while creating your game. Please try again.');
    });
  });

  describe('POST /api/new-prompt-game', () => {
    it('should return detailed error for CustomError', async () => {
      const { gameEngine } = require('../services/gameEngine');
      gameEngine.createCustomGameFromPrompt.mockRejectedValue(
        new CustomError('Prompt generation failed', 422)
      );

      const response = await request(app)
        .post('/api/new-prompt-game')
        .send({
          prompt: 'Create a fantasy adventure'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error', 'Prompt generation failed');
      expect(response.body).toHaveProperty('message', 'Prompt generation failed');
      expect(response.body).toHaveProperty('statusCode', 422);
    });

    it('should return generic error for unknown errors', async () => {
      const { gameEngine } = require('../services/gameEngine');
      gameEngine.createCustomGameFromPrompt.mockRejectedValue(new Error('Unknown error'));

      const response = await request(app)
        .post('/api/new-prompt-game')
        .send({
          prompt: 'Create a fantasy adventure'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to generate adventure from prompt');
      expect(response.body).toHaveProperty('message', 'An unexpected error occurred while creating your adventure. Please try again.');
    });
  });
});