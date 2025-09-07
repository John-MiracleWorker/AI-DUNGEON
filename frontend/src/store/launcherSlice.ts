import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameSession } from '../types';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: 'continue' | 'new-game' | 'load-game' | 'quick-start';
  data?: any;
}

export interface LauncherState {
  recentGames: GameSession[];
  favoriteGenres: string[];
  quickStartEnabled: boolean;
  lastPlayedSession: GameSession | null;
  quickActions: QuickAction[];
  isFirstLaunch: boolean;
  onboardingCompleted: boolean;
}

const defaultQuickActions: QuickAction[] = [
  {
    id: 'quick-start',
    label: 'Quick Adventure',
    icon: 'flash',
    action: 'quick-start'
  },
  {
    id: 'new-game',
    label: 'New Game',
    icon: 'add',
    action: 'new-game'
  },
  {
    id: 'continue-last',
    label: 'Continue',
    icon: 'play',
    action: 'continue'
  }
];

const initialState: LauncherState = {
  recentGames: [],
  favoriteGenres: ['fantasy'],
  quickStartEnabled: true,
  lastPlayedSession: null,
  quickActions: defaultQuickActions,
  isFirstLaunch: true,
  onboardingCompleted: false,
};

const launcherSlice = createSlice({
  name: 'launcher',
  initialState,
  reducers: {
    addToRecentGames: (state, action: PayloadAction<GameSession>) => {
      const game = action.payload;
      // Remove existing entry if it exists
      state.recentGames = state.recentGames.filter(g => g.session_id !== game.session_id);
      // Add to beginning of array
      state.recentGames.unshift(game);
      // Keep only 5 most recent
      state.recentGames = state.recentGames.slice(0, 5);
    },

    setLastPlayed: (state, action: PayloadAction<GameSession | null>) => {
      state.lastPlayedSession = action.payload;
      
      // Update continue action availability
      const continueAction = state.quickActions.find(action => action.action === 'continue');
      if (continueAction) {
        continueAction.data = action.payload;
      }
    },

    updateFavoriteGenres: (state, action: PayloadAction<string[]>) => {
      state.favoriteGenres = action.payload;
    },

    setQuickStartEnabled: (state, action: PayloadAction<boolean>) => {
      state.quickStartEnabled = action.payload;
    },

    setFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.isFirstLaunch = action.payload;
    },

    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload;
    },

    updateQuickActions: (state, action: PayloadAction<QuickAction[]>) => {
      state.quickActions = action.payload;
    },

    addFavoriteGenre: (state, action: PayloadAction<string>) => {
      const genre = action.payload;
      if (!state.favoriteGenres.includes(genre)) {
        state.favoriteGenres.push(genre);
      }
    },

    removeFavoriteGenre: (state, action: PayloadAction<string>) => {
      const genre = action.payload;
      state.favoriteGenres = state.favoriteGenres.filter(g => g !== genre);
    },

    clearRecentGames: (state) => {
      state.recentGames = [];
    },

    removeFromRecentGames: (state, action: PayloadAction<string>) => {
      const sessionId = action.payload;
      state.recentGames = state.recentGames.filter(g => g.session_id !== sessionId);
    },
  },
});

export const {
  addToRecentGames,
  setLastPlayed,
  updateFavoriteGenres,
  setQuickStartEnabled,
  setFirstLaunch,
  setOnboardingCompleted,
  updateQuickActions,
  addFavoriteGenre,
  removeFavoriteGenre,
  clearRecentGames,
  removeFromRecentGames,
} = launcherSlice.actions;

export default launcherSlice.reducer;