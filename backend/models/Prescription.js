const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosisSession',
    required: true,
    index: true
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorReview',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medications: { type: String, default: '' },
  instructions: { type: String, default: '' },
  pdfPath: { type: String, default: '' },
  signedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
