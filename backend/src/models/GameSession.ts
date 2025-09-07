import mongoose, { Schema, Document } from 'mongoose';
import { GameSession as IGameSession, WorldState, SessionMetadata, GameSettings } from '../../../shared/types';

export interface GameSessionDocument extends IGameSession, Document {
  _id: string;
}

const NPCSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  dialogue_state: { type: Schema.Types.Mixed, default: {} },
  relationship_level: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { _id: false });

const WorldStateSchema = new Schema({
  location: { type: String, required: true, default: 'Starting Location' },
  inventory: [{ type: String }],
  npcs: [NPCSchema],
  flags: { type: Schema.Types.Mixed, default: {} },
  current_chapter: { type: String, default: 'Prologue' },
}, { _id: false });

const ProcessingMetadataSchema = new Schema({
  ai_response_time: { type: Number, default: 0 },
  image_generation_time: { type: Number, default: 0 },
  tokens_used: { type: Number, default: 0 },
}, { _id: false });

const TurnSchema = new Schema({
  turn_id: { type: String, required: true, unique: true },
  turn_number: { type: Number, required: true },
  player_input: { type: String, required: true },
  narration: { type: String, required: true },
  image_prompt: { type: String, required: true },
  image_url: { type: String, default: '' },
  quick_actions: [{ type: String }],
  world_state_snapshot: WorldStateSchema,
  timestamp: { type: Date, default: Date.now },
  processing_metadata: ProcessingMetadataSchema,
}, { _id: false });

const SessionMetadataSchema = new Schema({
  genre: { 
    type: String, 
    required: true,
    enum: ['fantasy', 'sci-fi', 'horror', 'modern'],
    default: 'fantasy'
  },
  image_style: { 
    type: String, 
    required: true,
    enum: ['fantasy_art', 'comic_book', 'painterly'],
    default: 'fantasy_art'
  },
  created_at: { type: Date, default: Date.now },
  last_played: { type: Date, default: Date.now },
  total_turns: { type: Number, default: 0 },
}, { _id: false });

const GameSettingsSchema = new Schema({
  difficulty: { 
    type: String, 
    enum: ['easy', 'normal', 'hard'],
    default: 'normal'
  },
  safety_filter: { type: Boolean, default: true },
}, { _id: false });

const GameSessionSchema = new Schema({
  session_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  user_id: { 
    type: String, 
    required: true,
    index: true 
  },
  world_state: { 
    type: WorldStateSchema, 
    required: true,
    default: () => ({})
  },
  turn_history: [TurnSchema],
  metadata: { 
    type: SessionMetadataSchema, 
    required: true,
    default: () => ({})
  },
  settings: { 
    type: GameSettingsSchema, 
    required: true,
    default: () => ({})
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
GameSessionSchema.index({ user_id: 1, 'metadata.last_played': -1 });
GameSessionSchema.index({ session_id: 1 });
GameSessionSchema.index({ 'metadata.created_at': -1 });

// Virtual for latest turn
GameSessionSchema.virtual('latestTurn').get(function() {
  return this.turn_history[this.turn_history.length - 1];
});

// Update last_played on save
GameSessionSchema.pre('save', function(next) {
  this.metadata.last_played = new Date();
  next();
});

// Static methods
GameSessionSchema.statics.findBySessionId = function(sessionId: string) {
  return this.findOne({ session_id: sessionId });
};

GameSessionSchema.statics.findByUserId = function(userId: string) {
  return this.find({ user_id: userId }).sort({ 'metadata.last_played': -1 });
};

// Instance methods
GameSessionSchema.methods.addTurn = function(turn: any) {
  this.turn_history.push(turn);
  this.metadata.total_turns = this.turn_history.length;
  this.metadata.last_played = new Date();
  return this.save();
};

GameSessionSchema.methods.updateWorldState = function(newState: Partial<WorldState>) {
  this.world_state = { ...this.world_state.toObject(), ...newState };
  this.markModified('world_state');
  return this.save();
};

export const GameSession = mongoose.model<GameSessionDocument>('GameSession', GameSessionSchema);