const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      sparse: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCountPatient: {
      type: Number,
      default: 0,
    },
    unreadCountDoctor: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ patientId: 1, doctorId: 1, appointmentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Conversation', conversationSchema);
