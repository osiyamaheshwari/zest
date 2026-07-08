import express from 'express';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get items
router.get('/', async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let items = await db.lostfound.find();

    // Filters
    if (type) {
      items = items.filter(item => item.type.toLowerCase() === type.toLowerCase());
    }
    if (status) {
      items = items.filter(item => item.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower)
      );
    }

    res.json(items);
  } catch (err) {
    console.error('LostFound fetch error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Create item report
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, image, type, location, date } = req.body;

    if (!title || !type || !location || !date) {
      return res.status(400).json({ message: 'Title, type, location, and date are required.' });
    }

    if (type !== 'Lost' && type !== 'Found') {
      return res.status(400).json({ message: 'Type must be Lost or Found.' });
    }

    const user = await db.users.findById(req.user.id);

    const newItem = await db.lostfound.create({
      reporter: req.user.id,
      reporterName: user.name,
      reporterContact: user.contact || user.email,
      title,
      description: description || '',
      image: image || '',
      type,
      location,
      date,
      status: type === 'Lost' ? 'Lost' : 'Found',
      claimRequests: []
    });

    res.status(201).json(newItem);
  } catch (err) {
    console.error('LostFound create error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Submit a claim request (for lost or found items)
router.post('/:id/claim', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'A verification message is required to claim an item.' });
    }

    const item = await db.lostfound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item report not found.' });
    }

    if (item.reporter === req.user.id) {
      return res.status(400).json({ message: 'You cannot claim your own reported item.' });
    }

    const user = await db.users.findById(req.user.id);
    const claimRequests = item.claimRequests || [];

    // Check if user already claimed
    if (claimRequests.some(c => c.userId === req.user.id)) {
      return res.status(400).json({ message: 'You have already submitted a claim request for this item.' });
    }

    claimRequests.push({
      userId: req.user.id,
      userName: user.name,
      contact: user.contact || user.email,
      message,
      isApproved: false
    });

    const updated = await db.lostfound.findByIdAndUpdate(req.params.id, {
      claimRequests,
      status: item.status === 'Lost' || item.status === 'Found' ? 'Claimed' : item.status
    });

    res.json(updated);
  } catch (err) {
    console.error('Submit claim error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Handle Claim Approval (Reporter approves / denies claim)
router.put('/:id/claim/:claimIndex', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const item = await db.lostfound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item report not found.' });
    }

    if (item.reporter !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the reporter can process claim requests.' });
    }

    const claimIndex = parseInt(req.params.claimIndex);
    const claimRequests = item.claimRequests || [];

    if (isNaN(claimIndex) || claimIndex < 0 || claimIndex >= claimRequests.length) {
      return res.status(400).json({ message: 'Invalid claim index.' });
    }

    let status = item.status;
    if (action === 'approve') {
      claimRequests[claimIndex].isApproved = true;
      status = 'Verified'; // Verified ownership
    } else if (action === 'reject') {
      claimRequests.splice(claimIndex, 1);
      status = claimRequests.length > 0 ? 'Claimed' : (item.type === 'Lost' ? 'Lost' : 'Found');
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject.' });
    }

    const updated = await db.lostfound.findByIdAndUpdate(req.params.id, {
      claimRequests,
      status
    });

    res.json(updated);
  } catch (err) {
    console.error('Handle claim error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update overall status (e.g. mark as Returned)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Lost', 'Found', 'Claimed', 'Verified', 'Returned'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const item = await db.lostfound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (item.reporter !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const updated = await db.lostfound.findByIdAndUpdate(req.params.id, { status });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update item report details (owner only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, image, type, location, date } = req.body;
    const item = await db.lostfound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item report not found.' });
    }

    if (item.reporter !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the reporter can edit this report.' });
    }

    if (type && type !== 'Lost' && type !== 'Found') {
      return res.status(400).json({ message: 'Type must be Lost or Found.' });
    }

    const updated = await db.lostfound.findByIdAndUpdate(req.params.id, {
      title: title ?? item.title,
      description: description ?? item.description,
      image: image ?? item.image,
      type: type ?? item.type,
      location: location ?? item.location,
      date: date ?? item.date
    });
    res.json(updated);
  } catch (err) {
    console.error('LostFound update error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete item report (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await db.lostfound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item report not found.' });
    }

    if (item.reporter !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the reporter can delete this report.' });
    }

    await db.lostfound.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('LostFound delete error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
