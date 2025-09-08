import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import { gameApi } from '../../src/services/gameApi';
import { NewGameScreen } from '../../src/screens/NewGameScreen';

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
    }
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('NewGameScreen - Fixes Verification', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [gameApi.reducerPath]: gameApi.reducer,
        settings: () => ({
          safetyFilter: false,
          contentRating: 'PG-13'
        })
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(gameApi.middleware),
    });
    
    mockNavigate.mockClear();
    (Alert.alert as jest.Mock).mockClear();
  });

  it('should navigate to CustomAdventure screen when custom game type is selected', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <NewGameScreen />
      </Provider>
    );

    // Select custom adventure type
    const customAdventureButton = getByText('Custom Adventure');
    fireEvent.press(customAdventureButton);

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('CustomAdventure');
    });
  });

  it('should navigate to PromptAdventure screen when prompt game type is selected', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <NewGameScreen />
      </Provider>
    );

    // Select prompt adventure type
    const promptAdventureButton = getByText('Prompt Adventure');
    fireEvent.press(promptAdventureButton);

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('PromptAdventure');
    });
  });

  it('should show specific error message for 401 status code', async () => {
    // Mock API error response
    const mockError = {
      status: 401,
      data: {
        message: 'Authentication required'
      }
    };

    const mockMutation = jest.fn().mockRejectedValue(mockError);
    jest.spyOn(gameApi, 'endpoints').mockReturnValue({
      startNewGame: {
        useMutation: () => [mockMutation, { isLoading: false }]
      }
    } as any);

    const { getByText } = render(
      <Provider store={store}>
        <NewGameScreen />
      </Provider>
    );

    // Press start button (preset game by default)
    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    // Wait for error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Authentication required');
    });
  });

  it('should show specific error message for 429 status code', async () => {
    // Mock API error response
    const mockError = {
      status: 429,
      data: {
        message: 'Rate limit exceeded'
      }
    };

    const mockMutation = jest.fn().mockRejectedValue(mockError);
    jest.spyOn(gameApi, 'endpoints').mockReturnValue({
      startNewGame: {
        useMutation: () => [mockMutation, { isLoading: false }]
      }
    } as any);

    const { getByText } = render(
      <Provider store={store}>
        <NewGameScreen />
      </Provider>
    );

    // Press start button (preset game by default)
    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    // Wait for error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Rate limit exceeded. Please wait before trying again.');
    });
  });
});