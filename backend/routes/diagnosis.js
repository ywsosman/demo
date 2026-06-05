const express = require('express');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const DiagnosisSession = require('../models/DiagnosisSession');
const DiagnosisRevision = require('../models/DiagnosisRevision');
const DoctorReview = require('../models/DoctorReview');
const Prescription = require('../models/Prescription');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const { authMiddleware, requireRole } = require('../middleware/auth');
const aiModel = require('../models/aiModel');
const {
  STATES,
  LOCK_DURATION_MS,
  normalizeStatus,
  assertTransition,
  isDoctorQueueStatus
} = require('../utils/diagnosisStateMachine');
const { lookupIcd10 } = require('../utils/icd10');
const { generatePrescriptionPdf } = require('../utils/prescriptionPdf');
const notificationService = require('../services/notificationService');

const router = express.Router();

const VOCAB_PATH = path.join(__dirname, '..', 'symptom_vocabulary.json');
let symptomVocabulary = null;
try {
  symptomVocabulary = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
} catch (err) {
  console.warn('Could not load symptom vocabulary:', err.message);
}

const diagnosisSchema = Joi.object({
  symptoms: Joi.string().max(1000).allow('').default(''),
  selectedSymptoms: Joi.array().items(Joi.string().max(100)).max(20).default([]),
  severity: Joi.number().integer().min(1).max(10).required(),
  duration: Joi.string().max(100).required(),
  additionalInfo: Joi.string().max(500).allow('')
}).custom((value, helpers) => {
  if ((!value.symptoms || value.symptoms.trim().length < 3) &&
      (!value.selectedSymptoms || value.selectedSymptoms.length === 0)) {
    return helpers.error('any.custom', {
      message: 'Please provide symptoms via the dropdown or text description'
    });
  }
  return value;
});

const reviewSchema = Joi.object({
  doctorNotes: Joi.string().max(2000).allow(''),
  finalDiagnosis: Joi.string().max(200).allow(''),
  agreedWithAi: Joi.boolean(),
  outcome: Joi.string().valid('confirmed', 'overridden', 'needs_more_info'),
  action: Joi.string().valid('finalize', 'needs_more_info'),
  medications: Joi.string().max(1000).allow(''),
  instructions: Joi.string().max(1000).allow('')
});

async function enrichSession(session) {
  const s = session.toObject ? session.toObject() : { ...session };
  s.id = s._id;
  s.status = normalizeStatus(s.status);
  if (s.patientId && typeof s.patientId === 'object') {
    s.patientFirstName = s.patientId.firstName;
    s.patientLastName = s.patientId.lastName;
    s.patientEmail = s.patientId.email;
    const profile = await PatientProfile.findOne({ userId: s.patientId._id }).lean();
    if (profile) {
      s.age = profile.age;
      s.gender = profile.gender;
      s.medicalHistory = profile.medicalHistory;
      s.allergies = profile.allergies;
    }
  }
  if (s.doctorId && typeof s.doctorId === 'object') {
    s.doctorFirstName = s.doctorId.firstName;
    s.doctorLastName = s.doctorId.lastName;
  }
  const revisions = await DiagnosisRevision.find({ sessionId: s._id })
    .sort({ revisionNumber: 1 })
    .lean();
  s.revisions = revisions;
  return s;
}

function buildRevisionPayload(aiPrediction, symptomText, value) {
  const top = aiPrediction.predictedDisease || '';
  const icd = lookupIcd10(top);
  return {
    symptoms: symptomText,
    severity: value.severity,
    duration: value.duration,
    additionalInfo: value.additionalInfo || '',
    aiPrediction: aiPrediction.predictions,
    confidence: aiPrediction.confidence,
    shapExplanation: aiPrediction.shapExplanation,
    limeExplanation: aiPrediction.limeExplanation || null,
    wordImportance: aiPrediction.wordImportance,
    predictedDisease: top,
    icd10Code: icd.code,
    icd10Display: icd.display
  };
}

function isLockActive(session) {
  return session.lockedUntil && new Date(session.lockedUntil) > new Date();
}

/**
 * Resolve the revision a doctor is reviewing. Backfills from session data for
 * legacy sessions created before DiagnosisRevision records existed.
 */
async function ensureLatestRevision(session) {
  const revNum = session.currentRevisionNumber || 1;

  let revision = await DiagnosisRevision.findOne({
    sessionId: session._id,
    revisionNumber: revNum
  });

  if (!revision) {
    revision = await DiagnosisRevision.findOne({ sessionId: session._id })
      .sort({ revisionNumber: -1 });
  }

  if (!revision) {
    const icd = lookupIcd10(session.predictedDisease || '');
    revision = await DiagnosisRevision.create({
      sessionId: session._id,
      revisionNumber: revNum,
      symptoms: session.symptoms,
      severity: session.severity,
      duration: session.duration || '',
      additionalInfo: session.additionalInfo || '',
      aiPrediction: session.aiPrediction,
      confidence: session.confidence,
      shapExplanation: session.shapExplanation,
      limeExplanation: session.limeExplanation || null,
      wordImportance: session.wordImportance || [],
      predictedDisease: session.predictedDisease || '',
      icd10Code: session.icd10Code || icd.code,
      icd10Display: session.icd10Display || icd.display
    });

    if (!session.currentRevisionNumber) {
      session.currentRevisionNumber = revNum;
      await session.save();
    }
  }

  return revision;
}

router.get('/symptoms', (req, res) => {
  if (!symptomVocabulary) {
    return res.status(503).json({ message: 'Symptom vocabulary not available' });
  }
  res.json({
    symptoms: symptomVocabulary.symptoms,
    diseases: symptomVocabulary.diseases
  });
});

router.post('/submit', authMiddleware, requireRole(['patient']), async (req, res) => {
  try {
    const { error, value } = diagnosisSchema.validate(req.body);
    if (error) {
      const msg = error.details?.[0]?.message || error.message || 'Validation failed';
      return res.status(400).json({ message: msg });
    }

    const { symptoms, selectedSymptoms, severity, duration, additionalInfo } = value;
    const patientId = req.user._id;
    const symptomText = symptoms || (selectedSymptoms || []).join(', ');

    const session = await DiagnosisSession.create({
      patientId,
      symptoms: symptomText,
      severity,
      duration,
      additionalInfo,
      status: STATES.SUBMITTED
    });

    const aiPrediction = await aiModel.predictDiagnosis({
      symptoms,
      selectedSymptoms,
      severity,
      duration,
      additionalInfo
    });

    const revPayload = buildRevisionPayload(aiPrediction, symptomText, value);
    const icd = lookupIcd10(revPayload.predictedDisease);

    await DiagnosisRevision.create({
      sessionId: session._id,
      revisionNumber: 1,
      ...revPayload
    });

    session.status = STATES.AI_PROCESSED;
    await session.save();

    const transition = assertTransition(STATES.AI_PROCESSED, STATES.PENDING_DOCTOR_REVIEW);
    if (!transition.ok) {
      return res.status(500).json({ message: transition.message });
    }

    Object.assign(session, {
      status: STATES.PENDING_DOCTOR_REVIEW,
      aiPrediction: revPayload.aiPrediction,
      confidence: revPayload.confidence,
      shapExplanation: revPayload.shapExplanation,
      limeExplanation: revPayload.limeExplanation,
      wordImportance: revPayload.wordImportance,
      predictedDisease: revPayload.predictedDisease,
      icd10Code: icd.code,
      icd10Display: icd.display,
      currentRevisionNumber: 1
    });
    await session.save();

    await AuditLog.create({
      userId: patientId,
      action: 'DIAGNOSIS_SUBMITTED',
      details: `Session ${session._id} → ${STATES.PENDING_DOCTOR_REVIEW}`
    });

    await notificationService.notifyUser({
      userId: patientId,
      sessionId: session._id,
      title: 'Symptoms submitted',
      message: 'Your case is queued for physician review. You will be notified when reviewed.',
      channels: ['in_app', 'email']
    });

    res.status(201).json({
      message: 'Diagnosis submitted. Awaiting physician review before results are finalized.',
      sessionId: session._id,
      status: session.status,
      deliveredToPatient: false
    });
  } catch (err) {
    console.error('Diagnosis submission error:', err);
    res.status(500).json({ message: 'Server error during diagnosis submission' });
  }
});

router.post('/:sessionId/resubmit', authMiddleware, requireRole(['patient']), async (req, res) => {
  try {
    const { error, value } = diagnosisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details?.[0]?.message || 'Validation failed' });
    }

    const session = await DiagnosisSession.findOne({
      _id: req.params.sessionId,
      patientId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const status = normalizeStatus(session.status);
    if (status !== STATES.NEEDS_MORE_INFO) {
      return res.status(400).json({
        message: 'Additional information can only be submitted when status is NEEDS_MORE_INFO'
      });
    }

    const symptomText = value.symptoms || (value.selectedSymptoms || []).join(', ');
    const aiPrediction = await aiModel.predictDiagnosis({
      symptoms: value.symptoms,
      selectedSymptoms: value.selectedSymptoms,
      severity: value.severity,
      duration: value.duration,
      additionalInfo: value.additionalInfo
    });

    const nextRev = session.currentRevisionNumber + 1;
    const revPayload = buildRevisionPayload(aiPrediction, symptomText, value);
    const icd = lookupIcd10(revPayload.predictedDisease);

    await DiagnosisRevision.create({
      sessionId: session._id,
      revisionNumber: nextRev,
      ...revPayload
    });

    Object.assign(session, {
      symptoms: symptomText,
      severity: value.severity,
      duration: value.duration,
      additionalInfo: value.additionalInfo || '',
      status: STATES.PENDING_DOCTOR_REVIEW,
      currentRevisionNumber: nextRev,
      lockedBy: null,
      lockedUntil: null,
      ...revPayload,
      icd10Code: icd.code,
      icd10Display: icd.display
    });
    await session.save();

    await notificationService.notifyUser({
      userId: req.user._id,
      sessionId: session._id,
      title: 'Updated symptoms received',
      message: 'Your updated information has been sent for physician review.',
      channels: ['in_app']
    });

    res.json({ message: 'Revision submitted', session: await enrichSession(session) });
  } catch (err) {
    console.error('Resubmit error:', err);
    res.status(500).json({ message: 'Server error during resubmission' });
  }
});

router.post('/:sessionId/lock', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const session = await DiagnosisSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const status = normalizeStatus(session.status);
    if (![STATES.PENDING_DOCTOR_REVIEW, STATES.NEEDS_MORE_INFO].includes(status)) {
      return res.status(400).json({
        message: `Cannot acquire lock from status ${status}`
      });
    }

    if (isLockActive(session) && String(session.lockedBy) !== String(req.user._id)) {
      return res.status(409).json({
        message: 'Session is locked by another physician',
        lockedUntil: session.lockedUntil
      });
    }

    const t = assertTransition(status, STATES.IN_REVIEW);
    if (!t.ok) {
      return res.status(400).json({ message: t.message });
    }

    session.status = STATES.IN_REVIEW;
    session.lockedBy = req.user._id;
    session.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    session.doctorId = req.user._id;
    await session.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'REVIEW_LOCK_ACQUIRED',
      details: `Session ${session._id} until ${session.lockedUntil.toISOString()}`
    });

    res.json({
      message: 'Review lock acquired (24h)',
      session: await enrichSession(session)
    });
  } catch (err) {
    console.error('Lock error:', err);
    res.status(500).json({ message: 'Server error acquiring lock' });
  }
});

router.post('/:sessionId/unlock', authMiddleware, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const session = await DiagnosisSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && String(session.lockedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only lock owner or admin can release lock' });
    }

    session.lockedBy = null;
    session.lockedUntil = null;
    if (normalizeStatus(session.status) === STATES.IN_REVIEW) {
      session.status = STATES.PENDING_DOCTOR_REVIEW;
    }
    await session.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'REVIEW_LOCK_RELEASED',
      details: `Session ${session._id}`
    });

    res.json({ message: 'Lock released', session: await enrichSession(session) });
  } catch (err) {
    res.status(500).json({ message: 'Server error releasing lock' });
  }
});

router.put('/:sessionId/review', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const { error, value } = reviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details?.[0]?.message });
    }

    const session = await DiagnosisSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const status = normalizeStatus(session.status);
    if (status !== STATES.IN_REVIEW) {
      return res.status(400).json({
        message: 'Session must be IN_REVIEW. Acquire a lock first via POST /lock.'
      });
    }

    if (!isLockActive(session) || String(session.lockedBy) !== String(req.user._id)) {
      return res.status(409).json({ message: 'You do not hold an active lock on this session' });
    }

    const latestRevision = await ensureLatestRevision(session);

    const action = value.action || (value.outcome === 'needs_more_info' ? 'needs_more_info' : 'finalize');
    let targetStatus = STATES.REVIEWED;

    if (action === 'needs_more_info') {
      targetStatus = STATES.NEEDS_MORE_INFO;
    }

    const t = assertTransition(status, targetStatus);
    if (!t.ok) {
      return res.status(400).json({ message: t.message });
    }

    const review = await DoctorReview.create({
      sessionId: session._id,
      revisionId: latestRevision._id,
      doctorId: req.user._id,
      notes: value.doctorNotes || '',
      finalDiagnosis: value.finalDiagnosis || session.predictedDisease,
      agreedWithAi: value.agreedWithAi,
      outcome: value.outcome || (action === 'needs_more_info' ? 'needs_more_info' : 'confirmed')
    });

    let prescription = null;
    if (targetStatus === STATES.REVIEWED) {
      const patient = await User.findById(session.patientId).lean();
      const doctor = req.user;
      const pdf = await generatePrescriptionPdf({
        sessionId: session._id,
        patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim(),
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        finalDiagnosis: review.finalDiagnosis,
        medications: value.medications,
        instructions: value.instructions,
        icd10Code: session.icd10Code,
        icd10Display: session.icd10Display
      });

      prescription = await Prescription.create({
        sessionId: session._id,
        reviewId: review._id,
        doctorId: req.user._id,
        medications: value.medications || '',
        instructions: value.instructions || '',
        pdfPath: pdf.filePath
      });

      session.deliveredToPatient = true;
      await notificationService.notifyUser({
        userId: session.patientId,
        sessionId: session._id,
        title: 'Diagnosis reviewed',
        message: 'Your physician has completed the review. View results and prescription in your history.',
        channels: ['in_app', 'email', 'sms']
      });
    } else {
      await notificationService.notifyUser({
        userId: session.patientId,
        sessionId: session._id,
        title: 'More information needed',
        message: 'Your doctor has requested additional symptom details. Please update your submission.',
        channels: ['in_app', 'email']
      });
    }

    session.status = targetStatus;
    session.doctorNotes = value.doctorNotes || '';
    session.doctorId = req.user._id;
    session.lockedBy = null;
    session.lockedUntil = null;
    await session.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'DIAGNOSIS_REVIEWED',
      details: `Session ${session._id} → ${targetStatus}`
    });

    res.json({
      message: targetStatus === STATES.REVIEWED
        ? 'Diagnosis finalized and delivered to patient'
        : 'Requested additional information from patient',
      session: await enrichSession(session),
      review,
      prescriptionId: prescription?._id
    });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ message: 'Server error updating diagnosis session' });
  }
});

router.get('/:sessionId/prescription/pdf', authMiddleware, async (req, res) => {
  try {
    const session = await DiagnosisSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const isPatient = req.user.role === 'patient' && String(session.patientId) === String(req.user._id);
    const isStaff = ['doctor', 'admin'].includes(req.user.role);
    if (!isPatient && !isStaff) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (normalizeStatus(session.status) !== STATES.REVIEWED) {
      return res.status(400).json({ message: 'Prescription available after physician review' });
    }

    const prescription = await Prescription.findOne({ sessionId: session._id })
      .sort({ createdAt: -1 });

    if (!prescription?.pdfPath || !fs.existsSync(prescription.pdfPath)) {
      return res.status(404).json({ message: 'Prescription PDF not found' });
    }

    res.download(prescription.pdfPath, `prescription_${session._id}.pdf`);
  } catch (err) {
    res.status(500).json({ message: 'Error downloading prescription' });
  }
});

router.get('/:sessionId/revisions', authMiddleware, async (req, res) => {
  try {
    const session = await DiagnosisSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (req.user.role === 'patient' && String(session.patientId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const revisions = await DiagnosisRevision.find({ sessionId: session._id })
      .sort({ revisionNumber: 1 })
      .lean();

    res.json({ revisions });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching revisions' });
  }
});

router.get('/history', authMiddleware, requireRole(['patient']), async (req, res) => {
  try {
    const sessions = await DiagnosisSession.find({ patientId: req.user._id })
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = await Promise.all(sessions.map(async (s) => {
      const row = await enrichSession(s);
      if (!row.deliveredToPatient && !['REVIEWED', 'SOFT_DELETED'].includes(normalizeStatus(row.status))) {
        row.aiPrediction = null;
        row.wordImportance = [];
        row.shapExplanation = null;
      }
      return row;
    }));

    res.json({ sessions: formatted });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching diagnosis history' });
  }
});

router.get('/pending', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const sessions = await DiagnosisSession.find({
      status: { $in: [STATES.PENDING_DOCTOR_REVIEW, STATES.NEEDS_MORE_INFO, 'pending'] }
    })
      .populate('patientId', 'firstName lastName email')
      .sort({ createdAt: 1 })
      .lean();

    const formatted = await Promise.all(sessions.map((s) => enrichSession(s)));
    res.json({ sessions: formatted });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching pending sessions' });
  }
});

router.get('/in-review', authMiddleware, requireRole(['doctor']), async (req, res) => {
  try {
    const sessions = await DiagnosisSession.find({
      status: { $in: [STATES.IN_REVIEW, STATES.PENDING_DOCTOR_REVIEW, STATES.NEEDS_MORE_INFO] }
    })
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = await Promise.all(sessions.map((s) => enrichSession(s)));
    res.json({ sessions: formatted });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all', authMiddleware, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const sessions = await DiagnosisSession.find({})
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = await Promise.all(sessions.map((s) => enrichSession(s)));
    res.json({ sessions: formatted });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching sessions' });
  }
});

router.get('/stats/overview', authMiddleware, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const queueStatuses = [
      STATES.PENDING_DOCTOR_REVIEW,
      STATES.IN_REVIEW,
      STATES.NEEDS_MORE_INFO,
      'pending'
    ];
    const [totalSessions, pendingSessions, reviewedSessions, totalPatients] = await Promise.all([
      DiagnosisSession.countDocuments({ status: { $ne: STATES.SOFT_DELETED } }),
      DiagnosisSession.countDocuments({ status: { $in: queueStatuses } }),
      DiagnosisSession.countDocuments({
        status: { $in: [STATES.REVIEWED, 'reviewed'] }
      }),
      User.countDocuments({ role: 'patient' })
    ]);

    res.json({ totalSessions, pendingSessions, reviewedSessions, totalPatients });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    let query = { _id: req.params.sessionId };
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    }

    const session = await DiagnosisSession.findOne(query)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName');

    if (!session) {
      return res.status(404).json({ message: 'Diagnosis session not found' });
    }

    const formatted = await enrichSession(session);
    if (
      req.user.role === 'patient' &&
      !formatted.deliveredToPatient &&
      normalizeStatus(formatted.status) !== STATES.REVIEWED
    ) {
      formatted.aiPrediction = null;
      formatted.wordImportance = [];
      formatted.shapExplanation = null;
      formatted.limeExplanation = null;
    }

    res.json({ session: formatted });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching diagnosis session' });
  }
});

router.delete('/:sessionId', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const session = await DiagnosisSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.status = STATES.SOFT_DELETED;
    await session.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'SESSION_SOFT_DELETED',
      details: `Session ${session._id}`
    });

    res.json({ message: 'Session archived', session: await enrichSession(session) });
  } catch (err) {
    res.status(500).json({ message: 'Server error archiving session' });
  }
});

module.exports = router;
