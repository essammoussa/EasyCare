const Hospital = require('../models/Hospital');

// GET /api/hospitals
const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.status(200).json(hospitals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/hospitals (admin only)
const createHospital = async (req, res) => {
  try {
    const { name, address, location } = req.body;

    const hospital = await Hospital.create({ name, address, location });
    res.status(201).json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getHospitals, createHospital };
