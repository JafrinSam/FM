import mongoose from 'mongoose'

const rjSchema = new mongoose.Schema({
  name: { type: String },
  bio: { type: String, required: true },
  photo: [{ type: String, required: true }], // Storing Image URLs
  instagram: { type: String },
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show' } // ManyToOne
}, { timestamps: true });

export default mongoose.model('Rj', rjSchema);