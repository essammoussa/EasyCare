const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  testName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'urgent'],
    default: 'pending',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LabResult', labResultSchema);
