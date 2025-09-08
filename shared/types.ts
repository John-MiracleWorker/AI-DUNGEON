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
  genre: 'fantasy' | 'sci-fi' | 'horror' | 'modern' | 'custom';
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

export interface PromptAdventureRequest {
  prompt: string;
  style_preference?: 'detailed' | 'concise';
  image_style?: 'fantasy_art' | 'comic_book' | 'painterly';
  safety_filter?: boolean;
  content_rating?: 'PG-13' | 'R';
}

export type PromptAdventureResponse = CustomAdventureResponse;

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

export interface ImageGenerationConfig {
  model: 'gpt-image-1' | 'dall-e-3' | 'dall-e-2';
  size: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  enhancementLevel: 'basic' | 'detailed' | 'artistic';
}

export interface EnhancedImageRequest {
  prompt: string;
  adventureContext: AdventureDetails;
  config: ImageGenerationConfig;
  fallbackEnabled: boolean;
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

// Custom Adventure Types
export interface CustomAdventureRequest extends NewGameRequest {
  adventure_details: AdventureDetails;
}

export interface AdventureDetails {
  title: string;
  description: string;
  setting: AdventureSetting;
  characters: AdventureCharacters;
  plot: AdventurePlot;
  style_preferences: StylePreferences;
}

export interface TimePeriodSelection {
  type: 'predefined' | 'custom';
  value: string;
  customDescription?: string;
  era?: string;
  technologicalLevel?: string;
  culturalContext?: string;
}

export interface AdventureSetting {
  world_description: string;
  time_period: TimePeriodSelection;
  environment: string;
  special_rules?: string;
  locations?: string[];
}

export interface AdventureCharacters {
  player_role: string;
  key_npcs: AdventureNPC[];
  relationships?: Relationship[];
}

export interface NPCRelationship {
  targetNpcId: string;
  type: 'ally' | 'enemy' | 'neutral' | 'family' | 'romantic' | 'rival';
  description: string;
  strength: number; // 1-10
}

export interface AdventureNPC {
  id: string;
  name: string;
  description: string;
  relationship: string;
  personality?: string;
  goals?: string;
  traits: string[];
  backstory?: string;
  importance: 'major' | 'minor' | 'background';
  templateId?: string;
  relationships: NPCRelationship[];
}

export interface Relationship {
  character1: string;
  character2: string;
  type: string;
  description: string;
}

export interface AdventurePlot {
  main_objective: string;
  secondary_goals: string[];
  plot_hooks: string[];
  victory_conditions: string;
  estimated_turns?: number;
  themes?: string[];
}

export interface StylePreferences {
  tone: 'serious' | 'humorous' | 'dramatic' | 'mixed';
  complexity: 'simple' | 'moderate' | 'complex';
  pacing: 'slow' | 'moderate' | 'fast';
}

export interface CustomAdventure {
  adventure_id: string;
  user_id: string;
  title: string;
  description: string;
  setting: AdventureSetting;
  characters: AdventureCharacters;
  plot: AdventurePlot;
  style_preferences: StylePreferences;
  created_at: Date;
  is_template: boolean;
  usage_count: number;
  is_public?: boolean;
  tags?: string[];
}

export interface CustomGameSession extends GameSession {
  adventure_type: 'preset' | 'custom';
  custom_adventure?: {
    adventure_id: string;
    original_details: AdventureDetails;
    adaptive_elements: {
      discovered_locations: string[];
      met_npcs: string[];
      completed_objectives: string[];
      story_branches: string[];
      unlocked_plot_hooks: string[];
    };
  };
}

export interface CustomAdventureResponse {
  adventure_id: string;
  session_id: string;
  prologue: {
    narration: string;
    image_url: string;
    quick_actions: string[];
  };
  world_state: WorldState;
}

export interface NPCTemplate {
  id: string;
  name: string;
  category: 'fantasy' | 'sci-fi' | 'modern' | 'horror' | 'custom';
  archetype: string;
  description: string;
  personality: string;
  goals: string;
  traits: string[];
  commonRelationships: string[];
}

export interface AdventureTemplate {
  template_id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: string;
  rating: number;
  usage_count: number;
  adventure_details: AdventureDetails;
  created_at: Date;
  updated_at: Date;
  tags: string[];
}

export interface AdventureValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
  suggestions?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AdventureSuggestion {
  category: 'setting' | 'character' | 'plot' | 'style';
  field: string;
  suggestions: string[];
  reasoning?: string;
}

export interface CustomPromptContext {
  adventure_details: AdventureDetails;
  world_state: WorldState;
  recent_history: Turn[];
  player_input: string;
  session_id: string;
  adaptive_elements?: {
    discovered_locations: string[];
    met_npcs: string[];
    completed_objectives: string[];
    story_branches: string[];
  };
}