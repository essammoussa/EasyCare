const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');

// POST /api/records (doctor only)
// After an appointment, doctor creates a medical record (diagnosis, tests ordered, prescriptions)
const createRecord = async (req, res) => {
  try {
    const { appointmentId, patientId, doctorId, diagnosis, testsRequired, visitDate, prescriptions } = req.body;

    // Create main medical record
    const record = await MedicalRecord.create({
      appointmentId,
      patientId,
      doctorId,
      diagnosis,
      testsRequired, // e.g., "Blood test", "X-ray", etc
      visitDate,
    });

    // If doctor prescribed medicines, create prescription documents
    let createdPrescriptions = [];
    if (prescriptions && prescriptions.length > 0) {
      const prescriptionDocs = prescriptions.map((p) => ({
        appointmentId,
        patientId,
        medicineName: p.medicineName,
        dosageNotes: p.dosageNotes, // e.g., "1 tablet twice daily"
      }));
      createdPrescriptions = await Prescription.insertMany(prescriptionDocs);
    }

    res.status(201).json({ record, prescriptions: createdPrescriptions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/records/:patientId (auth)
// Fetch all medical records for a patient (sorted by most recent first)
const getPatientRecords = async (req, res) => {
  try {
    // Get records and populate related data
    const records = await MedicalRecord.find({ patientId: req.params.patientId })
      .populate('appointmentId')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' }, // Get doctor's actual name
      })
      .sort({ visitDate: -1, createdAt: -1 }); // Most recent first

    // For each record, also fetch associated prescriptions
    const recordsWithPrescriptions = await Promise.all(
      records.map(async (record) => {
        const prescriptions = record.appointmentId
          ? await Prescription.find({ appointmentId: record.appointmentId._id || record.appointmentId })
          : [];
        // Return record with prescriptions attached
        return { ...record.toObject(), prescriptions };
      })
    );

    res.status(200).json(recordsWithPrescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/prescriptions/:appointmentId (auth)
const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ appointmentId: req.params.appointmentId });
    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createRecord, getPatientRecords, getPrescriptions };
