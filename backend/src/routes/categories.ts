import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import Category from '../models/Category';

const router = Router();

router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon, color } = req.body;

    if (!name || !description) {
      res.status(400).json({ message: 'Name and description are required' });
      return;
    }

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      res.status(400).json({ message: 'A category with this name already exists' });
      return;
    }

    const category = await Category.create({
      name: name.trim(),
      description: description.trim(),
      icon: icon || '📍',
      color: color || '#6B7280',
    });

    res.status(201).json(category);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
