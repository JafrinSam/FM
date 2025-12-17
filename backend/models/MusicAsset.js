import mongoose from 'mongoose';

const MusicAssetSchema = new mongoose.Schema({
  // The actual filename saved on disk (e.g., 1700000000000-song.mp3)
  filename: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  // The original name provided by the user (e.g., My Favorite Song.mp3)
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  // The path where Liquidsoap can access it (e.g., /radio/music/filename)
  filePath: {
    type: String,
    required: true,
  },
  // File size in bytes (for reference)
  size: {
    type: Number,
    required: true,
  },
  // Metadata fields (optional but useful)
  duration: {
    type: Number, // In seconds, would require a separate ID3 tag reader service
    default: 0
  },
  artist: {
    type: String,
    default: "Unknown"
  },
  title: {
    type: String,
    default: "Untitled Track"
  },
  type:{    
    type: String,
    default: "Unknown"

  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export const MusicAsset = mongoose.model('MusicAsset', MusicAssetSchema);