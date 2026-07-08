import express from 'express';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all listings
router.get('/', async (req, res) => {
  try {
    const { category, search, seller } = req.query;
    let items = await db.items.find();

    // Filters
    if (category) {
      items = items.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }
    if (seller) {
      items = items.filter(item => item.seller === seller);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchLower) || 
        item.description.toLowerCase().includes(searchLower)
      );
    }

    res.json(items);
  } catch (err) {
    console.error('Marketplace fetch error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get single item details
router.get('/:id', async (req, res) => {
  try {
    const item = await db.items.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item listing not found.' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Create item listing
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, price, image } = req.body;
    if (!title || !category || !price) {
      return res.status(400).json({ message: 'Title, category, and price are required.' });
    }

    const user = await db.users.findById(req.user.id);

    const newItem = await db.items.create({
      seller: req.user.id,
      sellerName: user.name,
      sellerContact: user.contact || user.email,
      title,
      description: description || '',
      category,
      price: Number(price),
      image: image || '',
      status: 'Interested', // default initial status
      interestedBuyers: []
    });

    res.status(201).json(newItem);
  } catch (err) {
    console.error('Marketplace create error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update deal tracking status (Seller only)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Interested', 'Contacted Seller', 'Meeting Scheduled', 'Negotiating', 'Deal Completed', 'Not Interested'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid deal status.' });
    }

    const item = await db.items.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Only allow seller to update deal status
    if (item.seller !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the seller can update item status.' });
    }

    const updated = await db.items.findByIdAndUpdate(req.params.id, { status });
    res.json(updated);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Express Interest (Buyer clicks contact/interested)
router.post('/:id/interest', authMiddleware, async (req, res) => {
  try {
    const item = await db.items.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (item.seller === req.user.id) {
      return res.status(400).json({ message: 'Sellers cannot express interest in their own items.' });
    }

    const buyers = item.interestedBuyers || [];
    if (!buyers.includes(req.user.id)) {
      buyers.push(req.user.id);
      await db.items.findByIdAndUpdate(req.params.id, { 
        interestedBuyers: buyers,
        status: item.status === 'Interested' ? 'Contacted Seller' : item.status
      });
    }

    res.json({ message: 'Interest registered successfully.', sellerContact: item.sellerContact });
  } catch (err) {
    console.error('Register interest error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update listing details (Seller only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, price, image } = req.body;
    const item = await db.items.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (item.seller !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the seller can update item details.' });
    }

    const updated = await db.items.findByIdAndUpdate(req.params.id, {
      title,
      description: description || '',
      category,
      price: Number(price),
      image: image || ''
    });
    res.json(updated);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await db.items.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (item.seller !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await db.items.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
