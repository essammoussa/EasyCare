const express = require('express');
const router = express.Router();
const { createSlot, getAvailableSlots, deleteSlot } = require('../controllers/slotController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['doctor']), createSlot);
router.get('/:doctorId', getAvailableSlots);
router.delete('/:id', authMiddleware, roleMiddleware(['doctor']), deleteSlot);

module.exports = router;
