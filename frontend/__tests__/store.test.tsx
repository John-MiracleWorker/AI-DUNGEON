import { configureStore } from '@reduxjs/toolkit';
import { gameApi } from '../../src/services/gameApi';
import gameReducer, { 
  setCurrentSession, 
  addTurn, 
  updateWorldState,
  clearCurrentSession 
} from '../../src/store/gameSlice';

// Mock store for testing
const createTestStore = () => {
  return configureStore({
    reducer: {
      game: gameReducer,
      [gameApi.reducerPath]: gameApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(gameApi.middleware),
  });
};

describe('Game Store', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('gameSlice', () => {
    it('should have initial state', () => {
      const state = store.getState().game;
      
      expect(state.currentSession).toBeNull();
      expect(state.savedGames).toEqual([]);
      expect(state.recentSessions).toEqual([]);
    });

    it('should set current session', () => {
      const sessionData = {
        session_id: 'test_session',
        world_state: {
          location: 'Test Location',
          inventory: [],
          npcs: [],
          flags: {},
          current_chapter: 'Chapter 1'
        },
        turn_history: [],
        quick_actions: ['Look around']
      };

      store.dispatch(setCurrentSession(sessionData));
      
      const state = store.getState().game;
      expect(state.currentSession).toEqual(sessionData);
    });

    it('should add turn to current session', () => {
      // First set a session
      const sessionData = {
        session_id: 'test_session',
        world_state: {
          location: 'Test Location',
          inventory: [],
          npcs: [],
          flags: {},
          current_chapter: 'Chapter 1'
        },
        turn_history: [],
        quick_actions: []
      };

      store.dispatch(setCurrentSession(sessionData));

      // Then add a turn
      const newTurn = {
        turn_id: 'turn_1',
        turn_number: 1,
        player_input: 'Look around',
        narration: 'You see a room.',
        image_prompt: 'A room',
        image_url: '',
        quick_actions: [],
        world_state_snapshot: sessionData.world_state,
        timestamp: new Date(),
        processing_metadata: {
          ai_response_time: 1000,
          image_generation_time: 2000,
          tokens_used: 100
        }
      };

      store.dispatch(addTurn(newTurn));
      
      const state = store.getState().game;
      expect(state.currentSession?.turn_history).toHaveLength(1);
      expect(state.currentSession?.turn_history[0]).toEqual(newTurn);
    });

    it('should update world state', () => {
      // Set initial session
      const sessionData = {
        session_id: 'test_session',
        world_state: {
          location: 'Old Location',
          inventory: [],
          npcs: [],
          flags: {},
          current_chapter: 'Chapter 1'
        },
        turn_history: [],
        quick_actions: []
      };

      store.dispatch(setCurrentSession(sessionData));

      // Update world state
      const updates = {
        location: 'New Location',
        inventory: ['sword']
      };

      store.dispatch(updateWorldState(updates));
      
      const state = store.getState().game;
      expect(state.currentSession?.world_state.location).toBe('New Location');
      expect(state.currentSession?.world_state.inventory).toContain('sword');
    });

    it('should clear current session', () => {
      // Set a session first
      const sessionData = {
        session_id: 'test_session',
        world_state: {
          location: 'Test Location',
          inventory: [],
          npcs: [],
          flags: {},
          current_chapter: 'Chapter 1'
        },
        turn_history: [],
        quick_actions: []
      };

      store.dispatch(setCurrentSession(sessionData));
      
      // Verify session is set
      expect(store.getState().game.currentSession).not.toBeNull();
      
      // Clear session
      store.dispatch(clearCurrentSession());
      
      // Verify session is cleared
      const state = store.getState().game;
      expect(state.currentSession).toBeNull();
    });
  });
});