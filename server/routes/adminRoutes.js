const express = require('express');
const router = express.Router();
const {
  getUsers,
  getDoctors,
  getAppointments,
  getReviews,
  deleteAdminReview,
  getAnalytics,
  // User management
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  // Doctor management
  createDoctor,
  updateDoctor,
  verifyDoctor,
  toggleDoctorStatus,
  deleteDoctor,
  // Appointment management
  updateAppointment,
  deleteAppointment,
  // Review management
  approveReview,
  flagReview,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Apply middleware to all admin routes
router.use(authMiddleware, roleMiddleware(['admin']));

// Analytics & Read Operations
router.get('/users', getUsers);
router.get('/doctors', getDoctors);
router.get('/appointments', getAppointments);
router.get('/reviews', getReviews);
router.get('/analytics', getAnalytics);

// User Management
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);

// Doctor Management
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.patch('/doctors/:id/verify', verifyDoctor);
router.patch('/doctors/:id/toggle-status', toggleDoctorStatus);
router.delete('/doctors/:id', deleteDoctor);

// Appointment Management
router.put('/appointments/:id', updateAppointment);
router.delete('/appointments/:id', deleteAppointment);

// Review Management
router.delete('/reviews/:id', deleteAdminReview);
router.patch('/reviews/:id/approve', approveReview);
router.patch('/reviews/:id/flag', flagReview);

module.exports = router;
