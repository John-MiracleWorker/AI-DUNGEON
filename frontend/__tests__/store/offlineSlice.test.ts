import { configureStore } from '@reduxjs/toolkit';
import offlineReducer, {
  setOnlineStatus,
  queueAction,
  removeQueuedAction,
  cacheGame,
  syncSuccess,
  syncFailure,
  clearAllQueued,
} from '../../../src/store/offlineSlice';

const mockGameSession = {
  session_id: 'test-session',
  world_state: {
    location: 'Test Location',
    inventory: [],
    character_stats: {},
  },
  turn_history: [],
  quick_actions: [],
};

describe('offlineSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        offline: offlineReducer,
      },
    });
  });

  it('should handle initial state', () => {
    const state = store.getState().offline;
    
    expect(state.isOnline).toBe(true);
    expect(state.queuedActions).toEqual([]);
    expect(state.cachedGames).toEqual({});
    expect(state.syncStatus.status).toBe('idle');
    expect(state.syncStatus.pendingCount).toBe(0);
    expect(state.syncStatus.failedCount).toBe(0);
  });

  it('should set online status', () => {
    store.dispatch(setOnlineStatus(false));
    
    let state = store.getState().offline;
    expect(state.isOnline).toBe(false);
    
    store.dispatch(setOnlineStatus(true));
    
    state = store.getState().offline;
    expect(state.isOnline).toBe(true);
  });

  it('should queue action when offline', () => {
    store.dispatch(queueAction({
      type: 'SUBMIT_TURN',
      sessionId: 'test-session',
      data: { player_input: 'test input' },
    }));
    
    const state = store.getState().offline;
    expect(state.queuedActions).toHaveLength(1);
    expect(state.queuedActions[0].type).toBe('SUBMIT_TURN');
    expect(state.queuedActions[0].sessionId).toBe('test-session');
    expect(state.syncStatus.pendingCount).toBe(1);
  });

  it('should remove queued action', () => {
    // Add action first
    store.dispatch(queueAction({
      type: 'SUBMIT_TURN',
      sessionId: 'test-session',
      data: { player_input: 'test input' },
    }));
    
    const actionId = store.getState().offline.queuedActions[0].id;
    
    // Remove it
    store.dispatch(removeQueuedAction(actionId));
    
    const state = store.getState().offline;
    expect(state.queuedActions).toHaveLength(0);
    expect(state.syncStatus.pendingCount).toBe(0);
  });

  it('should cache game data', () => {
    store.dispatch(cacheGame({
      sessionId: 'test-session',
      gameData: mockGameSession,
      isSynced: true,
    }));
    
    const state = store.getState().offline;
    expect(state.cachedGames['test-session']).toBeDefined();
    expect(state.cachedGames['test-session'].gameData).toEqual(mockGameSession);
    expect(state.cachedGames['test-session'].isSynced).toBe(true);
  });

  it('should handle successful sync', () => {
    // Add some actions first
    store.dispatch(queueAction({
      type: 'SUBMIT_TURN',
      sessionId: 'test-session-1',
      data: { player_input: 'input 1' },
    }));
    
    store.dispatch(queueAction({
      type: 'SUBMIT_TURN',
      sessionId: 'test-session-2',
      data: { player_input: 'input 2' },
    }));
    
    const actionIds = store.getState().offline.queuedActions.map(a => a.id);
    
    // Sync first action
    store.dispatch(syncSuccess({ processedActionIds: [actionIds[0]] }));
    
    const state = store.getState().offline;
    expect(state.queuedActions).toHaveLength(1);
    expect(state.queuedActions[0].id).toBe(actionIds[1]);
    expect(state.syncStatus.status).toBe('syncing'); // Still has pending actions
    expect(state.syncStatus.pendingCount).toBe(1);
  });

  it('should handle sync failure', () => {
    // Add action first
    store.dispatch(queueAction({
      type: 'SUBMIT_TURN',
      sessionId: 'test-session',
      data: { player_input: 'test input' },
    }));
    
    const actionId = store.getState().offline.queuedActions[0].id;
    
    store.dispatch(syncFailure({
      failedActionIds: [actionId],
      error: 'Network error',
    }));
    
    const state = store.getState().offline;
    expect(state.syncStatus.status).toBe('error');
    expect(state.syncStatus.failedCount).toBe(1);
  });

  it('should clear all queued actions', () => {
    // Add multiple actions
    store.dispatch(queueAction({
      type: 'SUBMIT_TURN',
      sessionId: 'test-session-1',
      data: { player_input: 'input 1' },
    }));
    
    store.dispatch(queueAction({
      type: 'SAVE_GAME',
      sessionId: 'test-session-2',
      data: { save_name: 'test save' },
    }));
    
    // Clear all
    store.dispatch(clearAllQueued());
    
    const state = store.getState().offline;
    expect(state.queuedActions).toEqual([]);
    expect(state.syncStatus.pendingCount).toBe(0);
    expect(state.syncStatus.status).toBe('idle');
  });

  it('should trigger sync when coming back online with queued actions', () => {
    // Go offline and queue an action
    store.dispatch(setOnlineStatus(false));
    store.dispatch(queueAction({
      type: 'SUBMIT_TURN',
      sessionId: 'test-session',
      data: { player_input: 'test input' },
    }));
    
    // Come back online
    store.dispatch(setOnlineStatus(true));
    
    const state = store.getState().offline;
    expect(state.isOnline).toBe(true);
    expect(state.syncStatus.status).toBe('syncing');
  });
});