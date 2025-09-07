import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { GameSession, SavedGame } from '../models';

describe('Database Models', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    if (mongoServer) {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  });

  afterEach(async () => {
    await GameSession.deleteMany({});
    await SavedGame.deleteMany({});
  });

  describe('GameSession Model', () => {
    it('should create a valid game session', async () => {
      const sessionData = {
        session_id: 'test_session_123',
        user_id: 'test_user_456',
        world_state: {
          location: 'Test Location',
          inventory: ['sword', 'potion'],
          npcs: [],
          flags: { started: true },
          current_chapter: 'Prologue'
        },
        turn_history: [],
        metadata: {
          genre: 'fantasy',
          image_style: 'fantasy_art',
          created_at: new Date(),
          last_played: new Date(),
          total_turns: 0
        },
        settings: {
          difficulty: 'normal',
          safety_filter: true
        }
      };

      const session = new GameSession(sessionData);
      const savedSession = await session.save();

      expect(savedSession._id).toBeDefined();
      expect(savedSession.session_id).toBe('test_session_123');
      expect(savedSession.world_state.location).toBe('Test Location');
      expect(savedSession.world_state.inventory).toContain('sword');
    });

    it('should enforce required fields', async () => {
      const invalidSession = new GameSession({});
      
      await expect(invalidSession.save()).rejects.toThrow();
    });

    it('should update last_played on save', async () => {
      const session = new GameSession({
        session_id: 'test_session_789',
        user_id: 'test_user_456',
        world_state: {
          location: 'Test Location',
          inventory: [],
          npcs: [],
          flags: {},
          current_chapter: 'Prologue'
        },
        turn_history: [],
        metadata: {
          genre: 'fantasy',
          image_style: 'fantasy_art',
          created_at: new Date(),
          last_played: new Date('2023-01-01'),
          total_turns: 0
        },
        settings: {
          difficulty: 'normal',
          safety_filter: true
        }
      });

      const beforeSave = session.metadata.last_played;
      await session.save();
      
      expect(session.metadata.last_played.getTime()).toBeGreaterThan(beforeSave.getTime());
    });

    it('should find session by session_id', async () => {
      const sessionData = {
        session_id: 'findable_session',
        user_id: 'test_user',
        world_state: {
          location: 'Test Location',
          inventory: [],
          npcs: [],
          flags: {},
          current_chapter: 'Prologue'
        },
        turn_history: [],
        metadata: {
          genre: 'fantasy',
          image_style: 'fantasy_art',
          created_at: new Date(),
          last_played: new Date(),
          total_turns: 0
        },
        settings: {
          difficulty: 'normal',
          safety_filter: true
        }
      };

      await new GameSession(sessionData).save();
      
      const foundSession = await GameSession.findOne({ session_id: 'findable_session' });
      expect(foundSession).toBeTruthy();
      expect(foundSession?.session_id).toBe('findable_session');
    });
  });

  describe('SavedGame Model', () => {
    it('should create a valid saved game', async () => {
      const saveData = {
        save_id: 'save_123',
        save_name: 'My Test Save',
        session_id: 'session_123',
        user_id: 'user_123',
        created_at: new Date(),
        turn_count: 5,
        preview_image: 'http://example.com/image.jpg',
        session_snapshot: { test: 'data' }
      };

      const savedGame = new SavedGame(saveData);
      const result = await savedGame.save();

      expect(result._id).toBeDefined();
      expect(result.save_id).toBe('save_123');
      expect(result.save_name).toBe('My Test Save');
      expect(result.turn_count).toBe(5);
    });

    it('should enforce unique save names per user', async () => {
      const saveData1 = {
        save_id: 'save_1',
        save_name: 'Duplicate Name',
        session_id: 'session_1',
        user_id: 'user_1',
        turn_count: 1,
        session_snapshot: {}
      };

      const saveData2 = {
        save_id: 'save_2',
        save_name: 'Duplicate Name',
        session_id: 'session_2',
        user_id: 'user_1', // Same user
        turn_count: 2,
        session_snapshot: {}
      };

      await new SavedGame(saveData1).save();
      
      await expect(new SavedGame(saveData2).save()).rejects.toThrow();
    });

    it('should allow same save name for different users', async () => {
      const saveData1 = {
        save_id: 'save_1',
        save_name: 'Same Name',
        session_id: 'session_1',
        user_id: 'user_1',
        turn_count: 1,
        session_snapshot: {}
      };

      const saveData2 = {
        save_id: 'save_2',
        save_name: 'Same Name',
        session_id: 'session_2',
        user_id: 'user_2', // Different user
        turn_count: 2,
        session_snapshot: {}
      };

      const result1 = await new SavedGame(saveData1).save();
      const result2 = await new SavedGame(saveData2).save();

      expect(result1.save_name).toBe('Same Name');
      expect(result2.save_name).toBe('Same Name');
    });
  });
});