const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor'); // Need Doctor to resolve the linked User._id for notifications
const User = require('../models/User'); // Need User to get patient name for notification

// POST /api/bookings (patient only)
// When a patient selects a time slot, this creates the booking and appointment
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { slotId, doctorId } = req.body;

    // Check that the slot exists and lock it within the transaction
    const slot = await Slot.findById(slotId).session(session);
    if (!slot) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Make sure the slot isn't already taken by another patient
    // The transaction ensures atomicity — no race condition possible
    if (slot.isBooked) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Slot is already booked' });
    }

    slot.isBooked = true;
    await slot.save({ session });

    const bookingDate = slot.date
      ? new Date(`${slot.date}T00:00:00.000`)
      : new Date();

    const booking = await Booking.create([{
      slotId,
      patientId: req.user._id,
      doctorId,
      bookedAt: bookingDate,
    }], { session });

    const appointment = await Appointment.create([{
      bookingId: booking[0]._id,
      patientId: req.user._id,
      doctorId,
      status: 'pending',
    }], { session });

    // --- TRIGGER NOTIFICATION ---
    // Notify the doctor about the new appointment.
    // `doctorId` here is the Doctor document's _id, but Notification.user must be a User._id
    // (that's what getNotifications matches against via req.user._id) — so we resolve the
    // Doctor's linked userId first, same pattern used in appointmentController.js.
    const patientUser = await User.findById(req.user._id).session(session);
    const doctorRecord = await Doctor.findById(doctorId).session(session);
    if (!doctorRecord) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Doctor not found' });
    }
    await Notification.create([{
      user: doctorRecord.userId,
      title: 'New Appointment Booked',
      message: `${patientUser.name} has booked a new appointment.`,
      type: 'appointment',
      relatedId: appointment[0]._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ booking: booking[0], appointment: appointment[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/bookings/user (auth)
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ patientId: req.user._id })
      .populate('slotId')
      .populate('doctorId');

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createBooking, getUserBookings };