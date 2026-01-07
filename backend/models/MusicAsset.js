import mongoose from 'mongoose';

const MusicAssetSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true, trim: true },
  originalName: { type: String, required: true, trim: true },
  
  // The path inside AzuraCast (e.g. "Music/song.mp3")
  filePath: { type: String, required: true },
  
  // The local public URL for the cover art (e.g. "/covers/song.jpg")
  coverArt: { type: String, default: null },

  size: { type: Number, required: true },
  duration: { type: Number, default: 0 },
  
  artist: { type: String, default: "Unknown" },
  title: { type: String, default: "Untitled Track" },
  album: { type: String, default: "Unknown Album" }, // Added Album field
  
  type: { type: String, default: "Music" },
  
  uploadedAt: { type: Date, default: Date.now },
});

export const MusicAsset = mongoose.model('MusicAsset', MusicAssetSchema);