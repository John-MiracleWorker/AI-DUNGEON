import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { gameApi } from '../services/gameApi';
import authReducer from './authSlice';
import gameReducer from './gameSlice';
import uiReducer from './uiSlice';
import settingsReducer from './settingsSlice';
import launcherReducer from './launcherSlice';
import offlineReducer from './offlineSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    ui: uiReducer,
    settings: settingsReducer,
    launcher: launcherReducer,
    offline: offlineReducer,
    [gameApi.reducerPath]: gameApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [gameApi.util.resetApiState.type],
      },
    }).concat(gameApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;