const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const DiagnosisSession = require('../models/DiagnosisSession');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();


router.use(authMiddleware);
router.use(requireRole(['admin']));


router.get('/stats', async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDiagnoses = await DiagnosisSession.countDocuments();
    const recentDiagnoses = await DiagnosisSession.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    });

    
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


router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const query = {};

    
    if (role && role !== 'all') {
      query.role = role;
    }

    
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


router.post('/users', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, profileData } = req.body;

    
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    
    const hashedPassword = await bcrypt.hash(password, 12);

    
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName
    });

    
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


router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role, profileData } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    if (user._id.toString() === req.user._id.toString() && user.role === 'admin' && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot change your own admin role' });
    }

    
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    
    
    if (role && role !== user.role) {
      
      if (user.role === 'doctor') {
        await DoctorProfile.findOneAndDelete({ userId: user._id });
      } else if (user.role === 'patient') {
        await PatientProfile.findOneAndDelete({ userId: user._id });
      }

      user.role = role;

      
      if (role === 'doctor') {
        await DoctorProfile.create({ userId: user._id, ...profileData });
      } else if (role === 'patient') {
        await PatientProfile.create({ userId: user._id, ...profileData });
      }
    } else {
      
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


router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    
    if (user.role === 'doctor') {
      await DoctorProfile.findOneAndDelete({ userId: user._id });
    } else if (user.role === 'patient') {
      await PatientProfile.findOneAndDelete({ userId: user._id });
      
      await DiagnosisSession.deleteMany({ patientId: user._id });
    }

    
    await User.findByIdAndDelete(req.params.id);

    
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

    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    
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

