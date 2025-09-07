import request from 'supertest';
import app from '../server';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { connectRedis, disconnectRedis } from '../config/redis';

describe('API Health and Auth Endpoints', () => {
  beforeAll(async () => {
    // Skip database connections for health endpoint tests
  });

  afterAll(async () => {
    // Clean up if needed
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('POST /api/auth/anonymous', () => {
    it('should create anonymous session', async () => {
      const response = await request(app)
        .post('/api/auth/anonymous')
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('isAnonymous', true);
      expect(typeof response.body.token).toBe('string');
    });

    it('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/anonymous')
        .expect(201);

      const token = response.body.token;
      expect(token).toMatch(/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/); // JWT format
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('status', 404);
    });
  });
});