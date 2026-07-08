import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'zest_super_secret_key_12345';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branch, year, status, contact, profilePic } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Verify vit.edu domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@vit\.edu$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Registration is restricted to @vit.edu email addresses only.' });
    }

    // Check if user exists
    const existingUser = await db.users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = await db.users.create({
      name,
      email,
      password: hashedPassword,
      branch: branch || '',
      year: year || '',
      status: status || 'Day Scholar',
      contact: contact || '',
      profilePic: profilePic || '',
      contributions: 0,
      wishlist: []
    });

    // Sign Token
    const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        branch: newUser.branch,
        year: newUser.year,
        status: newUser.status,
        contact: newUser.contact,
        profilePic: newUser.profilePic,
        contributions: newUser.contributions
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Verify vit.edu domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@vit\.edu$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Only @vit.edu logins are permitted.' });
    }

    // Check user
    const user = await db.users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Sign Token
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        status: user.status,
        contact: user.contact,
        profilePic: user.profilePic,
        contributions: user.contributions
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Get profile (authenticated)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Omit password from return; expose `id` (frontend uses currentUser.id for ownership checks)
    const { password, ...userProfile } = user;
    res.json({ ...userProfile, id: user._id });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update Profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, branch, year, status, contact, profilePic } = req.body;
    const updated = await db.users.findByIdAndUpdate(req.user.id, {
      name, branch, year, status, contact, profilePic
    });
    
    const { password, ...userProfile } = updated;
    res.json({ ...userProfile, id: updated._id });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
