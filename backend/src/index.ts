import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import markerRoutes from './routes/markers';
import Category from './models/Category';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/markers', markerRoutes);

const seedCategories = async (): Promise<void> => {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany([
      { name: 'Potholes', description: 'Mark pothole locations on roads', icon: '🕳️', color: '#EF4444' },
      { name: 'Drinking Water Issues', description: 'Mark areas with drinking water problems', icon: '💧', color: '#3B82F6' },
      { name: 'Road Issues', description: 'Mark road damage or obstructions', icon: '🚧', color: '#F59E0B' },
      { name: 'Street Lighting', description: 'Mark areas with poor street lighting', icon: '💡', color: '#8B5CF6' },
      { name: 'Garbage Dumping', description: 'Mark illegal garbage dumping sites', icon: '🗑️', color: '#10B981' },
    ]);
    console.log('Default categories seeded');
  }
};

const start = async (): Promise<void> => {
  await connectDB();
  await seedCategories();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
