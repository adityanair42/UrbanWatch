import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import Marker from '../models/Marker';

const router = Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.query;
    if (!categoryId || typeof categoryId !== 'string') {
      res.status(400).json({ message: 'categoryId is required' });
      return;
    }

    const markers = await Marker.find({ categoryId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    res.json(markers);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticate, upload.array('images', 5), async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, lat, lng, title, description } = req.body;

    if (!categoryId || lat == null || lng == null || !title) {
      res.status(400).json({ message: 'categoryId, lat, lng, and title are required' });
      return;
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      res.status(400).json({ message: 'lat and lng must be valid numbers' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const images = files ? files.map((f) => f.filename) : [];

    const marker = await Marker.create({
      categoryId,
      userId: req.userId,
      lat: parsedLat,
      lng: parsedLng,
      title: title.trim(),
      description: description ? description.trim() : '',
      images,
    });

    await marker.populate('userId', 'username');
    res.status(201).json(marker);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const marker = await Marker.findById(req.params.id);

    if (!marker) {
      res.status(404).json({ message: 'Marker not found' });
      return;
    }

    if (marker.userId.toString() !== req.userId) {
      res.status(403).json({ message: 'Not authorized to delete this marker' });
      return;
    }

    marker.images.forEach((img) => {
      const imgPath = path.join(uploadsDir, img);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    });

    await marker.deleteOne();
    res.json({ message: 'Marker deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
