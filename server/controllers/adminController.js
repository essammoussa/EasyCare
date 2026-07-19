const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const bcrypt = require('bcryptjs');
const { recalculateDoctorRating } = require('./reviewController');

// Error handler helper
const handleError = (res, status, message, error) => {
  res.status(status).json({ message, error: error?.message });
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/doctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'name email');
    res.status(200).json(doctors);
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// GET /api/admin/appointments
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patientId', 'name')
      .populate({
        path: 'doctorId',
        select: 'specialty clinic userId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate({
        path: 'bookingId',
        populate: { path: 'slotId' },
      })
      .sort({ createdAt: -1 });
    res.status(200).json(appointments);
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// DELETE /api/admin/reviews/:id
const deleteAdminReview = async (req, res) => {
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
    handleError(res, 500, 'Server error', error);
  }
};

// GET /api/admin/reviews
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email' },
        select: 'specialty clinic userId',
      })
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - days);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalDoctors = await Doctor.countDocuments();
    const pendingDoctors = await Doctor.countDocuments({ isVerified: false });
    const totalAppointments = await Appointment.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Appointment status breakdown (within range)
    const appointmentsByStatus = await Appointment.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // User registration trend (within range, grouped by week)
    const userTrend = await User.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    // Transform into week-based series for patients and doctors
    const weekMap = {};
    userTrend.forEach(({ _id, count }) => {
      const key = `${_id.year}-W${_id.week}`;
      if (!weekMap[key]) weekMap[key] = { week: key, patients: 0, doctors: 0 };
      if (_id.role === 'patient') weekMap[key].patients = count;
      if (_id.role === 'doctor') weekMap[key].doctors = count;
    });
    const userTrendSeries = Object.values(weekMap).slice(-Math.ceil(days / 7));

    // Appointments grouped by doctor specialty (within range)
    const appointmentsBySpecialty = await Appointment.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $group: {
          _id: '$doctor.specialty',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // Top 5 doctors by appointment count (within range)
    const topDoctors = await Appointment.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: '$doctorId',
          appointmentCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $addFields: {
          performanceScore: { $multiply: ['$appointmentCount', { $ifNull: ['$doctor.rating', 0] }] }
        }
      },
      { $sort: { performanceScore: -1, appointmentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor.userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$doctor._id',
          name: '$user.name',
          specialty: '$doctor.specialty',
          rating: '$doctor.rating',
          appointmentCount: 1,
        },
      },
    ]);

    // Doctor locations for geo-map
    const doctorLocations = await Doctor.find(
      { 'location.coordinates': { $exists: true, $ne: [] } },
      { location: 1, specialty: 1, clinic: 1, userId: 1 }
    ).populate('userId', 'name').lean();

    const geoPoints = doctorLocations
      .filter(d => d.location?.coordinates?.length === 2)
      .map(d => ({
        id: d._id,
        name: d.userId?.name || 'Unknown',
        specialty: d.specialty,
        clinic: d.clinic || '',
        lng: d.location.coordinates[0],
        lat: d.location.coordinates[1],
      }));

    // Most booked doctor (within range)
    const mostBooked = topDoctors.length > 0 ? topDoctors[0] : null;

    // Top-rated specialty
    const topRatedSpecialty = await Doctor.aggregate([
      { $match: { rating: { $gt: 0 } } },
      {
        $group: {
          _id: '$specialty',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1 } },
      { $limit: 1 },
    ]);

    // Busiest day of week (within range)
    const busiestDay = await Appointment.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const busiestDayName = busiestDay.length > 0 ? dayNames[(busiestDay[0]._id - 1) % 7] : 'N/A';
    const rangeAppointments = await Appointment.countDocuments({ createdAt: { $gte: rangeStart } });
    const avgCount = rangeAppointments / 7;
    const busiestPercent = busiestDay.length > 0 && avgCount > 0
      ? Math.round(((busiestDay[0].count - avgCount) / avgCount) * 100)
      : 0;

    // Appointment trend (within range, grouped per day)
    const appointmentTrend = await Appointment.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const appointmentTrendSeries = appointmentTrend.map(item => ({
      date: `${item._id.month}/${item._id.day}`,
      appointments: item.count,
    }));

    res.status(200).json({
      totalUsers,
      activeUsers,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      totalReviews,
      days,
      appointmentsByStatus,
      userTrendSeries,
      appointmentsBySpecialty: appointmentsBySpecialty.map(s => ({
        specialty: s._id || 'Unknown',
        count: s.count,
      })),
      topDoctors,
      geoPoints,
      mostBooked,
      topRatedSpecialty: topRatedSpecialty.length > 0
        ? { specialty: topRatedSpecialty[0]._id, avgRating: topRatedSpecialty[0].avgRating.toFixed(1) }
        : null,
      busiestDay: { day: busiestDayName, percentAboveAvg: busiestPercent },
      appointmentTrendSeries,
    });
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// User Management
// POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'patient',
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is a doctor, delete their doctor profile too
    if (user.role === 'doctor') {
      await Doctor.deleteOne({ userId: req.params.id });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ message: 'User status updated', user });
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// Doctor Management
// POST /api/admin/doctors
const createDoctor = async (req, res) => {
  try {
    const { name, email, password, specialty, clinic, experience } = req.body;

    if (!name || !email || !specialty) {
      return res.status(400).json({ message: 'Name, email, and specialty are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'doctor',
    });

    const doctor = await Doctor.create({
      userId: user._id,
      specialty,
      clinic: clinic || '',
      experience: experience || 0,
      isActive: true,
      isVerified: true,
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });

    // Populate userId to return the full doctor object
    const populatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'name email');

    res.status(201).json(populatedDoctor);
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// PUT /api/admin/doctors/:id
const updateDoctor = async (req, res) => {
  try {
    const { specialty, clinic, experience, isVerified, isActive } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { specialty, clinic, experience, isVerified, isActive },
      { new: true }
    ).populate('userId', 'name email');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// PATCH /api/admin/doctors/:id/verify
const verifyDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isVerified = true;
    await doctor.save();

    res.status(200).json({ message: 'Doctor verified successfully', doctor });
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// PATCH /api/admin/doctors/:id/toggle-status
const toggleDoctorStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    res.status(200).json({ message: 'Doctor status updated', doctor });
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// DELETE /api/admin/doctors/:id
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Delete associated user
    await User.findByIdAndDelete(doctor.userId);

    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// Appointment Management
// PUT /api/admin/appointments/:id
const updateAppointment = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    )
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        select: 'specialty clinic userId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate({
        path: 'bookingId',
        populate: { path: 'slotId' },
      });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(200).json(appointment);
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// DELETE /api/admin/appointments/:id
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// Review Management
// PATCH /api/admin/reviews/:id/approve
const approveReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, flagged: false },
      { new: true }
    )
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email' },
        select: 'specialty userId',
      });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json({ message: 'Review approved', review });
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

// PATCH /api/admin/reviews/:id/flag
const flagReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { flagged: true },
      { new: true }
    )
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email' },
        select: 'specialty userId',
      });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json({ message: 'Review flagged', review });
  } catch (error) {
    handleError(res, 500, 'Server error', error);
  }
};

module.exports = {
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
};