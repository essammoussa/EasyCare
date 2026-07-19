const express = require('express');
const router = express.Router();
const { getHospitals, createHospital } = require('../controllers/hospitalController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', getHospitals);
router.post('/', authMiddleware, roleMiddleware(['admin']), createHospital);

module.exports = router;
