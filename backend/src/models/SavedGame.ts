import mongoose, { Schema, Document } from 'mongoose';

export interface SavedGameDocument extends Document {
  save_id: string;
  save_name: string;
  session_id: string;
  user_id: string;
  created_at: Date;
  turn_count: number;
  preview_image: string;
  session_snapshot: any; // Full session data at time of save
}

const SavedGameSchema = new Schema({
  save_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  save_name: { 
    type: String, 
    required: true,
    maxlength: 50,
    trim: true
  },
  session_id: { 
    type: String, 
    required: true,
    index: true 
  },
  user_id: { 
    type: String, 
    required: true,
    index: true 
  },
  created_at: { type: Date, default: Date.now },
  turn_count: { type: Number, required: true },
  preview_image: { type: String, default: '' },
  session_snapshot: { type: Schema.Types.Mixed, required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
SavedGameSchema.index({ user_id: 1, created_at: -1 });
SavedGameSchema.index({ save_id: 1 });

// Prevent duplicate save names per user
SavedGameSchema.index({ user_id: 1, save_name: 1 }, { unique: true });

// Static methods
SavedGameSchema.statics.findByUserId = function(userId: string) {
  return this.find({ user_id: userId }).sort({ created_at: -1 });
};

SavedGameSchema.statics.findBySaveId = function(saveId: string) {
  return this.findOne({ save_id: saveId });
};

export const SavedGame = mongoose.model<SavedGameDocument>('SavedGame', SavedGameSchema);