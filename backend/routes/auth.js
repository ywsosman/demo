const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_in_production';

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('patient', 'doctor').required()
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
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.run(
      'INSERT INTO users (email, password, role, firstName, lastName) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, role, firstName, lastName]
    );

    // Create role-specific profile
    if (role === 'patient') {
      await db.run(
        'INSERT INTO patient_profiles (userId) VALUES (?)',
        [result.id]
      );
    } else if (role === 'doctor') {
      await db.run(
        'INSERT INTO doctor_profiles (userId) VALUES (?)',
        [result.id]
      );
    }

    // Generate JWT token
    const token = jwt.sign({ userId: result.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        email,
        role,
        firstName,
        lastName
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
    const user = await db.get(
      'SELECT id, email, password, role, firstName, lastName FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Log audit event
    await db.run(
      'INSERT INTO audit_logs (userId, action, details) VALUES (?, ?, ?)',
      [user.id, 'LOGIN', 'User logged in successfully']
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
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
      profile = await db.get(
        'SELECT * FROM patient_profiles WHERE userId = ?',
        [user.id]
      );
    } else if (user.role === 'doctor') {
      profile = await db.get(
        'SELECT * FROM doctor_profiles WHERE userId = ?',
        [user.id]
      );
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
    const userId = req.user.id;
    const { role } = req.user;

    if (role === 'patient') {
      const { age, gender, medicalHistory, allergies, currentMedications, emergencyContact } = req.body;
      
      await db.run(
        `UPDATE patient_profiles 
         SET age = ?, gender = ?, medicalHistory = ?, allergies = ?, 
             currentMedications = ?, emergencyContact = ?
         WHERE userId = ?`,
        [age, gender, medicalHistory, allergies, currentMedications, emergencyContact, userId]
      );
    } else if (role === 'doctor') {
      const { specialization, licenseNumber, yearsOfExperience, hospital } = req.body;
      
      await db.run(
        `UPDATE doctor_profiles 
         SET specialization = ?, licenseNumber = ?, yearsOfExperience = ?, hospital = ?
         WHERE userId = ?`,
        [specialization, licenseNumber, yearsOfExperience, hospital, userId]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
