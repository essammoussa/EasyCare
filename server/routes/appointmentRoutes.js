const express = require('express');
const router = express.Router();
const {
  getUserAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/user', authMiddleware, getUserAppointments);
router.put('/:id/status', authMiddleware, roleMiddleware(['doctor', 'patient']), updateAppointmentStatus);
router.delete('/:id', authMiddleware, roleMiddleware(['doctor', 'patient']), deleteAppointment);

module.exports = router;
