const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

/**
 * Get today's date as a YYYY-MM-DD string (local server time).
 */
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Delete all slots whose date is before today.
 * For each past slot with a booking, mark the associated appointment as 'expired'
 * if it was still pending or confirmed (i.e. the appointment was missed).
 * The appointment record is preserved for history — only Slot and Booking are deleted.
 */
const cleanupPastSlots = async () => {
  const today = getTodayDateString();
  console.log(`[SlotService] Running cleanup — today is ${today}`);

  try {
    // Find all past slots (date is stored as a string "YYYY-MM-DD", so string comparison works)
    const pastSlots = await Slot.find({ date: { $lt: today } });

    if (pastSlots.length === 0) {
      console.log('[SlotService] No past slots to clean up.');
      return;
    }

    const pastSlotIds = pastSlots.map((s) => s._id);

    // Find bookings linked to these past slots
    const pastBookings = await Booking.find({ slotId: { $in: pastSlotIds } });
    const pastBookingIds = pastBookings.map((b) => b._id);

    // Mark associated appointments as 'expired' if they were still pending/confirmed
    if (pastBookingIds.length > 0) {
      const result = await Appointment.updateMany(
        {
          bookingId: { $in: pastBookingIds },
          status: { $in: ['pending', 'confirmed'] },
        },
        { $set: { status: 'expired' } }
      );
      console.log(`[SlotService] Marked ${result.modifiedCount} past appointments as expired.`);
    }

    // Delete the bookings and slots (appointment records stay for history)
    await Booking.deleteMany({ slotId: { $in: pastSlotIds } });
    await Slot.deleteMany({ _id: { $in: pastSlotIds } });

    console.log(`[SlotService] Cleaned up ${pastSlots.length} past slots and ${pastBookings.length} associated bookings.`);
  } catch (error) {
    console.error('[SlotService] Cleanup failed:', error.message);
  }
};

/**
 * For every active doctor, auto-generate today's appointment slots
 * if they don't already have any for today.
 * Default schedule: 9:00 AM – 5:00 PM, 1-hour intervals (8 slots).
 */
const autoGenerateTodaySlots = async () => {
  const today = getTodayDateString();

  try {
    // Find all active doctors
    const doctors = await Doctor.find({ isActive: true });

    if (doctors.length === 0) {
      console.log('[SlotService] No active doctors found.');
      return;
    }

    let totalGenerated = 0;

    for (const doctor of doctors) {
      // Check if this doctor already has slots for today
      const existingSlots = await Slot.countDocuments({
        doctorId: doctor._id,
        date: today,
      });

      if (existingSlots > 0) {
        continue; // Doctor already has slots for today (manual or previously generated)
      }

      // Generate default 1-hour slots from 9 AM to 5 PM
      const slotsToCreate = [];
      for (let hour = 9; hour < 17; hour++) {
        const formatTime = (h) => {
          const ampm = h >= 12 ? 'PM' : 'AM';
          let displayHour = h % 12;
          if (displayHour === 0) displayHour = 12;
          return `${displayHour}:00 ${ampm}`;
        };

        slotsToCreate.push({
          doctorId: doctor._id,
          date: today,
          startTime: formatTime(hour),
          endTime: formatTime(hour + 1),
          isBooked: false,
        });
      }

      await Slot.insertMany(slotsToCreate);
      totalGenerated += slotsToCreate.length;
    }

    console.log(`[SlotService] Auto-generated ${totalGenerated} slots for today (${today}) across ${doctors.length} doctors.`);
  } catch (error) {
    console.error('[SlotService] Auto-generation failed:', error.message);
  }
};

/**
 * Run the full daily maintenance: cleanup past slots, then generate today's.
 * Called on server startup and every 24 hours.
 */
const runDailySlotMaintenance = async () => {
  console.log('[SlotService] ========== Daily Slot Maintenance ==========');
  await cleanupPastSlots();
  await autoGenerateTodaySlots();
  console.log('[SlotService] ========== Maintenance Complete ==========');
};

module.exports = { cleanupPastSlots, autoGenerateTodaySlots, runDailySlotMaintenance };
