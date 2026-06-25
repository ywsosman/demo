const mongoose = require('mongoose');
const { STATES } = require('../utils/diagnosisStateMachine');

const diagnosisSessionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  duration: {
    type: String,
    required: true
  },
  additionalInfo: {
    type: String,
    default: ''
  },
  aiPrediction: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  shapExplanation: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  limeExplanation: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  wordImportance: {
    type: Array,
    default: []
  },
  predictedDisease: {
    type: String,
    default: ''
  },
  icd10Code: { type: String, default: '' },
  icd10Display: { type: String, default: '' },
  currentRevisionNumber: { type: Number, default: 1 },
  doctorNotes: {
    type: String,
    default: ''
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: [
      'SUBMITTED',
      'AI_PROCESSED',
      'PENDING_DOCTOR_REVIEW',
      'IN_REVIEW',
      'NEEDS_MORE_INFO',
      'REVIEWED',
      'SOFT_DELETED',
      
      'pending',
      'reviewed',
      'closed'
    ],
    default: STATES.SUBMITTED
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  deliveredToPatient: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

diagnosisSessionSchema.index({ patientId: 1, createdAt: -1 });
diagnosisSessionSchema.index({ status: 1 });
diagnosisSessionSchema.index({ lockedBy: 1, lockedUntil: 1 });

module.exports = mongoose.model('DiagnosisSession', diagnosisSessionSchema);
