export interface GameSession {
  _id?: string;
  session_id: string;
  user_id?: string;
  world_state: WorldState;
  turn_history: Turn[];
  metadata: SessionMetadata;
  settings: GameSettings;
}

export interface WorldState {
  location: string;
  inventory: string[];
  npcs: NPC[];
  flags: Record<string, any>;
  current_chapter: string;
}

export interface Turn {
  turn_id: string;
  turn_number: number;
  player_input: string;
  narration: string;
  image_prompt: string;
  image_url: string;
  quick_actions: string[];
  world_state_snapshot: WorldState;
  timestamp: Date;
  processing_metadata: ProcessingMetadata;
}

export interface NPC {
  name: string;
  description: string;
  location: string;
  dialogue_state: Record<string, any>;
  relationship_level: number;
  is_active: boolean;
}

export interface SessionMetadata {
  genre: string;
  image_style: string;
  created_at: Date;
  last_played: Date;
  total_turns: number;
}

export interface GameSettings {
  difficulty: string;
  safety_filter: boolean;
}

export interface ProcessingMetadata {
  ai_response_time: number;
  image_generation_time: number;
  tokens_used: number;
}

export interface NewGameRequest {
  genre: 'fantasy' | 'sci-fi' | 'horror' | 'modern';
  style_preference: 'detailed' | 'concise';
  image_style: 'fantasy_art' | 'comic_book' | 'painterly';
  safety_filter?: boolean;
  content_rating?: 'PG-13' | 'R';
}

export interface NewGameResponse {
  session_id: string;
  prologue: {
    narration: string;
    image_url: string;
    quick_actions: string[];
  };
  world_state: WorldState;
}

export interface TurnRequest {
  session_id: string;
  player_input: string;
  context: {
    previous_turn_id?: string;
    retry_count: number;
  };
}

export interface TurnResponse {
  turn_id: string;
  narration: string;
  image_url: string;
  quick_actions: string[];
  world_state_changes: {
    location?: string;
    inventory_changes: {
      added: string[];
      removed: string[];
    };
    flags_updated: Record<string, any>;
  };
  metadata: {
    turn_number: number;
    timestamp: string;
    processing_time_ms: number;
  };
}

export interface SaveGameRequest {
  session_id: string;
  save_name: string;
}

export interface SavedGame {
  save_id: string;
  save_name: string;
  session_id: string;
  created_at: string;
  turn_count: number;
  preview_image: string;
}

export interface SavedGamesResponse {
  saves: SavedGame[];
}

export interface APIError {
  error: string;
  message: string;
  status: number;
}

export interface LocationData {
  name: string;
  description: string;
  exits: string[];
  items: string[];
  npcs: string[];
}

export interface StyleConfig {
  fantasy_art: {
    prefix: string;
    suffix: string;
  };
  comic_book: {
    prefix: string;
    suffix: string;
  };
  painterly: {
    prefix: string;
    suffix: string;
  };
}