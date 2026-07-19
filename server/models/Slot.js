const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  date: {
    type: String,
    required: true,
    default: () => new Date().toISOString().slice(0, 10),
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Slot', slotSchema);
