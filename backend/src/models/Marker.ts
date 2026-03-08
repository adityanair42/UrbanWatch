import mongoose, { Document, Schema } from 'mongoose';

export interface IMarker extends Document {
  categoryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  lat: number;
  lng: number;
  title: string;
  description: string;
  images: string[];
  createdAt: Date;
}

const MarkerSchema = new Schema<IMarker>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    images: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IMarker>('Marker', MarkerSchema);
