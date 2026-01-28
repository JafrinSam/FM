import mongoose from 'mongoose';

const rjSchema = new mongoose.Schema({
  name: { type: String },
  bio: { type: String, required: true },
  photo: [{ type: String, required: true }], 
  instagram: { type: String },
  
  // 👇 CHANGE THIS: Make it an Array [] to allow multiple shows
  shows: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Show' 
  }], 
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true 
  }
}, { timestamps: true });

export default mongoose.model('Rj', rjSchema);