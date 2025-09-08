// Re-export shared types for frontend use
export * from '../../../shared/types';

// Explicit imports to ensure types are available
import type { 
  WorldState as SharedWorldState, 
  Turn as SharedTurn, 
  SavedGame as SharedSavedGame,
  CustomAdventureRequest,
  CustomAdventureResponse,
  AdventureDetails,
  AdventureValidationResult,
  AdventureSuggestion
} from '../../../shared/types';

// Re-export with local names to avoid conflicts
export type { 
  SharedWorldState as WorldState, 
  SharedTurn as Turn, 
  SharedSavedGame as SavedGame,
  CustomAdventureRequest,
  CustomAdventureResponse,
  AdventureDetails,
  AdventureValidationResult,
  AdventureSuggestion
};

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
  contentRating: 'PG-13' | 'R';
  safetyFilter: boolean;
  // Audio settings
  isAudioEnabled: boolean;
  selectedVoice: string;
  playbackSpeed: number;
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
    world_state: SharedWorldState;
    turn_history: SharedTurn[];
    quick_actions: string[];
  } | null;
  savedGames: SharedSavedGame[];
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

// Custom Adventure Frontend Types
export interface CustomAdventureState {
  currentAdventure: AdventureDetails | null;
  validationResult: AdventureValidationResult | null;
  suggestions: AdventureSuggestion[];
  userAdventures: UserAdventureItem[];
  publicTemplates: AdventureTemplate[];
  isCreating: boolean;
  isValidating: boolean;
  currentStep: number;
  maxSteps: number;
}

export interface UserAdventureItem {
  adventure_id: string;
  title: string;
  description: string;
  created_at: string;
  usage_count: number;
  is_template: boolean;
  tags: string[];
}

export interface AdventureTemplate {
  adventure_id: string;
  title: string;
  description: string;
  usage_count: number;
  created_at: string;
  tags: string[];
  estimated_duration: string;
}

export interface AdventureWizardStep {
  id: number;
  title: string;
  description: string;
  component: string;
  isComplete: boolean;
  isValid: boolean;
  data: any;
}

export interface GameCreationOptions {
  gameType: 'preset' | 'custom' | 'template';
  templateId?: string;
  genre?: string;
  style_preference: 'detailed' | 'concise';
  image_style: 'fantasy_art' | 'comic_book' | 'painterly';
  safety_filter?: boolean;
  content_rating?: 'PG-13' | 'R';
}

// Form validation types
export interface FormFieldValidation {
  isValid: boolean;
  error?: string;
  touched: boolean;
}

export interface AdventureFormValidation {
  title: FormFieldValidation;
  description: FormFieldValidation;
  world_description: FormFieldValidation;
  time_period: FormFieldValidation;
  environment: FormFieldValidation;
  player_role: FormFieldValidation;
  main_objective: FormFieldValidation;
  victory_conditions: FormFieldValidation;
}

// Navigation types
export interface NavigationState {
  canGoBack: boolean;
  canGoNext: boolean;
  currentStepIndex: number;
  totalSteps: number;
}