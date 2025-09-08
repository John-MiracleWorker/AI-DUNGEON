import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
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
    }
  }),
}));

describe('PromptAdventureScreen', () => {
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
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <PromptAdventureScreen />
      </Provider>
    );

    expect(getByText('Adventure Prompt')).toBeTruthy();
    expect(getByPlaceholderText('Describe your adventure...')).toBeTruthy();
    expect(getByText('Start Adventure')).toBeTruthy();
  });

  it('should show alert when prompt is empty', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <PromptAdventureScreen />
      </Provider>
    );

    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    // Wait for alert to appear
    await waitFor(() => {
      expect(getByText('Prompt Required')).toBeTruthy();
    });
  });

  it('should show loading state when creating adventure', async () => {
    // Mock the API to simulate loading
    const mockMutation = jest.fn();
    jest.spyOn(gameApi, 'endpoints').mockReturnValue({
      createPromptGame: {
        useMutation: () => [mockMutation, { isLoading: true }]
      }
    } as any);

    const { getByText } = render(
      <Provider store={store}>
        <PromptAdventureScreen />
      </Provider>
    );

    const promptInput = getByText('Describe your adventure...');
    fireEvent.changeText(promptInput, 'Create a fantasy adventure');

    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    // Wait for loading state to appear
    await waitFor(() => {
      expect(getByText('Creating...')).toBeTruthy();
    });
  });
});