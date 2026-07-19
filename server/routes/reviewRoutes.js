const express = require('express');
const router = express.Router();
const { createReview, getDoctorReviews, deleteReview } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/:doctorId', authMiddleware, roleMiddleware(['patient']), createReview);
router.get('/:doctorId', getDoctorReviews);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteReview);

module.exports = router;
