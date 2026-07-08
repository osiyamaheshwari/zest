import express from 'express';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get accommodation listings
router.get('/', async (req, res) => {
  try {
    const { type, maxRent, occupancy, genderPreference, minDistance, roommateNeeded, search } = req.query;
    let listings = await db.hostels.find();

    // Filters
    if (type) {
      listings = listings.filter(l => l.type.toLowerCase() === type.toLowerCase());
    }
    if (maxRent) {
      listings = listings.filter(l => l.rent <= Number(maxRent));
    }
    if (occupancy) {
      listings = listings.filter(l => l.occupancy.toLowerCase() === occupancy.toLowerCase());
    }
    if (genderPreference && genderPreference !== 'Any') {
      listings = listings.filter(l => l.genderPreference === 'Any' || l.genderPreference.toLowerCase() === genderPreference.toLowerCase());
    }
    if (minDistance) {
      listings = listings.filter(l => l.distance <= Number(minDistance));
    }
    if (roommateNeeded === 'true') {
      listings = listings.filter(l => l.roommateProfile && l.roommateProfile.needed === true);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      listings = listings.filter(l => 
        l.title.toLowerCase().includes(searchLower) || 
        l.location.toLowerCase().includes(searchLower) ||
        l.description.toLowerCase().includes(searchLower)
      );
    }

    res.json(listings);
  } catch (err) {
    console.error('Hostel fetch error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await db.hostels.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Create listing
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, type, rent, location, occupancy, genderPreference, amenities, distance, images, roommateNeeded, roommateDetails } = req.body;

    if (!title || !type || !rent || !location) {
      return res.status(400).json({ message: 'Title, type, rent, and location are required.' });
    }

    const user = await db.users.findById(req.user.id);

    const newListing = await db.hostels.create({
      owner: req.user.id,
      ownerName: user.name,
      ownerContact: user.contact || user.email,
      title,
      description: description || '',
      type,
      rent: Number(rent),
      location,
      occupancy: occupancy || 'Shared',
      genderPreference: genderPreference || 'Any',
      amenities: amenities || [],
      distance: Number(distance) || 0,
      images: images || [],
      roommateProfile: {
        needed: roommateNeeded === true,
        details: roommateDetails || ''
      }
    });

    res.status(201).json(newListing);
  } catch (err) {
    console.error('Hostel create error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Add to wishlist
router.post('/:id/wishlist', authMiddleware, async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    const wishlist = user.wishlist || [];
    const id = req.params.id;

    if (wishlist.includes(id)) {
      // Remove
      const index = wishlist.indexOf(id);
      wishlist.splice(index, 1);
    } else {
      // Add
      wishlist.push(id);
    }

    const updatedUser = await db.users.findByIdAndUpdate(req.user.id, { wishlist });
    res.json({ wishlist: updatedUser.wishlist });
  } catch (err) {
    console.error('Wishlist error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update listing details (Owner only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, type, rent, location, occupancy, genderPreference, amenities, distance, images, roommateNeeded, roommateDetails } = req.body;
    const listing = await db.hostels.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listing.owner !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the owner can edit this listing.' });
    }

    const updated = await db.hostels.findByIdAndUpdate(req.params.id, {
      title,
      description: description || '',
      type,
      rent: Number(rent),
      location,
      occupancy: occupancy || 'Shared',
      genderPreference: genderPreference || 'Any',
      amenities: amenities || [],
      distance: Number(distance) || 0,
      images: images || [],
      roommateProfile: {
        needed: roommateNeeded === true,
        details: roommateDetails || ''
      }
    });
    res.json(updated);
  } catch (err) {
    console.error('Update hostel error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await db.hostels.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listing.owner !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await db.hostels.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
