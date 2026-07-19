const Review = require('../models/Review');
const Doctor = require('../models/Doctor');

// Helper: recalculate doctor rating
// Called after each review is added/deleted to keep doctor's average rating up to date
const recalculateDoctorRating = async (doctorId) => {
  // Fetch all reviews for this doctor
  const reviews = await Review.find({ doctorId });
  const count = reviews.length;
  
  // Calculate average rating (or 0 if no reviews yet)
  const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  // Update doctor document with new rating (rounded to 1 decimal place)
  await Doctor.findByIdAndUpdate(doctorId, {
    rating: Math.round(avg * 10) / 10, // This formula gives us one decimal place: 4.7, 3.2, etc
    reviewsCount: count,
  });
};

// POST /api/reviews/:doctorId (patient only)
// Patients can leave a review after their appointment (1-5 stars + comment)
const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Create the review linked to the doctor and the patient who wrote it
    const review = await Review.create({
      doctorId: req.params.doctorId,
      patientId: req.user._id, // req.user comes from auth middleware
      rating,
      comment,
    });

    // Immediately update the doctor's average rating (shows in their profile)
    await recalculateDoctorRating(req.params.doctorId);

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/reviews/:doctorId
const getDoctorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name');

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/reviews/:id (admin only)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const doctorId = review.doctorId;
    await Review.findByIdAndDelete(req.params.id);
    await recalculateDoctorRating(doctorId);

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createReview, getDoctorReviews, deleteReview, recalculateDoctorRating };
