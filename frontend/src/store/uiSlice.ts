import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameUIState } from '../types';

const initialState: GameUIState = {
  isLoading: false,
  error: null,
  imageLoadingStates: {},
  inputText: '',
  isTyping: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setImageLoading: (state, action: PayloadAction<{ id: string; loading: boolean }>) => {
      state.imageLoadingStates[action.payload.id] = action.payload.loading;
    },
    
    setInputText: (state, action: PayloadAction<string>) => {
      state.inputText = action.payload;
    },
    
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setImageLoading,
  setInputText,
  setTyping,
  clearError,
} = uiSlice.actions;

export default uiSlice.reducer;