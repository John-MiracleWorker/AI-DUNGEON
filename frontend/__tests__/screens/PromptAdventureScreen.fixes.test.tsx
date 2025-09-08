import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import { gameApi } from '../../src/services/gameApi';
import { PromptAdventureScreen } from '../../src/screens/PromptAdventureScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

// Mock hooks
jest.mock('../../src/utils/hooks', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => selector({
    settings: {
      safetyFilter: false,
      contentRating: 'PG-13'
    },
    auth: {
      isAuthenticated: true
    }
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('PromptAdventureScreen - Fixes Verification', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [gameApi.reducerPath]: gameApi.reducer,
        settings: () => ({
          safetyFilter: false,
          contentRating: 'PG-13'
        }),
        auth: () => ({
          isAuthenticated: true
        })
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(gameApi.middleware),
    });
    
    mockNavigate.mockClear();
    (Alert.alert as jest.Mock).mockClear();
  });

  it('should navigate directly to Game screen after successful creation', async () => {
    // Mock successful API response
    const mockResult = {
      session_id: 'test-session-id',
      world_state: { location: 'Test Location', inventory: [], npcs: [], flags: {}, current_chapter: 'Prologue' },
      prologue: {
        narration: 'Test prologue',
        image_url: 'test-image-url',
        quick_actions: []
      }
    };

    const mockMutation = jest.fn().mockResolvedValue({ data: mockResult });
    jest.spyOn(gameApi, 'endpoints').mockReturnValue({
      createPromptGame: {
        useMutation: () => [mockMutation, { isLoading: false }]
      }
    } as any);

    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <PromptAdventureScreen />
      </Provider>
    );

    // Enter a prompt
    const promptInput = getByPlaceholderText('Describe your adventure...');
    fireEvent.changeText(promptInput, 'Create a fantasy adventure');

    // Press start button
    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Game', { sessionId: 'test-session-id' });
    });
  });

  it('should show specific error message for 400 status code', async () => {
    // Mock API error response
    const mockError = {
      status: 400,
      data: {
        message: 'Invalid request data provided'
      }
    };

    const mockMutation = jest.fn().mockRejectedValue(mockError);
    jest.spyOn(gameApi, 'endpoints').mockReturnValue({
      createPromptGame: {
        useMutation: () => [mockMutation, { isLoading: false }]
      }
    } as any);

    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <PromptAdventureScreen />
      </Provider>
    );

    // Enter a prompt
    const promptInput = getByPlaceholderText('Describe your adventure...');
    fireEvent.changeText(promptInput, 'Create a fantasy adventure');

    // Press start button
    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    // Wait for error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid request: Invalid request data provided');
    });
  });

  it('should show specific error message for 500 status code', async () => {
    // Mock API error response
    const mockError = {
      status: 500,
      data: {
        message: 'Internal server error'
      }
    };

    const mockMutation = jest.fn().mockRejectedValue(mockError);
    jest.spyOn(gameApi, 'endpoints').mockReturnValue({
      createPromptGame: {
        useMutation: () => [mockMutation, { isLoading: false }]
      }
    } as any);

    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <PromptAdventureScreen />
      </Provider>
    );

    // Enter a prompt
    const promptInput = getByPlaceholderText('Describe your adventure...');
    fireEvent.changeText(promptInput, 'Create a fantasy adventure');

    // Press start button
    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    // Wait for error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Server error. Please try again later.');
    });
  });

  it('should show fallback error message for unknown errors', async () => {
    // Mock unknown API error
    const mockError = {
      status: 999, // Unknown status code
      data: {}
    };

    const mockMutation = jest.fn().mockRejectedValue(mockError);
    jest.spyOn(gameApi, 'endpoints').mockReturnValue({
      createPromptGame: {
        useMutation: () => [mockMutation, { isLoading: false }]
      }
    } as any);

    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <PromptAdventureScreen />
      </Provider>
    );

    // Enter a prompt
    const promptInput = getByPlaceholderText('Describe your adventure...');
    fireEvent.changeText(promptInput, 'Create a fantasy adventure');

    // Press start button
    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    // Wait for error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create adventure. Please try again.');
    });
  });
});