const express = require('express');
const Joi = require('joi');
const db = require('../database/db');
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
    const patientId = req.user.id;

    // Get AI prediction
    const aiPrediction = await aiModel.predictDiagnosis({
      symptoms,
      severity,
      duration,
      additionalInfo
    });

    // Save diagnosis session
    const result = await db.run(
      `INSERT INTO diagnosis_sessions 
       (patientId, symptoms, severity, duration, additionalInfo, aiPrediction, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patientId, symptoms, severity, duration, additionalInfo, 
       JSON.stringify(aiPrediction.predictions), aiPrediction.confidence]
    );

    // Log audit event
    await db.run(
      'INSERT INTO audit_logs (userId, action, details) VALUES (?, ?, ?)',
      [patientId, 'DIAGNOSIS_SUBMITTED', `Session ID: ${result.id}`]
    );

    res.status(201).json({
      message: 'Diagnosis request submitted successfully',
      sessionId: result.id,
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
    const patientId = req.user.id;
    
    const sessions = await db.all(
      `SELECT ds.*, 
              u.firstName as doctorFirstName, 
              u.lastName as doctorLastName
       FROM diagnosis_sessions ds
       LEFT JOIN users u ON ds.doctorId = u.id
       WHERE ds.patientId = ?
       ORDER BY ds.createdAt DESC`,
      [patientId]
    );

    // Parse AI predictions
    const formattedSessions = sessions.map(session => ({
      ...session,
      aiPrediction: session.aiPrediction ? JSON.parse(session.aiPrediction) : null
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
    const sessions = await db.all(
      `SELECT ds.*, 
              u.firstName as patientFirstName, 
              u.lastName as patientLastName,
              u.email as patientEmail,
              pp.age, pp.gender, pp.medicalHistory, pp.allergies
       FROM diagnosis_sessions ds
       JOIN users u ON ds.patientId = u.id
       LEFT JOIN patient_profiles pp ON u.id = pp.userId
       WHERE ds.status = 'pending'
       ORDER BY ds.createdAt ASC`
    );

    // Parse AI predictions
    const formattedSessions = sessions.map(session => ({
      ...session,
      aiPrediction: session.aiPrediction ? JSON.parse(session.aiPrediction) : null
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
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT ds.*, 
             u.firstName as patientFirstName, 
             u.lastName as patientLastName,
             u.email as patientEmail,
             pp.age, pp.gender, pp.medicalHistory, pp.allergies,
             doctor.firstName as doctorFirstName,
             doctor.lastName as doctorLastName
      FROM diagnosis_sessions ds
      JOIN users u ON ds.patientId = u.id
      LEFT JOIN patient_profiles pp ON u.id = pp.userId
      LEFT JOIN users doctor ON ds.doctorId = doctor.id
      WHERE ds.id = ?
    `;

    // Add authorization check
    if (userRole === 'patient') {
      query += ' AND ds.patientId = ?';
    }

    const params = userRole === 'patient' ? [sessionId, userId] : [sessionId];
    const session = await db.get(query, params);

    if (!session) {
      return res.status(404).json({ message: 'Diagnosis session not found' });
    }

    // Parse AI prediction
    session.aiPrediction = session.aiPrediction ? JSON.parse(session.aiPrediction) : null;

    res.json({ session });
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
    const doctorId = req.user.id;

    await db.run(
      `UPDATE diagnosis_sessions 
       SET doctorNotes = ?, doctorId = ?, status = ?
       WHERE id = ?`,
      [doctorNotes, doctorId, status || 'reviewed', sessionId]
    );

    // Log audit event
    await db.run(
      'INSERT INTO audit_logs (userId, action, details) VALUES (?, ?, ?)',
      [doctorId, 'DIAGNOSIS_REVIEWED', `Session ID: ${sessionId}`]
    );

    res.json({ message: 'Diagnosis session updated successfully' });
  } catch (error) {
    console.error('Session update error:', error);
    res.status(500).json({ message: 'Server error updating diagnosis session' });
  }
});

// Get diagnosis statistics (for dashboard)
router.get('/stats/overview', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const stats = await Promise.all([
      db.get('SELECT COUNT(*) as total FROM diagnosis_sessions'),
      db.get('SELECT COUNT(*) as pending FROM diagnosis_sessions WHERE status = "pending"'),
      db.get('SELECT COUNT(*) as reviewed FROM diagnosis_sessions WHERE status = "reviewed"'),
      db.get('SELECT COUNT(*) as patients FROM users WHERE role = "patient"')
    ]);

    res.json({
      totalSessions: stats[0].total,
      pendingSessions: stats[1].pending,
      reviewedSessions: stats[2].reviewed,
      totalPatients: stats[3].patients
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

module.exports = router;
