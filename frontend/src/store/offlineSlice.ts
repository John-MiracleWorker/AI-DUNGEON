import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameSession, GameTurn } from '../types';

export interface PendingAction {
  id: string;
  type: 'SUBMIT_TURN' | 'SAVE_GAME' | 'START_GAME' | 'LOAD_GAME';
  sessionId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  lastAttempt?: number;
}

export interface CachedGame {
  sessionId: string;
  gameData: GameSession;
  lastUpdated: number;
  isSynced: boolean;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync?: number;
  pendingCount: number;
  failedCount: number;
}

export interface OfflineState {
  isOnline: boolean;
  queuedActions: PendingAction[];
  cachedGames: { [sessionId: string]: CachedGame };
  syncStatus: SyncStatus;
  offlineMode: boolean;
  lastNetworkCheck: number;
}

const initialState: OfflineState = {
  isOnline: true,
  queuedActions: [],
  cachedGames: {},
  syncStatus: {
    status: 'idle',
    pendingCount: 0,
    failedCount: 0,
  },
  offlineMode: false,
  lastNetworkCheck: Date.now(),
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      const wasOffline = !state.isOnline;
      state.isOnline = action.payload;
      state.lastNetworkCheck = Date.now();
      
      // If coming back online, trigger sync
      if (wasOffline && action.payload && state.queuedActions.length > 0) {
        state.syncStatus.status = 'syncing';
      }
    },

    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },

    queueAction: (state, action: PayloadAction<Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>>) => {
      const newAction: PendingAction = {
        ...action.payload,
        id: `action_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      state.queuedActions.push(newAction);
      state.syncStatus.pendingCount = state.queuedActions.length;
    },

    removeQueuedAction: (state, action: PayloadAction<string>) => {
      const actionId = action.payload;
      state.queuedActions = state.queuedActions.filter(a => a.id !== actionId);
      state.syncStatus.pendingCount = state.queuedActions.length;
    },

    updateActionRetryCount: (state, action: PayloadAction<{ actionId: string; retryCount: number }>) => {
      const { actionId, retryCount } = action.payload;
      const actionIndex = state.queuedActions.findIndex(a => a.id === actionId);
      
      if (actionIndex !== -1) {
        state.queuedActions[actionIndex].retryCount = retryCount;
        state.queuedActions[actionIndex].lastAttempt = Date.now();
      }
    },

    cacheGame: (state, action: PayloadAction<{ sessionId: string; gameData: GameSession; isSynced?: boolean }>) => {
      const { sessionId, gameData, isSynced = true } = action.payload;
      
      state.cachedGames[sessionId] = {
        sessionId,
        gameData,
        lastUpdated: Date.now(),
        isSynced,
      };
    },

    updateCachedGame: (state, action: PayloadAction<{ sessionId: string; updates: Partial<GameSession> }>) => {
      const { sessionId, updates } = action.payload;
      
      if (state.cachedGames[sessionId]) {
        state.cachedGames[sessionId].gameData = {
          ...state.cachedGames[sessionId].gameData,
          ...updates,
        };
        state.cachedGames[sessionId].lastUpdated = Date.now();
        state.cachedGames[sessionId].isSynced = false;
      }
    },

    markGameSynced: (state, action: PayloadAction<string>) => {
      const sessionId = action.payload;
      if (state.cachedGames[sessionId]) {
        state.cachedGames[sessionId].isSynced = true;
      }
    },

    removeCachedGame: (state, action: PayloadAction<string>) => {
      const sessionId = action.payload;
      delete state.cachedGames[sessionId];
    },

    setSyncStatus: (state, action: PayloadAction<Partial<SyncStatus>>) => {
      state.syncStatus = {
        ...state.syncStatus,
        ...action.payload,
      };
    },

    syncSuccess: (state, action: PayloadAction<{ processedActionIds: string[] }>) => {
      const { processedActionIds } = action.payload;
      
      // Remove successfully synced actions
      state.queuedActions = state.queuedActions.filter(
        action => !processedActionIds.includes(action.id)
      );
      
      state.syncStatus = {
        status: state.queuedActions.length > 0 ? 'syncing' : 'success',
        lastSync: Date.now(),
        pendingCount: state.queuedActions.length,
        failedCount: 0,
      };
    },

    syncFailure: (state, action: PayloadAction<{ failedActionIds: string[]; error: string }>) => {
      const { failedActionIds } = action.payload;
      
      state.syncStatus = {
        ...state.syncStatus,
        status: 'error',
        failedCount: failedActionIds.length,
      };
    },

    clearFailedActions: (state) => {
      // Remove actions that have failed too many times (max 3 retries)
      state.queuedActions = state.queuedActions.filter(action => action.retryCount < 3);
      state.syncStatus.pendingCount = state.queuedActions.length;
      state.syncStatus.failedCount = 0;
    },

    clearAllQueued: (state) => {
      state.queuedActions = [];
      state.syncStatus = {
        status: 'idle',
        pendingCount: 0,
        failedCount: 0,
      };
    },

    clearOldCachedGames: (state, action: PayloadAction<number>) => {
      const maxAge = action.payload; // Age in milliseconds
      const cutoffTime = Date.now() - maxAge;
      
      Object.keys(state.cachedGames).forEach(sessionId => {
        const cachedGame = state.cachedGames[sessionId];
        if (cachedGame.lastUpdated < cutoffTime && cachedGame.isSynced) {
          delete state.cachedGames[sessionId];
        }
      });
    },
  },
});

export const {
  setOnlineStatus,
  setOfflineMode,
  queueAction,
  removeQueuedAction,
  updateActionRetryCount,
  cacheGame,
  updateCachedGame,
  markGameSynced,
  removeCachedGame,
  setSyncStatus,
  syncSuccess,
  syncFailure,
  clearFailedActions,
  clearAllQueued,
  clearOldCachedGames,
} = offlineSlice.actions;

export default offlineSlice.reducer;