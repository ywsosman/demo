const express = require('express');
const db = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all patients (for doctors)
router.get('/patients', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const patients = await db.all(`
      SELECT u.id, u.firstName, u.lastName, u.email, u.createdAt,
             pp.age, pp.gender, pp.medicalHistory, pp.allergies,
             COUNT(ds.id) as sessionCount
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.userId
      LEFT JOIN diagnosis_sessions ds ON u.id = ds.patientId
      WHERE u.role = 'patient'
      GROUP BY u.id
      ORDER BY u.createdAt DESC
    `);

    res.json({ patients });
  } catch (error) {
    console.error('Patients fetch error:', error);
    res.status(500).json({ message: 'Server error fetching patients' });
  }
});

// Get specific patient details (for doctors)
router.get('/patients/:patientId', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await db.get(`
      SELECT u.id, u.firstName, u.lastName, u.email, u.createdAt,
             pp.age, pp.gender, pp.medicalHistory, pp.allergies, 
             pp.currentMedications, pp.emergencyContact
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.userId
      WHERE u.id = ? AND u.role = 'patient'
    `, [patientId]);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get patient's diagnosis sessions
    const sessions = await db.all(`
      SELECT ds.*, u.firstName as doctorFirstName, u.lastName as doctorLastName
      FROM diagnosis_sessions ds
      LEFT JOIN users u ON ds.doctorId = u.id
      WHERE ds.patientId = ?
      ORDER BY ds.createdAt DESC
    `, [patientId]);

    // Parse AI predictions
    const formattedSessions = sessions.map(session => ({
      ...session,
      aiPrediction: session.aiPrediction ? JSON.parse(session.aiPrediction) : null
    }));

    res.json({ 
      patient,
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

    const searchTerm = `%${q.trim()}%`;
    const patients = await db.all(`
      SELECT u.id, u.firstName, u.lastName, u.email, u.createdAt,
             pp.age, pp.gender
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.userId
      WHERE u.role = 'patient' 
        AND (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ?)
      ORDER BY u.firstName, u.lastName
      LIMIT 10
    `, [searchTerm, searchTerm, searchTerm]);

    res.json({ patients });
  } catch (error) {
    console.error('Patient search error:', error);
    res.status(500).json({ message: 'Server error searching patients' });
  }
});

// Get user activity logs
router.get('/activity/:userId?', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;
    const userRole = req.user.role;

    // If no userId specified, get current user's activity
    let targetUserId = userId || requestingUserId;

    // Authorization check - patients can only see their own activity
    if (userRole === 'patient' && targetUserId != requestingUserId) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const logs = await db.all(`
      SELECT al.*, u.firstName, u.lastName, u.email
      FROM audit_logs al
      JOIN users u ON al.userId = u.id
      WHERE al.userId = ?
      ORDER BY al.timestamp DESC
      LIMIT 50
    `, [targetUserId]);

    res.json({ logs });
  } catch (error) {
    console.error('Activity logs fetch error:', error);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
});

module.exports = router;
