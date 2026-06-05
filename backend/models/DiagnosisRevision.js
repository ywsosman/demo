const mongoose = require('mongoose');

const diagnosisRevisionSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosisSession',
    required: true,
    index: true
  },
  revisionNumber: { type: Number, required: true },
  symptoms: { type: String, required: true },
  severity: { type: Number, min: 1, max: 10 },
  duration: { type: String, default: '' },
  additionalInfo: { type: String, default: '' },
  aiPrediction: { type: mongoose.Schema.Types.Mixed, default: null },
  confidence: { type: Number, min: 0, max: 1 },
  shapExplanation: { type: mongoose.Schema.Types.Mixed, default: null },
  limeExplanation: { type: mongoose.Schema.Types.Mixed, default: null },
  wordImportance: { type: Array, default: [] },
  predictedDisease: { type: String, default: '' },
  icd10Code: { type: String, default: '' },
  icd10Display: { type: String, default: '' }
}, {
  timestamps: true
});

diagnosisRevisionSchema.index({ sessionId: 1, revisionNumber: 1 }, { unique: true });

module.exports = mongoose.model('DiagnosisRevision', diagnosisRevisionSchema);
