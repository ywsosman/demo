const mongoose = require('mongoose');

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
    enum: ['pending', 'reviewed', 'closed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for faster queries
diagnosisSessionSchema.index({ patientId: 1, createdAt: -1 });
diagnosisSessionSchema.index({ status: 1 });

module.exports = mongoose.model('DiagnosisSession', diagnosisSessionSchema);

