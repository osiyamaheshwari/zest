import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const router = express.Router();

// Get resources
router.get('/', async (req, res) => {
  try {
    const { department, year, semester, subject, search } = req.query;
    let resources = await db.resources.find();

    // Filters
    if (department) {
      resources = resources.filter(r => r.department.toLowerCase() === department.toLowerCase());
    }
    if (year) {
      resources = resources.filter(r => r.year === year);
    }
    if (semester) {
      resources = resources.filter(r => r.semester === semester);
    }
    if (subject) {
      resources = resources.filter(r => r.subject.toLowerCase().includes(subject.toLowerCase()));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      resources = resources.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.subject.toLowerCase().includes(searchLower)
      );
    }

    res.json(resources);
  } catch (err) {
    console.error('Resources fetch error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await db.users.find();
    // Sort by contributions descending, limit to top 10
    const leaderboard = users
      .sort((a, b) => (b.contributions || 0) - (a.contributions || 0))
      .slice(0, 10)
      .map(user => ({
        id: user._id,
        name: user.name,
        branch: user.branch,
        contributions: user.contributions || 0,
        profilePic: user.profilePic
      }));
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get single resource
router.get('/:id', async (req, res) => {
  try {
    const resource = await db.resources.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Create resource listing
router.post('/', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const { title, description, department, year, semester, subject, filePath } = req.body;
    const uploadedFilePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (!title || !department || !year || !semester || !subject) {
      return res.status(400).json({ message: 'Title, department, year, semester, and subject are required.' });
    }

    const user = await db.users.findById(req.user.id);

    const newResource = await db.resources.create({
      contributor: req.user.id,
      contributorName: user.name,
      title,
      description: description || '',
      department,
      year,
      semester,
      subject,
      filePath: uploadedFilePath || filePath || 'sample_note.pdf',
      downloads: 0,
      ratings: [],
      avgRating: 0,
      reviews: []
    });

    // Increment user contributions
    const newContrib = (user.contributions || 0) + 1;
    await db.users.findByIdAndUpdate(req.user.id, { contributions: newContrib });

    res.status(201).json(newResource);
  } catch (err) {
    console.error('Resource create error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Increment Download
router.post('/:id/download', async (req, res) => {
  try {
    const resource = await db.resources.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    const updated = await db.resources.findByIdAndUpdate(req.params.id, {
      downloads: (resource.downloads || 0) + 1
    });

    res.json({ downloads: updated.downloads });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Add Review & Rating
router.post('/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, text } = req.body;
    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const resource = await db.resources.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    const user = await db.users.findById(req.user.id);

    // Filter out previous rating by this user if any
    const ratings = (resource.ratings || []).filter(r => r.userId !== req.user.id);
    ratings.push({ userId: req.user.id, rating: Number(rating) });

    // Calculate new average
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    // Add review text
    const reviews = resource.reviews || [];
    if (text) {
      reviews.push({
        userId: req.user.id,
        userName: user.name,
        text,
        date: new Date().toISOString()
      });
    }

    const updated = await db.resources.findByIdAndUpdate(req.params.id, {
      ratings,
      avgRating: Number(avgRating.toFixed(1)),
      reviews
    });

    res.json(updated);
  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update resource (owner only)
router.put('/:id', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const { title, description, department, year, semester, subject, filePath } = req.body;
    const uploadedFilePath = req.file ? `/uploads/${req.file.filename}` : undefined;
    const resource = await db.resources.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    if (resource.contributor !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the contributor can edit this resource.' });
    }

    const updated = await db.resources.findByIdAndUpdate(req.params.id, {
      title: title ?? resource.title,
      description: description ?? resource.description,
      department: department ?? resource.department,
      year: year ?? resource.year,
      semester: semester ?? resource.semester,
      subject: subject ?? resource.subject,
      filePath: uploadedFilePath || filePath || resource.filePath
    });
    res.json(updated);
  } catch (err) {
    console.error('Resource update error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete resource (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const resource = await db.resources.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    if (resource.contributor !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the contributor can delete this resource.' });
    }

    await db.resources.findByIdAndDelete(req.params.id);

    // Decrement contributor count (floor at 0)
    const user = await db.users.findById(req.user.id);
    if (user) {
      await db.users.findByIdAndUpdate(req.user.id, { contributions: Math.max(0, (user.contributions || 0) - 1) });
    }

    res.json({ message: 'Resource deleted successfully.' });
  } catch (err) {
    console.error('Resource delete error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
