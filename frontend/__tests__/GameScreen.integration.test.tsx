import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: jest.fn(),
  };
});

jest.mock('../src/services/gameApi', () => {
  const actual = jest.requireActual('../src/services/gameApi');
  return {
    ...actual,
    useSubmitTurnMutation: () => [jest.fn(), { isLoading: false }],
    useLoadGameQuery: jest.fn(),
    useSaveGameMutation: () => [jest.fn(), { isLoading: false }],
  };
});

import { useLoadGameQuery, gameApi } from '../src/services/gameApi';
import gameReducer, { setCurrentSession } from '../src/store/gameSlice';
import uiReducer from '../src/store/uiSlice';
import { GameScreen } from '../src/screens/GameScreen';

const createStore = () =>
  configureStore({
    reducer: {
      game: gameReducer,
      ui: uiReducer,
      [gameApi.reducerPath]: gameApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(gameApi.middleware),
  });

const mockUseRoute = require('@react-navigation/native').useRoute as jest.Mock;
const mockUseLoadGameQuery = useLoadGameQuery as jest.Mock;

describe('GameScreen integration', () => {
  beforeEach(() => {
    mockUseRoute.mockReturnValue({ params: {} });
    mockUseLoadGameQuery.mockReset();
  });

  it('uses existing session from store before enabling input (NewGameScreen navigation)', async () => {
    const store = createStore();
    store.dispatch(
      setCurrentSession({
        session_id: 'session-1',
        world_state: { location: 'Start', inventory: [], npcs: [], flags: {}, current_chapter: 'Chapter 1' },
        turn_history: [],
        quick_actions: [],
      })
    );
    mockUseLoadGameQuery.mockReturnValue({ data: null, isLoading: false });

    const { queryByPlaceholderText, getByPlaceholderText } = render(
      <Provider store={store}>
        <GameScreen />
      </Provider>
    );

    expect(queryByPlaceholderText('What do you do?')).toBeNull();

    await waitFor(() => {
      expect(getByPlaceholderText('What do you do?')).toBeTruthy();
    });
  });

  it('loads session before enabling input (GameLibrary navigation)', async () => {
    const store = createStore();
    mockUseRoute.mockReturnValue({ params: { sessionId: 'session-2' } });

    const gameData = {
      session_id: 'session-2',
      world_state: { location: 'Town', inventory: [], npcs: [], flags: {}, current_chapter: 'Chapter 1' },
      turn_history: [],
    };

    mockUseLoadGameQuery
      .mockReturnValueOnce({ data: null, isLoading: true })
      .mockReturnValue({ data: gameData, isLoading: false });

    const { queryByPlaceholderText, rerender, getByPlaceholderText } = render(
      <Provider store={store}>
        <GameScreen />
      </Provider>
    );

    expect(queryByPlaceholderText('What do you do?')).toBeNull();

    rerender(
      <Provider store={store}>
        <GameScreen />
      </Provider>
    );

    await waitFor(() => {
      expect(getByPlaceholderText('What do you do?')).toBeTruthy();
      expect(store.getState().game.currentSession?.session_id).toBe('session-2');
    });
  });
});
