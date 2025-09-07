// Re-export shared types for frontend use
export * from '../../../shared/types';

// Additional frontend-specific types
export interface GameUIState {
  isLoading: boolean;
  error: string | null;
  imageLoadingStates: Record<string, boolean>;
  inputText: string;
  isTyping: boolean;
}

export interface GameSettings {
  imageStyle: string;
  fontSize: number;
  autoScroll: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
}

export interface AuthState {
  token: string | null;
  user: {
    id: string;
    isAnonymous: boolean;
  } | null;
  isAuthenticated: boolean;
}

export interface RootState {
  auth: AuthState;
  game: GameState;
  ui: GameUIState;
  settings: GameSettings;
}

export interface GameState {
  currentSession: {
    session_id: string;
    world_state: WorldState;
    turn_history: Turn[];
    quick_actions: string[];
  } | null;
  savedGames: SavedGame[];
  recentSessions: GameSessionSummary[];
}

export interface GameSessionSummary {
  session_id: string;
  last_played: string;
  total_turns: number;
  current_location: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// API Response types with loading states
export interface APIResponse<T> {
  data?: T;
  error?: string;
  isLoading: boolean;
}