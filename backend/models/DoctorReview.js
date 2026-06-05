const mongoose = require('mongoose');

const doctorReviewSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosisSession',
    required: true,
    index: true
  },
  revisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosisRevision',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: { type: String, default: '' },
  finalDiagnosis: { type: String, default: '' },
  agreedWithAi: { type: Boolean, default: null },
  outcome: {
    type: String,
    enum: ['confirmed', 'overridden', 'needs_more_info'],
    default: 'confirmed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DoctorReview', doctorReviewSchema);
