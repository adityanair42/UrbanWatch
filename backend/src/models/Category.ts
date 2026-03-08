import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, default: '📍' },
    color: { type: String, default: '#6B7280' },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', CategorySchema);
