const LabResult = require('../models/LabResult');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const multer = require('multer');
const path = require('path');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// POST /api/results/upload (patient only)
const uploadResult = async (req, res) => {
  try {
    const { recordId, doctorId, testName } = req.body;

    const result = await LabResult.create({
      recordId,
      patientId: req.user._id,
      doctorId,
      testName,
      fileUrl: req.file ? `uploads/${req.file.filename}` : '',
      status: 'pending',
    });

    // Notify doctor
    try {
      const docRecord = await Doctor.findById(doctorId);
      if (docRecord) {
        await Notification.create({
          user: docRecord.userId,
          title: 'New Lab Result Uploaded',
          message: `Patient ${req.user.name} has uploaded a new lab result: ${testName}.`,
          type: 'result',
          isRead: false
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify doctor on result upload:', notifErr);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/results/doctor/all (doctor only)
const getDoctorResults = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const results = await LabResult.find({ doctorId: doctor._id })
      .populate('patientId', 'name email profilePicture')
      .populate('recordId')
      .sort({ uploadedAt: -1 });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/results/:id/status (doctor only)
const updateResultStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'reviewed', 'urgent'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const result = await LabResult.findOneAndUpdate(
      { _id: req.params.id, doctorId: doctor._id },
      { status },
      { new: true }
    ).populate('patientId', 'name email profilePicture');

    if (!result) {
      return res.status(404).json({ message: 'Lab result not found' });
    }

    // Notify patient
    try {
      await Notification.create({
        user: result.patientId,
        title: 'Lab Result Reviewed',
        message: `Your lab result "${result.testName}" has been reviewed by your provider and marked as ${status}.`,
        type: 'result',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Failed to notify patient on result status update:', notifErr);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/results/:patientId (auth)
const getPatientResults = async (req, res) => {
  try {
    const results = await LabResult.find({ patientId: req.params.patientId })
      .populate('recordId')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
      })
      .sort({ uploadedAt: -1 });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/results/:id (patient only)
const deleteResult = async (req, res) => {
  try {
    const result = await LabResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Lab result not found' });
    }

    if (result.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this result' });
    }

    // Delete the physical file from disk if it exists
    if (result.fileUrl) {
      const fs = require('fs');
      const filePath = path.join(__dirname, '..', result.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await LabResult.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Lab result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { upload, uploadResult, getDoctorResults, updateResultStatus, getPatientResults, deleteResult };
