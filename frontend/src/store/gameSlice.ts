import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameState, Turn, WorldState } from '../types';

const initialState: GameState = {
  currentSession: null,
  savedGames: [],
  recentSessions: [],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<{
      session_id: string;
      world_state: WorldState;
      turn_history: Turn[];
      quick_actions: string[];
    }>) => {
      state.currentSession = action.payload;
    },
    
    addTurn: (state, action: PayloadAction<Turn>) => {
      if (state.currentSession) {
        state.currentSession.turn_history.push(action.payload);
      }
    },
    
    updateWorldState: (state, action: PayloadAction<Partial<WorldState>>) => {
      if (state.currentSession) {
        state.currentSession.world_state = {
          ...state.currentSession.world_state,
          ...action.payload,
        };
      }
    },
    
    updateQuickActions: (state, action: PayloadAction<string[]>) => {
      if (state.currentSession) {
        state.currentSession.quick_actions = action.payload;
      }
    },
    
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
    
    setSavedGames: (state, action: PayloadAction<any[]>) => {
      state.savedGames = action.payload;
    },
    
    setRecentSessions: (state, action: PayloadAction<any[]>) => {
      state.recentSessions = action.payload;
    },
  },
});

export const {
  setCurrentSession,
  addTurn,
  updateWorldState,
  updateQuickActions,
  clearCurrentSession,
  setSavedGames,
  setRecentSessions,
} = gameSlice.actions;

export default gameSlice.reducer;