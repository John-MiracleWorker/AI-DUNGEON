import mongoose, { Schema, Document, Model } from 'mongoose';
import { 
  CustomAdventure as ICustomAdventure,
  AdventureSetting,
  AdventureCharacters,
  AdventurePlot,
  StylePreferences,
  AdventureNPC,
  Relationship
} from '../../../shared/types';

export interface CustomAdventureDocument extends ICustomAdventure, Document {
  _id: string;
  incrementUsage(): Promise<CustomAdventureDocument>;
  makeTemplate(): Promise<CustomAdventureDocument>;
  makePublic(): Promise<CustomAdventureDocument>;
}

export interface CustomAdventureModel extends Model<CustomAdventureDocument> {
  findByUserId(userId: string): Promise<CustomAdventureDocument[]>;
  findPublicTemplates(limit?: number): Promise<CustomAdventureDocument[]>;
  findByTags(tags: string[]): Promise<CustomAdventureDocument[]>;
  searchAdventures(searchTerm: string): Promise<CustomAdventureDocument[]>;
}

const AdventureNPCSchema = new Schema({
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  relationship: { type: String, required: true, maxlength: 200 },
  personality: { type: String, maxlength: 300 },
  goals: { type: String, maxlength: 300 },
}, { _id: false });

const RelationshipSchema = new Schema({
  character1: { type: String, required: true },
  character2: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true, maxlength: 200 },
}, { _id: false });

const AdventureSettingSchema = new Schema({
  world_description: { 
    type: String, 
    required: true, 
    minlength: 50,
    maxlength: 2000 
  },
  time_period: { 
    type: {
      type: String,
      required: true,
      enum: ['predefined', 'custom']
    },
    value: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          // For predefined time periods, validate against the list
          const predefinedPeriods = [
            'prehistoric', 'ancient', 'medieval', 'renaissance', 
            'industrial', 'modern', 'near_future', 'far_future', 
            'post_apocalyptic', 'custom'
          ];
          // @ts-ignore
          const doc = this.ownerDocument ? this.ownerDocument() : this;
          // @ts-ignore
          if (doc && doc.time_period && doc.time_period.type === 'predefined') {
            return predefinedPeriods.includes(v);
          }
          // For custom time periods, just check that it's not empty
          return v && v.length > 0;
        },
        message: 'Invalid time period value'
      }
    },
    customDescription: String,
    era: String,
    technologicalLevel: String,
    culturalContext: String
  },
  environment: { 
    type: String, 
    required: true,
    maxlength: 500 
  },
  special_rules: { 
    type: String, 
    maxlength: 1000 
  },
  locations: [{ type: String, maxlength: 100 }],
}, { _id: false });

const AdventureCharactersSchema = new Schema({
  player_role: { 
    type: String, 
    required: true,
    maxlength: 300 
  },
  key_npcs: {
    type: [AdventureNPCSchema],
    validate: {
      validator: function(npcs: any[]) {
        return npcs.length <= 10;
      },
      message: 'Maximum 10 NPCs allowed per adventure'
    }
  },
  relationships: [RelationshipSchema],
}, { _id: false });

const AdventurePlotSchema = new Schema({
  main_objective: { 
    type: String, 
    required: true,
    maxlength: 500 
  },
  secondary_goals: {
    type: [{ type: String, maxlength: 200 }],
    validate: {
      validator: function(goals: string[]) {
        return goals.length <= 5;
      },
      message: 'Maximum 5 secondary goals allowed'
    }
  },
  plot_hooks: {
    type: [{ type: String, maxlength: 300 }],
    validate: {
      validator: function(hooks: string[]) {
        return hooks.length <= 8;
      },
      message: 'Maximum 8 plot hooks allowed'
    }
  },
  victory_conditions: { 
    type: String, 
    required: true,
    maxlength: 400 
  },
  estimated_turns: { 
    type: Number, 
    min: 5, 
    max: 200,
    default: 30 
  },
  themes: [{ type: String, maxlength: 50 }],
}, { _id: false });

const StylePreferencesSchema = new Schema({
  tone: { 
    type: String, 
    required: true,
    enum: ['serious', 'humorous', 'dramatic', 'mixed'],
    default: 'mixed'
  },
  complexity: { 
    type: String, 
    required: true,
    enum: ['simple', 'moderate', 'complex'],
    default: 'moderate'
  },
  pacing: { 
    type: String, 
    required: true,
    enum: ['slow', 'moderate', 'fast'],
    default: 'moderate'
  },
}, { _id: false });

const CustomAdventureSchema = new Schema({
  adventure_id: { 
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
  title: { 
    type: String, 
    required: true,
    minlength: 3,
    maxlength: 100,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    minlength: 10,
    maxlength: 1000,
    trim: true
  },
  setting: { 
    type: AdventureSettingSchema, 
    required: true 
  },
  characters: { 
    type: AdventureCharactersSchema, 
    required: true 
  },
  plot: { 
    type: AdventurePlotSchema, 
    required: true 
  },
  style_preferences: { 
    type: StylePreferencesSchema, 
    required: true,
    default: () => ({})
  },
  created_at: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  is_template: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  usage_count: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  is_public: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  tags: {
    type: [{ type: String, maxlength: 30 }],
    validate: {
      validator: function(tags: string[]) {
        return tags.length <= 10;
      },
      message: 'Maximum 10 tags allowed'
    }
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
CustomAdventureSchema.index({ user_id: 1, created_at: -1 });
CustomAdventureSchema.index({ is_template: 1, is_public: 1 });
CustomAdventureSchema.index({ tags: 1 });
CustomAdventureSchema.index({ 'style_preferences.tone': 1 });
CustomAdventureSchema.index({ usage_count: -1 });

// Text search index for title and description
CustomAdventureSchema.index({ 
  title: 'text', 
  description: 'text',
  'setting.world_description': 'text' 
});

// Virtual for estimated completion time based on turns
CustomAdventureSchema.virtual('estimatedDuration').get(function() {
  const avgMinutesPerTurn = 3;
  return `${Math.round(this.plot.estimated_turns * avgMinutesPerTurn / 60 * 10) / 10} hours`;
});

// Pre-save middleware to update timestamps and validate
CustomAdventureSchema.pre('save', function(next) {
  // Ensure tags are lowercase and unique
  if (this.tags) {
    this.tags = [...new Set(this.tags.map(tag => tag.toLowerCase().trim()))];
  }
  
  // Auto-generate adventure_id if not provided
  if (!this.adventure_id) {
    this.adventure_id = `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  next();
});

// Static methods
CustomAdventureSchema.statics.findByUserId = function(userId: string) {
  return this.find({ user_id: userId }).sort({ created_at: -1 });
};

CustomAdventureSchema.statics.findPublicTemplates = function(limit = 20) {
  return this.find({ is_template: true, is_public: true })
    .sort({ usage_count: -1, created_at: -1 })
    .limit(limit);
};

CustomAdventureSchema.statics.findByTags = function(tags: string[]) {
  return this.find({ tags: { $in: tags } })
    .sort({ usage_count: -1 });
};

CustomAdventureSchema.statics.searchAdventures = function(searchTerm: string) {
  return this.find(
    { $text: { $search: searchTerm } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
CustomAdventureSchema.methods.incrementUsage = function() {
  this.usage_count += 1;
  return this.save();
};

CustomAdventureSchema.methods.makeTemplate = function() {
  this.is_template = true;
  return this.save();
};

CustomAdventureSchema.methods.makePublic = function() {
  this.is_public = true;
  return this.save();
};

export const CustomAdventure = mongoose.model<CustomAdventureDocument, CustomAdventureModel>('CustomAdventure', CustomAdventureSchema);