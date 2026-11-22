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
    const { name, email, phone, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const cleanPhone = phone ? phone.trim() : '';

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
        phone: cleanPhone,
        password: hashedPassword
      });
      await newUser.save();
      createdUser = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
      };
    } else {
      const newUser = localDB.createUser({
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword
      });
      createdUser = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
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
// @desc    Authenticate with email and password, or auto-register examinee with name, email, phone & password
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name ? name.trim() : '';
    const cleanPhone = phone ? phone.trim() : '';

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    let user;
    if (isMongooseReady()) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = localDB.findUserByEmail(cleanEmail);
    }

    // If user does not exist yet and name is provided, auto-create student account
    if (!user) {
      if (!cleanName) {
        return res.status(400).json({
          message: 'No account found with this email. Please enter your Full Name, Email, Phone Number, and Password to sign in.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      if (isMongooseReady()) {
        const newUser = new User({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password: hashedPassword
        });
        await newUser.save();
        user = newUser;
      } else {
        user = localDB.createUser({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password: hashedPassword
        });
      }
    } else {
      // User exists, verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password. Please check your credentials.' });
      }

      // Update name and phone if provided and changed
      if (cleanName || cleanPhone) {
        if (isMongooseReady()) {
          let hasChanges = false;
          if (cleanName && user.name !== cleanName) {
            user.name = cleanName;
            hasChanges = true;
          }
          if (cleanPhone && user.phone !== cleanPhone) {
            user.phone = cleanPhone;
            hasChanges = true;
          }
          if (hasChanges) {
            await user.save();
          }
        } else {
          localDB.updateUser(user._id, {
            name: cleanName || user.name,
            phone: cleanPhone || user.phone
          });
          user.name = cleanName || user.name;
          user.phone = cleanPhone || user.phone;
        }
      }
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
        email: user.email,
        phone: user.phone || ''
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
        email: user.email,
        phone: user.phone || ''
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error retrieving user profile.' });
  }
});

module.exports = router;
