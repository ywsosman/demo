const express = require('express');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DiagnosisSession = require('../models/DiagnosisSession');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all patients (for doctors)
router.get('/patients', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get patient profiles and session counts
    const patientsWithDetails = await Promise.all(patients.map(async (patient) => {
      const profile = await PatientProfile.findOne({ userId: patient._id }).lean();
      const sessionCount = await DiagnosisSession.countDocuments({ patientId: patient._id });
      
      return {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        createdAt: patient.createdAt,
        age: profile?.age,
        gender: profile?.gender,
        medicalHistory: profile?.medicalHistory,
        allergies: profile?.allergies,
        sessionCount
      };
    }));

    res.json({ patients: patientsWithDetails });
  } catch (error) {
    console.error('Patients fetch error:', error);
    res.status(500).json({ message: 'Server error fetching patients' });
  }
});

// Get specific patient details (for doctors)
router.get('/patients/:patientId', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findOne({ _id: patientId, role: 'patient' })
      .select('firstName lastName email createdAt')
      .lean();

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const profile = await PatientProfile.findOne({ userId: patientId }).lean();

    // Get patient's diagnosis sessions
    const sessions = await DiagnosisSession.find({ patientId })
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    // Format sessions
    const formattedSessions = sessions.map(session => ({
      ...session,
      id: session._id,
      doctorFirstName: session.doctorId?.firstName,
      doctorLastName: session.doctorId?.lastName
    }));

    res.json({ 
      patient: {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        createdAt: patient.createdAt,
        age: profile?.age,
        gender: profile?.gender,
        medicalHistory: profile?.medicalHistory,
        allergies: profile?.allergies,
        currentMedications: profile?.currentMedications,
        emergencyContact: profile?.emergencyContact
      },
      sessions: formattedSessions
    });
  } catch (error) {
    console.error('Patient details fetch error:', error);
    res.status(500).json({ message: 'Server error fetching patient details' });
  }
});

// Search patients by name or email (for doctors)
router.get('/search/patients', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i');

    const patients = await User.find({ 
      role: 'patient',
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    })
      .select('firstName lastName email createdAt')
      .limit(10)
      .lean();

    // Get patient profiles
    const patientsWithProfiles = await Promise.all(patients.map(async (patient) => {
      const profile = await PatientProfile.findOne({ userId: patient._id }).lean();
      
      return {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        createdAt: patient.createdAt,
        age: profile?.age,
        gender: profile?.gender
      };
    }));

    res.json({ patients: patientsWithProfiles });
  } catch (error) {
    console.error('Patient search error:', error);
    res.status(500).json({ message: 'Server error searching patients' });
  }
});

// Get user activity logs
router.get('/activity/:userId?', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user._id;
    const userRole = req.user.role;

    // If no userId specified, get current user's activity
    let targetUserId = userId || requestingUserId;

    // Authorization check - patients can only see their own activity
    if (userRole === 'patient' && targetUserId.toString() !== requestingUserId.toString()) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const logs = await AuditLog.find({ userId: targetUserId })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Format logs
    const formattedLogs = logs.map(log => ({
      ...log,
      id: log._id,
      firstName: log.userId?.firstName,
      lastName: log.userId?.lastName,
      email: log.userId?.email,
      timestamp: log.createdAt
    }));

    res.json({ logs: formattedLogs });
  } catch (error) {
    console.error('Activity logs fetch error:', error);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
});

module.exports = router;
