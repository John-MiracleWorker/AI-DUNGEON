import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  NewGameRequest, 
  NewGameResponse, 
  TurnRequest, 
  TurnResponse,
  SaveGameRequest,
  SavedGamesResponse,
  GameSessionSummary,
  GameSession,
  CustomAdventureRequest,
  CustomAdventureResponse,
  PromptAdventureRequest,
  AdventureDetails,
  AdventureValidationResult,
  AdventureSuggestion,
  UserAdventureItem,
  AdventureTemplate
} from '../types';
import { PendingAction } from '../store/offlineSlice';

// Mobile-specific interfaces
interface QuickStartRequest {
  favoriteGenres?: string[];
  preferredImageStyle?: string;
  preferredNarrativeStyle?: string;
}

interface SyncResponse {
  processed: string[];
  failed: string[];
  message: string;
}

interface OptimizedImageRequest {
  imageUrl: string;
  size: 'thumb' | 'medium' | 'full';
}

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
  tagTypes: ['Game', 'SavedGames', 'Sessions', 'Adventure', 'AdventureTemplates'],
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

    // Mobile-specific endpoints
    quickStartGame: builder.mutation<NewGameResponse, QuickStartRequest>({
      query: (preferences) => ({
        url: '/game/quick-start',
        method: 'POST',
        body: preferences,
      }),
      invalidatesTags: ['Sessions'],
    }),

    getRecentGames: builder.query<GameSession[], { limit?: number }>({
      query: ({ limit = 5 }) => `/game/recent?limit=${limit}`,
      providesTags: ['Sessions'],
    }),

    syncOfflineActions: builder.mutation<SyncResponse, PendingAction[]>({
      query: (actions) => ({
        url: '/game/sync',
        method: 'POST',
        body: { actions },
      }),
      invalidatesTags: ['Game', 'Sessions', 'SavedGames'],
    }),

    getOptimizedImage: builder.query<string, OptimizedImageRequest>({
      query: ({ imageUrl, size }) => 
        `/images/optimize?url=${encodeURIComponent(imageUrl)}&size=${size}`,
    }),

    getUserStats: builder.query<{
      totalGames: number;
      totalTurns: number;
      hoursPlayed: number;
      favoriteGenres: string[];
    }, void>({
      query: () => '/user/stats',
    }),

    updateUserPreferences: builder.mutation<{ message: string }, {
      hapticEnabled: boolean;
      notificationsEnabled: boolean;
      favoriteGenres: string[];
      preferredImageStyle: string;
      preferredNarrativeStyle: string;
    }>({
      query: (preferences) => ({
        url: '/user/preferences',
        method: 'PUT',
        body: preferences,
      }),
    }),

    // Health check for connectivity
    healthCheck: builder.query<{ status: string; timestamp: number }, void>({
      query: () => '/health',
    }),

    // Custom Adventure endpoints
    createCustomGame: builder.mutation<CustomAdventureResponse, CustomAdventureRequest>({
      query: (customRequest) => ({
        url: '/new-custom-game',
        method: 'POST',
        body: customRequest,
      }),
      invalidatesTags: ['Sessions', 'Adventure'],
    }),

    createPromptGame: builder.mutation<CustomAdventureResponse, PromptAdventureRequest>({
      query: (body) => ({
        url: '/new-prompt-game',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Sessions', 'Adventure'],
    }),

    validateAdventure: builder.mutation<AdventureValidationResult, { adventure_details: AdventureDetails }>({
      query: (body) => ({
        url: '/validate-adventure',
        method: 'POST',
        body,
      }),
    }),

    getAdventureSuggestions: builder.mutation<{ suggestions: AdventureSuggestion[] }, { partial_adventure?: Partial<AdventureDetails> }>({
      query: (body) => ({
        url: '/adventure-suggestions',
        method: 'POST',
        body,
      }),
    }),

    getUserAdventures: builder.query<{ adventures: UserAdventureItem[] }, void>({
      query: () => '/user-adventures',
      providesTags: ['Adventure'],
    }),

    getAdventureTemplates: builder.query<{ templates: AdventureTemplate[] }, { limit?: number }>({
      query: ({ limit = 20 } = {}) => `/adventure-templates?limit=${limit}`,
      providesTags: ['AdventureTemplates'],
    }),

    saveAdventureAsTemplate: builder.mutation<{ message: string; template_id: string }, { 
      adventure_id: string; 
      is_public?: boolean; 
    }>({
      query: (body) => ({
        url: '/save-adventure-template',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Adventure', 'AdventureTemplates'],
    }),

    createGameFromTemplate: builder.mutation<CustomAdventureResponse, {
      templateId: string;
      style_preference: 'detailed' | 'concise';
      image_style: 'fantasy_art' | 'comic_book' | 'painterly';
      safety_filter?: boolean;
      content_rating?: 'PG-13' | 'R';
    }>({
      query: ({ templateId, ...body }) => ({
        url: `/create-from-template/${templateId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Sessions'],
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
  // Mobile-specific hooks
  useQuickStartGameMutation,
  useGetRecentGamesQuery,
  useSyncOfflineActionsMutation,
  useGetOptimizedImageQuery,
  useGetUserStatsQuery,
  useUpdateUserPreferencesMutation,
  useHealthCheckQuery,
  // Custom Adventure hooks
  useCreateCustomGameMutation,
  useCreatePromptGameMutation,
  useValidateAdventureMutation,
  useGetAdventureSuggestionsMutation,
  useGetUserAdventuresQuery,
  useGetAdventureTemplatesQuery,
  useSaveAdventureAsTemplateMutation,
  useCreateGameFromTemplateMutation,
} = gameApi;