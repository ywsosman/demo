const express = require('express');
const Joi = require('joi');
const DiagnosisSession = require('../models/DiagnosisSession');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const { authMiddleware, requireRole } = require('../middleware/auth');
const aiModel = require('../models/aiModel');

const router = express.Router();

// Validation schemas
const diagnosisSchema = Joi.object({
  symptoms: Joi.string().min(5).max(1000).required(),
  severity: Joi.number().integer().min(1).max(10).required(),
  duration: Joi.string().max(100).required(),
  additionalInfo: Joi.string().max(500).allow('')
});

// Submit new diagnosis request
router.post('/submit', authMiddleware, requireRole(['patient']), async (req, res) => {
  try {
    // Validate input
    const { error, value } = diagnosisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { symptoms, severity, duration, additionalInfo } = value;
    const patientId = req.user._id;

    // Get AI prediction
    const aiPrediction = await aiModel.predictDiagnosis({
      symptoms,
      severity,
      duration,
      additionalInfo
    });

    // Save diagnosis session
    const session = await DiagnosisSession.create({
      patientId,
      symptoms,
      severity,
      duration,
      additionalInfo,
      aiPrediction: aiPrediction.predictions,
      confidence: aiPrediction.confidence
    });

    // Log audit event
    await AuditLog.create({
      userId: patientId,
      action: 'DIAGNOSIS_SUBMITTED',
      details: `Session ID: ${session._id}`
    });

    res.status(201).json({
      message: 'Diagnosis request submitted successfully',
      sessionId: session._id,
      aiPrediction: aiPrediction
    });
  } catch (error) {
    console.error('Diagnosis submission error:', error);
    res.status(500).json({ message: 'Server error during diagnosis submission' });
  }
});

// Get patient's diagnosis history
router.get('/history', authMiddleware, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user._id;
    
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

    res.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Server error fetching diagnosis history' });
  }
});

// Get all pending diagnosis sessions (for doctors)
router.get('/pending', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const sessions = await DiagnosisSession.find({ status: 'pending' })
      .populate('patientId', 'firstName lastName email')
      .sort({ createdAt: 1 })
      .lean();

    // Get patient profiles
    const formattedSessions = await Promise.all(sessions.map(async (session) => {
      const patientProfile = await PatientProfile.findOne({ userId: session.patientId._id }).lean();
      
      return {
        ...session,
        id: session._id,
        patientFirstName: session.patientId?.firstName,
        patientLastName: session.patientId?.lastName,
        patientEmail: session.patientId?.email,
        age: patientProfile?.age,
        gender: patientProfile?.gender,
        medicalHistory: patientProfile?.medicalHistory,
        allergies: patientProfile?.allergies
      };
    }));

    res.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Pending sessions fetch error:', error);
    res.status(500).json({ message: 'Server error fetching pending sessions' });
  }
});

// Get specific diagnosis session
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = { _id: sessionId };

    // Add authorization check
    if (userRole === 'patient') {
      query.patientId = userId;
    }

    const session = await DiagnosisSession.findOne(query)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName')
      .lean();

    if (!session) {
      return res.status(404).json({ message: 'Diagnosis session not found' });
    }

    // Get patient profile
    const patientProfile = await PatientProfile.findOne({ userId: session.patientId._id }).lean();

    const formattedSession = {
      ...session,
      id: session._id,
      patientFirstName: session.patientId?.firstName,
      patientLastName: session.patientId?.lastName,
      patientEmail: session.patientId?.email,
      doctorFirstName: session.doctorId?.firstName,
      doctorLastName: session.doctorId?.lastName,
      age: patientProfile?.age,
      gender: patientProfile?.gender,
      medicalHistory: patientProfile?.medicalHistory,
      allergies: patientProfile?.allergies
    };

    res.json({ session: formattedSession });
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ message: 'Server error fetching diagnosis session' });
  }
});

// Update diagnosis session (doctor review)
router.put('/:sessionId/review', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { doctorNotes, status } = req.body;
    const doctorId = req.user._id;

    await DiagnosisSession.findByIdAndUpdate(
      sessionId,
      {
        doctorNotes,
        doctorId,
        status: status || 'reviewed'
      }
    );

    // Log audit event
    await AuditLog.create({
      userId: doctorId,
      action: 'DIAGNOSIS_REVIEWED',
      details: `Session ID: ${sessionId}`
    });

    res.json({ message: 'Diagnosis session updated successfully' });
  } catch (error) {
    console.error('Session update error:', error);
    res.status(500).json({ message: 'Server error updating diagnosis session' });
  }
});

// Get diagnosis statistics (for dashboard)
router.get('/stats/overview', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const [totalSessions, pendingSessions, reviewedSessions, totalPatients] = await Promise.all([
      DiagnosisSession.countDocuments(),
      DiagnosisSession.countDocuments({ status: 'pending' }),
      DiagnosisSession.countDocuments({ status: 'reviewed' }),
      User.countDocuments({ role: 'patient' })
    ]);

    res.json({
      totalSessions,
      pendingSessions,
      reviewedSessions,
      totalPatients
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

module.exports = router;
