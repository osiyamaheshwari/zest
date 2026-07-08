import express from 'express';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all clubs/recruitments
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let list = await db.clubs.find();

    if (category) {
      list = list.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const searchLower = search.toLowerCase();
      list = list.filter(item => 
        item.clubName.toLowerCase().includes(searchLower) || 
        item.title.toLowerCase().includes(searchLower) || 
        item.description.toLowerCase().includes(searchLower)
      );
    }

    res.json(list);
  } catch (err) {
    console.error('Club fetch error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get single club post
router.get('/:id', async (req, res) => {
  try {
    const item = await db.clubs.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Club post not found.' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Create recruitment/club info
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { clubName, title, description, category, openPositions, requirements, activities, contact } = req.body;
    if (!clubName || !title || !category) {
      return res.status(400).json({ message: 'Club name, post title, and category are required.' });
    }

    const user = await db.users.findById(req.user.id);

    const newPost = await db.clubs.create({
      creator: req.user.id,
      creatorName: user.name,
      clubName,
      title,
      description: description || '',
      category,
      openPositions: openPositions || [],
      requirements: requirements || '',
      activities: activities || '',
      contact: contact || user.contact || user.email
    });

    res.status(201).json(newPost);
  } catch (err) {
    console.error('Club create error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update recruitment/club info
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { clubName, title, description, category, openPositions, requirements, activities, contact } = req.body;
    const item = await db.clubs.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Club post not found.' });
    }

    if (item.creator !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the creator can update this.' });
    }

    const updated = await db.clubs.findByIdAndUpdate(req.params.id, {
      clubName, title, description, category, openPositions, requirements, activities, contact
    });

    res.json(updated);
  } catch (err) {
    console.error('Club update error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete club post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await db.clubs.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Club post not found.' });
    }

    if (item.creator !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await db.clubs.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
