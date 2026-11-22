const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const localDB = require('../utils/localStore');

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isMongooseReady = () => mongoose.connection.readyState === 1;

// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check duplicate
    let existingUser;
    if (isMongooseReady()) {
      existingUser = await User.findOne({ email: cleanEmail });
    } else {
      existingUser = localDB.findUserByEmail(cleanEmail);
    }

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let createdUser;
    if (isMongooseReady()) {
      const newUser = new User({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword
      });
      await newUser.save();
      createdUser = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email
      };
    } else {
      const newUser = localDB.createUser({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword
      });
      createdUser = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email
      };
    }

    const secret = process.env.JWT_SECRET || 'default_jwt_secret_change_me';
    const token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      secret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: createdUser
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error during signup. Please try again later.' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user;
    if (isMongooseReady()) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = localDB.findUserByEmail(cleanEmail);
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const userIdStr = (user._id || user.id).toString();
    const secret = process.env.JWT_SECRET || 'default_jwt_secret_change_me';
    const token = jwt.sign(
      { userId: userIdStr, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: userIdStr,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login. Please try again later.' });
  }
});

// @route   GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let user;
    if (isMongooseReady()) {
      user = await User.findById(req.userId).select('-password');
    } else {
      user = localDB.findUserById(req.userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      user: {
        id: (user._id || user.id).toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error retrieving user profile.' });
  }
});

module.exports = router;
