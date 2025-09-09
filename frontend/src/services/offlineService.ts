import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { store } from '../store';
import {
  setOnlineStatus,
  queueAction,
  syncSuccess,
  syncFailure,
  cacheGame,
  clearOldCachedGames
} from '../store/offlineSlice';
import { PendingAction, CachedGame } from '../store/offlineSlice';
import { GameSession } from '../types';
import { gameApi } from './gameApi';

class OfflineService {
  private isInitialized = false;
  private netInfoUnsubscribe: (() => void) | null = null;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  async initialize() {
    if (this.isInitialized) return;

    // Load cached data from AsyncStorage
    await this.loadCachedData();
    
    // Set up network monitoring
    this.setupNetworkMonitoring();

    // Set up periodic cleanup
    this.setupPeriodicCleanup();
    
    this.isInitialized = true;
  }

  private async loadCachedData() {
    try {
      // Load queued actions
      const queuedActionsData = await AsyncStorage.getItem('@ai_dungeon:queued_actions');
      if (queuedActionsData) {
        const actions: PendingAction[] = JSON.parse(queuedActionsData);
        // Re-queue actions that are not too old (max 7 days)
        const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
        actions.forEach(action => {
          if (action.timestamp > cutoffTime) {
            store.dispatch(queueAction({
              type: action.type,
              sessionId: action.sessionId,
              data: action.data
            }));
          }
        });
      }

      // Load cached games
      const cachedGamesData = await AsyncStorage.getItem('@ai_dungeon:cached_games');
      if (cachedGamesData) {
        const games: { [key: string]: CachedGame } = JSON.parse(cachedGamesData);
        Object.values(games).forEach(cachedGame => {
          store.dispatch(cacheGame({
            sessionId: cachedGame.sessionId,
            gameData: cachedGame.gameData,
            isSynced: cachedGame.isSynced
          }));
        });
      }
    } catch (error) {
      console.error('Error loading cached offline data:', error);
    }
  }

  private setupNetworkMonitoring() {
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !store.getState().offline.isOnline;
      const isOnline = state.isConnected ?? false;
      
      store.dispatch(setOnlineStatus(isOnline));

      // If coming back online and there are queued actions, sync them
      if (wasOffline && isOnline) {
        this.syncQueuedActions();
      }
    });
  }

  private setupPeriodicCleanup() {
    // Clean up old cached games every hour
    this.cleanupIntervalId = setInterval(() => {
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      store.dispatch(clearOldCachedGames(maxAge));
      this.persistCachedData();
    }, 60 * 60 * 1000); // 1 hour
  }

  dispose() {
    this.netInfoUnsubscribe?.();
    this.netInfoUnsubscribe = null;

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    this.isInitialized = false;
  }

  async queueOfflineAction(
    type: PendingAction['type'],
    sessionId: string,
    data: any
  ) {
    store.dispatch(queueAction({
      type,
      sessionId,
      data
    }));
    
    await this.persistQueuedActions();
  }

  async cacheGameData(sessionId: string, gameData: GameSession, isSynced = true) {
    store.dispatch(cacheGame({
      sessionId,
      gameData,
      isSynced
    }));
    
    await this.persistCachedData();
  }

  private async syncQueuedActions() {
    const state = store.getState().offline;
    
    if (state.queuedActions.length === 0 || !state.isOnline) {
      return;
    }

    try {
      const result = await store
        .dispatch(
          gameApi.endpoints.syncOfflineActions.initiate(state.queuedActions)
        )
        .unwrap();

      if (result.processed?.length) {
        store.dispatch(
          syncSuccess({ processedActionIds: result.processed })
        );
      }

      if (result.failed?.length) {
        store.dispatch(
          syncFailure({
            failedActionIds: result.failed,
            error: result.message || 'Sync failed'
          })
        );
      }

      await this.persistQueuedActions();
    } catch (error) {
      console.error('Sync failed:', error);
      const failedIds = state.queuedActions.map(action => action.id);
      store.dispatch(
        syncFailure({
          failedActionIds: failedIds,
          error: 'Sync failed'
        })
      );
    }
  }

  private async persistQueuedActions() {
    try {
      const queuedActions = store.getState().offline.queuedActions;
      await AsyncStorage.setItem(
        '@ai_dungeon:queued_actions', 
        JSON.stringify(queuedActions)
      );
    } catch (error) {
      console.error('Error persisting queued actions:', error);
    }
  }

  private async persistCachedData() {
    try {
      const cachedGames = store.getState().offline.cachedGames;
      await AsyncStorage.setItem(
        '@ai_dungeon:cached_games', 
        JSON.stringify(cachedGames)
      );
    } catch (error) {
      console.error('Error persisting cached games:', error);
    }
  }

  getCachedGame(sessionId: string): GameSession | null {
    const cachedGame = store.getState().offline.cachedGames[sessionId];
    return cachedGame?.gameData || null;
  }

  isGameCached(sessionId: string): boolean {
    return !!store.getState().offline.cachedGames[sessionId];
  }

  getQueuedActionsCount(): number {
    return store.getState().offline.queuedActions.length;
  }

  isOnline(): boolean {
    return store.getState().offline.isOnline;
  }

  // Simulate offline turn processing
  async processOfflineTurn(sessionId: string, playerInput: string): Promise<any> {
    // This would generate a basic response that gets queued for sync
    const basicResponse = {
      turn_id: `offline_${Date.now()}`,
      narration: "Your action has been recorded. You'll see the full response when you're back online.",
      image_url: null,
      quick_actions: ['Continue exploring', 'Wait', 'Look around'],
      world_state_changes: {
        location: null,
        inventory_changes: { added: [], removed: [] }
      }
    };

    // Queue the real action for later sync
    await this.queueOfflineAction('SUBMIT_TURN', sessionId, {
      player_input: playerInput,
      context: { offline_mode: true }
    });

    return basicResponse;
  }
}

// Singleton instance
export const offlineService = new OfflineService();
