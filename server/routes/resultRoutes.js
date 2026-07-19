const express = require('express');
const router = express.Router();
const {
  upload,
  uploadResult,
  getDoctorResults,
  updateResultStatus,
  getPatientResults,
  deleteResult,
} = require('../controllers/resultController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/upload', authMiddleware, roleMiddleware(['patient']), upload.single('file'), uploadResult);
router.get('/doctor/all', authMiddleware, roleMiddleware(['doctor']), getDoctorResults);
router.put('/:id/status', authMiddleware, roleMiddleware(['doctor']), updateResultStatus);
router.delete('/:id', authMiddleware, roleMiddleware(['patient']), deleteResult);
router.get('/:patientId', authMiddleware, getPatientResults);

module.exports = router;
