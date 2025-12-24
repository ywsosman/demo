const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_in_production';

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('patient', 'doctor', 'admin').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password, firstName, lastName, role } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName
    });

    // Create role-specific profile
    if (role === 'patient') {
      await PatientProfile.create({ userId: user._id });
    } else if (role === 'doctor') {
      await DoctorProfile.create({ userId: user._id });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // Log audit event
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: user._id,
      action: 'LOGIN',
      details: 'User logged in successfully'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id });
    }

    res.json({
      user,
      profile
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { role } = req.user;

    if (role === 'patient') {
      const { age, gender, medicalHistory, allergies, currentMedications, emergencyContact } = req.body;
      
      await PatientProfile.findOneAndUpdate(
        { userId },
        { age, gender, medicalHistory, allergies, currentMedications, emergencyContact },
        { upsert: true, new: true }
      );
    } else if (role === 'doctor') {
      const { specialization, licenseNumber, yearsOfExperience, hospital } = req.body;
      
      await DoctorProfile.findOneAndUpdate(
        { userId },
        { specialization, licenseNumber, yearsOfExperience, hospital },
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
