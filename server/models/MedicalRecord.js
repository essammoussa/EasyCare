const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
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
  diagnosis: {
    type: String,
  },
  testsRequired: {
    type: String,
  },
  visitDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
