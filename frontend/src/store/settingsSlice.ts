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
  // Audio settings
  isAudioEnabled: false,
  selectedVoice: 'fable',
  playbackSpeed: 1.0,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSetting: (state, action: PayloadAction<Partial<GameSettings>>) => {
      return { ...state, ...action.payload };
    },
    
    // Add specific action for audio settings
    updateAudioSettings: (state, action: PayloadAction<Partial<GameSettings>>) => {
      return { ...state, ...action.payload };
    },
    
    resetSettings: () => initialState,
  },
});

export const { updateSetting, updateAudioSettings, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;