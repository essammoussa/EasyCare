const express = require('express');
const router = express.Router();
const { createRecord, getPatientRecords } = require('../controllers/recordController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['doctor']), createRecord);
router.get('/:patientId', authMiddleware, getPatientRecords);

module.exports = router;
