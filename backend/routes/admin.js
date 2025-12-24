const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const DiagnosisSession = require('../models/DiagnosisSession');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole(['admin']));

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDiagnoses = await DiagnosisSession.countDocuments();
    const recentDiagnoses = await DiagnosisSession.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    // Get recent activity
    const recentActivity = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'firstName lastName email role');

    res.json({
      stats: {
        totalDoctors,
        totalPatients,
        totalDiagnoses,
        recentDiagnoses
      },
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Get all users (with filters)
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const query = {};

    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get profiles for each user
    const usersWithProfiles = await Promise.all(users.map(async (user) => {
      let profile = null;
      if (user.role === 'doctor') {
        profile = await DoctorProfile.findOne({ userId: user._id });
      } else if (user.role === 'patient') {
        profile = await PatientProfile.findOne({ userId: user._id });
      }
      return {
        ...user.toObject(),
        profile
      };
    }));

    res.json({
      users: usersWithProfiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get single user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id });
    } else if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
    }

    // Get user's diagnosis sessions if patient
    let diagnosisSessions = [];
    if (user.role === 'patient') {
      diagnosisSessions = await DiagnosisSession.find({ patientId: user._id })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({
      user: user.toObject(),
      profile,
      diagnosisSessions
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, profileData } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
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
      await PatientProfile.create({ 
        userId: user._id,
        ...profileData 
      });
    } else if (role === 'doctor') {
      await DoctorProfile.create({ 
        userId: user._id,
        ...profileData 
      });
    }

    // Log audit event
    await AuditLog.create({
      userId: req.user._id,
      action: 'USER_CREATED',
      details: `Admin created new ${role} account for ${email}`
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role, profileData } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from demoting themselves
    if (user._id.toString() === req.user._id.toString() && user.role === 'admin' && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot change your own admin role' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update basic user info
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    
    // Handle role change
    if (role && role !== user.role) {
      // Delete old profile
      if (user.role === 'doctor') {
        await DoctorProfile.findOneAndDelete({ userId: user._id });
      } else if (user.role === 'patient') {
        await PatientProfile.findOneAndDelete({ userId: user._id });
      }

      user.role = role;

      // Create new profile
      if (role === 'doctor') {
        await DoctorProfile.create({ userId: user._id, ...profileData });
      } else if (role === 'patient') {
        await PatientProfile.create({ userId: user._id, ...profileData });
      }
    } else {
      // Update existing profile
      if (profileData) {
        if (user.role === 'doctor') {
          await DoctorProfile.findOneAndUpdate(
            { userId: user._id },
            profileData,
            { upsert: true }
          );
        } else if (user.role === 'patient') {
          await PatientProfile.findOneAndUpdate(
            { userId: user._id },
            profileData,
            { upsert: true }
          );
        }
      }
    }

    await user.save();

    // Log audit event
    await AuditLog.create({
      userId: req.user._id,
      action: 'USER_UPDATED',
      details: `Admin updated user ${user.email}`
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Delete associated profile
    if (user.role === 'doctor') {
      await DoctorProfile.findOneAndDelete({ userId: user._id });
    } else if (user.role === 'patient') {
      await PatientProfile.findOneAndDelete({ userId: user._id });
      // Delete diagnosis sessions
      await DiagnosisSession.deleteMany({ patientId: user._id });
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    // Log audit event
    await AuditLog.create({
      userId: req.user._id,
      action: 'USER_DELETED',
      details: `Admin deleted user ${user.email} (${user.role})`
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Reset user password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Log audit event
    await AuditLog.create({
      userId: req.user._id,
      action: 'PASSWORD_RESET',
      details: `Admin reset password for user ${user.email}`
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Get all audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email role');

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

module.exports = router;

