import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameSettings } from '../types';

const initialState: GameSettings = {
  imageStyle: 'fantasy_art',
  fontSize: 16,
  autoScroll: true,
  soundEnabled: true,
  animationsEnabled: true,
  contentRating: 'R',
  safetyFilter: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSetting: (state, action: PayloadAction<Partial<GameSettings>>) => {
      return { ...state, ...action.payload };
    },
    
    resetSettings: () => initialState,
  },
});

export const { updateSetting, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;