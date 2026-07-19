const Doctor = require('../models/Doctor');
const User   = require('../models/User');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const LabResult = require('../models/LabResult');
const Slot = require('../models/Slot');

// POST /api/doctors (doctor only)
const createDoctor = async (req, res) => {
  try {
    const existingDoctor = await Doctor.findOne({ userId: req.user._id });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor profile already exists for this user' });
    }

    const { specialty, clinic, experience, availableSlots, location, address } = req.body;

    const doctor = await Doctor.create({
      userId: req.user._id,
      specialty,
      clinic,
      experience,
      availableSlots,
      location,
      address,
    });

    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/doctors  — supports ?search= (by name) &specialty= &limit=
// This is the main doctor discovery endpoint - used by patients to find doctors
const getDoctors = async (req, res) => {
  try {
    const { search, specialty, limit } = req.query;

    const doctorFilter = {};

    // Specialty filter - exact match but case-insensitive (Cardiology, cardiology, CARDIOLOGY all work)
    if (specialty) {
      doctorFilter.specialty = { $regex: new RegExp(`^${specialty}$`, 'i') };
    }

    // Name search — find matching User IDs first, then filter doctors
    if (search) {
      const nameRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({ name: nameRegex }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);
      doctorFilter.userId = { $in: userIds };
    }

    // Build query with populated user data (name, email from User collection)
    let query = Doctor.find(doctorFilter)
      .populate('userId', 'name email profilePicture')
      .sort({ _id: 1 });

    // Apply pagination limit if specified
    if (limit) query = query.limit(parseInt(limit));

    // Execute query and return results
    const doctors = await query;

    // Compute  available (unbooked) slot counts from Slot collection
    const doctorIds = doctors.map((d) => d._id);
    const slotCounts = await Slot.aggregate([
      { $match: { doctorId: { $in: doctorIds }, isBooked: false } },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    slotCounts.forEach((s) => { countMap[s._id.toString()] = s.count; });

    const doctorsWithSlots = doctors.map((d) => {
      const obj = d.toObject();
      obj.availableSlots = countMap[d._id.toString()] || 0;
      return obj;
    });

    res.status(200).json(doctorsWithSlots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/doctors/nearby
const getNearbyDoctors = async (req, res) => {
  try {
    const { lng, lat, maxDistance } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ message: 'lng and lat query params are required' });
    }

    const doctors = await Doctor.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance) || 10000,
        },
      },
    }).populate('userId', 'name email profilePicture');

    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/doctors/:id
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email phone profilePicture');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/doctors/:id/profile (doctor only)
const updateDoctorProfile = async (req, res) => {
  try {
    const { specialty, clinic, experience, availableSlots, location, address } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { specialty, clinic, experience, availableSlots, location, address },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/doctors/me/profile (doctor only)
const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'name email profilePicture');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/doctors/me/analytics (doctor only)
const getDoctorAnalytics = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const days = parseInt(req.query.days, 10) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [appointments, reviews, labResults] = await Promise.all([
      Appointment.find({ doctorId: doctor._id }).populate('patientId', 'name'),
      Review.find({ doctorId: doctor._id, isApproved: true }).populate('patientId', 'name profilePicture'),
      LabResult.find({ doctorId: doctor._id }),
    ]);

    const recentAppointments = appointments.filter(
      (a) => new Date(a.createdAt) >= since
    );

    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

    const uniquePatients = new Set(appointments.map((a) => a.patientId?._id?.toString()).filter(Boolean));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      trendMap[key] = { month: monthNames[d.getMonth()], current: 0, previous: 0 };
    }

    appointments.forEach((a) => {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const prevKey = `${d.getFullYear() - 1}-${d.getMonth()}`;
      if (trendMap[key]) trendMap[key].current += 1;
      if (trendMap[prevKey]) trendMap[prevKey].previous += 1;
    });

    const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((r) => r.rating === stars).length,
    }));

    const pendingLabResults = labResults.filter((r) => r.status === 'pending').length;

    res.status(200).json({
      summary: {
        totalAppointments: total,
        recentAppointments: recentAppointments.length,
        completionRate,
        completed,
        cancelled,
        pending,
        confirmed,
        totalPatients: uniquePatients.size,
        avgRating: doctor.rating || 0,
        reviewsCount: doctor.reviewsCount || reviews.length,
        pendingLabResults,
      },
      visitStatus: {
        completed,
        rescheduled: confirmed + pending,
        cancelled,
        total: total || 1,
      },
      appointmentTrend: Object.values(trendMap),
      ratingDistribution,
      recentReviews: reviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((r) => ({
          _id: r._id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          patientName: r.patientId?.name || 'Patient',
          patientPicture: r.patientId?.profilePicture || '',
        })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getNearbyDoctors,
  getDoctorById,
  updateDoctorProfile,
  getMyDoctorProfile,
  getDoctorAnalytics,
};
