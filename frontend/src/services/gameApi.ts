import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  NewGameRequest, 
  NewGameResponse, 
  TurnRequest, 
  TurnResponse,
  SaveGameRequest,
  SavedGamesResponse,
  GameSessionSummary 
} from '../types';

// Get API URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export const gameApi = createApi({
  reducerPath: 'gameApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // Add auth token if available
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Game', 'SavedGames', 'Sessions'],
  endpoints: (builder) => ({
    // Authentication
    createAnonymousSession: builder.mutation<{ token: string; user: any }, void>({
      query: () => ({
        url: '/auth/anonymous',
        method: 'POST',
      }),
    }),

    // Game operations
    startNewGame: builder.mutation<NewGameResponse, NewGameRequest>({
      query: (gameRequest) => ({
        url: '/new-game',
        method: 'POST',
        body: gameRequest,
      }),
      invalidatesTags: ['Sessions'],
    }),

    submitTurn: builder.mutation<TurnResponse, TurnRequest>({
      query: (turnRequest) => ({
        url: '/turn',
        method: 'POST',
        body: turnRequest,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Game', id: arg.session_id },
      ],
    }),

    loadGame: builder.query<any, string>({
      query: (sessionId) => `/game/${sessionId}`,
      providesTags: (result, error, sessionId) => [
        { type: 'Game', id: sessionId },
      ],
    }),

    saveGame: builder.mutation<{ save_id: string; message: string }, SaveGameRequest>({
      query: (saveRequest) => ({
        url: '/save-game',
        method: 'POST',
        body: saveRequest,
      }),
      invalidatesTags: ['SavedGames'],
    }),

    getSavedGames: builder.query<SavedGamesResponse, void>({
      query: () => '/saved-games',
      providesTags: ['SavedGames'],
    }),

    getUserSessions: builder.query<{ sessions: GameSessionSummary[] }, void>({
      query: () => '/sessions',
      providesTags: ['Sessions'],
    }),
  }),
});

export const {
  useCreateAnonymousSessionMutation,
  useStartNewGameMutation,
  useSubmitTurnMutation,
  useLoadGameQuery,
  useSaveGameMutation,
  useGetSavedGamesQuery,
  useGetUserSessionsQuery,
} = gameApi;