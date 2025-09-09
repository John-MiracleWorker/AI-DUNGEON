import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { gameApi } from '../../src/services/gameApi';
import { PromptAdventureScreen } from '../../src/screens/PromptAdventureScreen';
import { Alert } from 'react-native';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

// Mock hooks with adjustable state
let mockState = {
  settings: {
    safetyFilter: false,
    contentRating: 'PG-13'
  },
  auth: {
    isAuthenticated: true
  }
};

jest.mock('../../src/utils/hooks', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => selector(mockState),
}));

jest.spyOn(Alert, 'alert');

describe('PromptAdventureScreen', () => {
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
          isAuthenticated: mockState.auth.isAuthenticated
        })
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(gameApi.middleware),
    });

    mockNavigate.mockClear();
    (Alert.alert as jest.Mock).mockClear();
    mockState.auth.isAuthenticated = true;
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
    const endpointsSpy = jest.spyOn(gameApi, 'endpoints');
    endpointsSpy.mockReturnValue({
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

    endpointsSpy.mockRestore();
  });
  it('should create anonymous session and start adventure when not logged in', async () => {
    mockState.auth.isAuthenticated = false;

    const mockAnon = jest.fn().mockResolvedValue({
      data: { token: 'anon-token', user: { id: 'anon' } },
    });
    const mockPrompt = jest.fn().mockResolvedValue({
      data: {
        session_id: 'test-session-id',
        world_state: {},
        prologue: { narration: 'Test', image_url: '', quick_actions: [] },
      },
    });

    const endpointsSpy = jest.spyOn(gameApi, 'endpoints');
    endpointsSpy.mockReturnValue({
      createPromptGame: {
        useMutation: () => [mockPrompt, { isLoading: false }],
      },
      createAnonymousSession: {
        useMutation: () => [mockAnon, { isLoading: false }],
      },
    } as any);

    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <PromptAdventureScreen />
      </Provider>
    );

    const promptInput = getByPlaceholderText('Describe your adventure...');
    fireEvent.changeText(promptInput, 'Create a fantasy adventure');

    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(mockAnon).toHaveBeenCalled();
      expect(mockPrompt).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('Game', {
        sessionId: 'test-session-id',
      });
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    endpointsSpy.mockRestore();
  });

  it('should show authentication alert if anonymous session creation fails', async () => {
    mockState.auth.isAuthenticated = false;

    const mockAnon = jest.fn().mockRejectedValue(new Error('fail'));
    const mockPrompt = jest.fn();

    const endpointsSpy = jest.spyOn(gameApi, 'endpoints');
    endpointsSpy.mockReturnValue({
      createPromptGame: {
        useMutation: () => [mockPrompt, { isLoading: false }],
      },
      createAnonymousSession: {
        useMutation: () => [mockAnon, { isLoading: false }],
      },
    } as any);

    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <PromptAdventureScreen />
      </Provider>
    );

    const promptInput = getByPlaceholderText('Describe your adventure...');
    fireEvent.changeText(promptInput, 'Create a fantasy adventure');

    const startButton = getByText('Start Adventure');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Authentication Required',
        'You must be logged in to create an adventure. Please log in and try again.'
      );
      expect(mockPrompt).not.toHaveBeenCalled();
    });

    endpointsSpy.mockRestore();
  });
});