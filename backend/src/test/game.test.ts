import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../server';
import { GameSession } from '../models';

describe('Game API Endpoints', () => {
  let mongoServer: MongoMemoryServer;
  let authToken: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create anonymous session to get auth token
    const authResponse = await request(app)
      .post('/api/auth/anonymous')
      .expect(201);
    
    authToken = authResponse.body.token;
  });

  afterAll(async () => {
    if (mongoServer) {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  });

  afterEach(async () => {
    // Clean up database after each test
    await GameSession.deleteMany({});
  });

  describe('POST /api/new-game', () => {
    it('should create a new game session', async () => {
      const gameRequest = {
        genre: 'fantasy',
        style_preference: 'detailed',
        image_style: 'fantasy_art'
      };

      const response = await request(app)
        .post('/api/new-game')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameRequest)
        .expect(201);

      expect(response.body).toHaveProperty('session_id');
      expect(response.body).toHaveProperty('prologue');
      expect(response.body).toHaveProperty('world_state');
      expect(response.body.prologue).toHaveProperty('narration');
      expect(response.body.prologue).toHaveProperty('quick_actions');
      expect(Array.isArray(response.body.prologue.quick_actions)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const gameRequest = {
        genre: 'fantasy',
        style_preference: 'detailed',
        image_style: 'fantasy_art'
      };

      await request(app)
        .post('/api/new-game')
        .send(gameRequest)
        .expect(401);
    });

    it('should validate genre field', async () => {
      const gameRequest = {
        genre: 'invalid_genre',
        style_preference: 'detailed',
        image_style: 'fantasy_art'
      };

      await request(app)
        .post('/api/new-game')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameRequest)
        .expect(400);
    });
  });

  describe('GET /api/game/:sessionId', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a test game session
      const gameRequest = {
        genre: 'fantasy',
        style_preference: 'detailed',
        image_style: 'fantasy_art'
      };

      const response = await request(app)
        .post('/api/new-game')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameRequest);

      sessionId = response.body.session_id;
    });

    it('should load existing game session', async () => {
      const response = await request(app)
        .get(`/api/game/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('session_id', sessionId);
      expect(response.body).toHaveProperty('world_state');
      expect(response.body).toHaveProperty('turn_history');
      expect(response.body).toHaveProperty('metadata');
    });

    it('should fail for non-existent session', async () => {
      await request(app)
        .get('/api/game/nonexistent_session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/save-game', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a test game session
      const gameRequest = {
        genre: 'fantasy',
        style_preference: 'detailed',
        image_style: 'fantasy_art'
      };

      const response = await request(app)
        .post('/api/new-game')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameRequest);

      sessionId = response.body.session_id;
    });

    it('should save game successfully', async () => {
      const saveRequest = {
        session_id: sessionId,
        save_name: 'Test Save'
      };

      const response = await request(app)
        .post('/api/save-game')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saveRequest)
        .expect(201);

      expect(response.body).toHaveProperty('save_id');
      expect(response.body).toHaveProperty('message');
    });

    it('should validate save name', async () => {
      const saveRequest = {
        session_id: sessionId,
        save_name: ''
      };

      await request(app)
        .post('/api/save-game')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saveRequest)
        .expect(400);
    });
  });

  describe('GET /api/saved-games', () => {
    it('should return saved games list', async () => {
      const response = await request(app)
        .get('/api/saved-games')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('saves');
      expect(Array.isArray(response.body.saves)).toBe(true);
    });
  });

  describe('GET /api/sessions', () => {
    it('should return user sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
    });
  });
});