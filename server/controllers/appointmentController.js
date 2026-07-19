const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');

// GET /api/appointments/user (auth)
// Returns appointments specific to the logged-in user (patient sees their appointments, doctors see their scheduled appointments)
const getUserAppointments = async (req, res) => {
  try {
    let query = {};

    // Role-based filtering - each user only sees their own relevant appointments
    if (req.user.role === 'patient') {
      query = { patientId: req.user._id };
    } else if (req.user.role === 'doctor') {
      // For doctors, need to find their Doctor record first (different from User)
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      query = { doctorId: doctor._id };
    }

    // Populate related data - patient info, doctor info, and booking/slot details
    // This gives us all the info we need to display appointment on frontend
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email profilePicture phone')
      .populate({
        path: 'doctorId',
        select: 'specialty clinic userId',
        populate: { path: 'userId', select: 'name email profilePicture' } // Get doctor's actual name from User collection
      })
      .populate({
        path: 'bookingId',
        populate: { path: 'slotId' } // Get slot details (date, time)
      });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/appointments/:id/status (doctor or patient)
// Patients can only cancel their own appointments
// Doctors can update status on their own appointments
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Patient-specific restrictions
    if (req.user.role === 'patient') {
      // Patients can only cancel, not change to other statuses
      if (status !== 'cancelled') {
        return res.status(403).json({ message: 'Patients can only cancel appointments' });
      }
      // Patients can only cancel their own appointments
      if (appointment.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only cancel your own appointments' });
      }
    }

    // Doctor-specific restrictions
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own appointments' });
      }
    }

    appointment.status = status;
    await appointment.save();

    // Release the booking slot if cancelled
    if (status === 'cancelled') {
      try {
        const Booking = require('../models/Booking');
        const Slot = require('../models/Slot');
        const booking = await Booking.findById(appointment.bookingId);
        if (booking) {
          await Slot.findByIdAndUpdate(booking.slotId, { isBooked: false });
        }
      } catch (slotErr) {
        console.error('Failed to release slot on cancel:', slotErr);
      }
    }

    // Trigger Notification
    try {
      if (req.user.role === 'doctor') {
        await Notification.create({
          user: appointment.patientId,
          title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your appointment has been marked as ${status} by the provider.`,
          type: 'appointment',
          isRead: false
        });
      } else if (req.user.role === 'patient' && status === 'cancelled') {
        const docRecord = await Doctor.findById(appointment.doctorId);
        if (docRecord) {
          await Notification.create({
            user: docRecord.userId,
            title: 'Appointment Cancelled',
            message: `Patient ${req.user.name} has cancelled their appointment.`,
            type: 'appointment',
            isRead: false
          });
        }
      }
    } catch (err) {
      console.error('Failed to create notification on status change:', err);
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/appointments/:id (doctor or patient — completed or cancelled only)
// Permanently removes a completed or cancelled appointment from the system
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only completed or cancelled appointments can be deleted
    if (!['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Only completed or cancelled appointments can be deleted' });
    }

    // Patient can only delete their own cancelled appointments
    if (req.user.role === 'patient') {
      if (appointment.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only delete your own appointments' });
      }
    }

    // Doctor can only delete appointments in their schedule
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'You can only delete your own appointments' });
      }
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getUserAppointments, updateAppointmentStatus, deleteAppointment };
