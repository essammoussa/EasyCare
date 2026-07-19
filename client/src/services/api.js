import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor — attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const googleLogin = (data) => API.post('/auth/google', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);
export const changePassword = (data) => API.put('/auth/change-password', data);

// Users (Profile & Settings)
export const getProfile = () => API.get('/users/profile');
export const updateProfile = (data) => API.put('/users/profile', data);
export const uploadAvatar = (formData) =>
  API.post('/users/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Doctors
export const getDoctors = (params) => API.get('/doctors', { params });
export const getDoctor = (id) => API.get(`/doctors/${id}`);
export const getNearbyDoctors = (lng, lat, maxDistance) =>
  API.get('/doctors/nearby', { params: { lng, lat, maxDistance } });
export const getMyDoctorProfile = () => API.get('/doctors/me/profile');
export const getDoctorAnalytics = (days) =>
  API.get('/doctors/me/analytics', { params: days ? { days } : {} });
export const createDoctor = (data) => API.post('/doctors', data);
export const updateDoctorProfile = (id, data) => API.put(`/doctors/${id}/profile`, data);

// Hospitals
export const getHospitals = () => API.get('/hospitals');

// Slots
export const getSlots = (doctorId) => API.get(`/slots/${doctorId}`);
export const createSlot = (data) => API.post('/slots', data);
export const deleteSlot = (id) => API.delete(`/slots/${id}`);

// Bookings
export const createBooking = (data) => API.post('/bookings', data);
export const getUserBookings = () => API.get('/bookings/user');

// Appointments
export const getUserAppointments = () => API.get('/appointments/user');
export const updateAppointmentStatus = (id, status) =>
  API.put(`/appointments/${id}/status`, { status });
export const deleteAppointment = (id) => API.delete(`/appointments/${id}`);

// Records
export const createRecord = (data) => API.post('/records', data);
export const getPatientRecords = (patientId) => API.get(`/records/${patientId}`);
export const getPrescriptions = (appointmentId) =>
  API.get(`/prescriptions/${appointmentId}`);

// Results
export const uploadResult = (formData) =>
  API.post('/results/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getDoctorResults = () => API.get('/results/doctor/all');
export const updateResultStatus = (id, status) =>
  API.put(`/results/${id}/status`, { status });
export const getPatientResults = (patientId) => API.get(`/results/${patientId}`);
export const deleteResult = (id) => API.delete(`/results/${id}`);

// Reviews
export const createReview = (doctorId, data) =>
  API.post(`/reviews/${doctorId}`, data);
export const getDoctorReviews = (doctorId) => API.get(`/reviews/${doctorId}`);
export const deleteReview = (id) => API.delete(`/reviews/${id}`);

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.patch('/notifications/read-all');

// Chat
export const getChatConversations = () => API.get('/chat/conversations');
export const getOrCreateChatConversation = (doctorId, appointmentId) =>
  API.post(`/chat/conversations/${doctorId}`, { appointmentId });
export const getChatMessages = (conversationId) => API.get(`/chat/messages/${conversationId}`);
export const sendChatMessage = (data) => API.post('/chat/messages', data);
export const markChatMessagesRead = (conversationId) => API.patch(`/chat/messages/read/${conversationId}`);

// Admin
export const getAdminUsers = () => API.get('/admin/users');
export const getAdminDoctors = () => API.get('/admin/doctors');
export const getAdminAppointments = () => API.get('/admin/appointments');
export const getAdminReviews = () => API.get('/admin/reviews');
export const getAnalytics = (days) => API.get('/admin/analytics', { params: days ? { days } : {} });

// User Management
export const createAdminUser = (data) => API.post('/admin/users', data);
export const updateAdminUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const deleteAdminUser = (id) => API.delete(`/admin/users/${id}`);
export const toggleAdminUserStatus = (id) => API.patch(`/admin/users/${id}/toggle-status`);

// Doctor Management
export const createAdminDoctor = (data) => API.post('/admin/doctors', data);
export const updateAdminDoctor = (id, data) => API.put(`/admin/doctors/${id}`, data);
export const verifyAdminDoctor = (id) => API.patch(`/admin/doctors/${id}/verify`);
export const toggleAdminDoctorStatus = (id) => API.patch(`/admin/doctors/${id}/toggle-status`);
export const deleteAdminDoctor = (id) => API.delete(`/admin/doctors/${id}`);

// Appointment Management
export const updateAdminAppointment = (id, data) => API.put(`/admin/appointments/${id}`, data);
export const deleteAdminAppointment = (id) => API.delete(`/admin/appointments/${id}`);

// Review Management
export const deleteAdminReview = (id) => API.delete(`/admin/reviews/${id}`);
export const approveAdminReview = (id) => API.patch(`/admin/reviews/${id}/approve`);
export const flagAdminReview = (id) => API.patch(`/admin/reviews/${id}/flag`);

export default API;
