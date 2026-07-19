const express = require('express');
const router = express.Router();
const { getPrescriptions } = require('../controllers/recordController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:appointmentId', authMiddleware, getPrescriptions);

module.exports = router;
