import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserAppointments, updateAppointmentStatus, deleteAppointment } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminModal from '../../components/AdminModal';
import './MyAppointments.css';

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, appointment: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, appointmentId: null });

  const fetchAppointments = async () => {
    try {
      const { data } = await getUserAppointments();
      setAppointments(data.appointments || data || []);
    } catch (err) {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelClick = (appointment) => {
    setCancelModal({ isOpen: true, appointment });
  };

  const handleCancelConfirm = async () => {
    const id = cancelModal.appointment?._id;
    if (!id) return;

    setCancellingId(id);
    try {
      await updateAppointmentStatus(id, 'cancelled');
      setCancelModal({ isOpen: false, appointment: null });
      await fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, appointmentId: id });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteModal.appointmentId;
    if (!id) return;

    setDeletingId(id);
    try {
      await deleteAppointment(id);
      setDeleteModal({ isOpen: false, appointmentId: null });
      await fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete appointment.');
    } finally {
      setDeletingId(null);
    }
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    if (activeTab === 'upcoming') {
      return appointments.filter(
        (a) => (a.status === 'confirmed' || a.status === 'pending')
      );
    } else if (activeTab === 'past') {
      return appointments.filter((a) => a.status === 'completed');
    } else if (activeTab === 'cancelled') {
      return appointments.filter((a) => a.status === 'cancelled');
    }
    return [];
  };

  const filtered = getFilteredAppointments();

  const counts = {
    upcoming: appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length,
    past: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  // Calculate stats
  const totalVisits = counts.past;
  const upcomingCount = counts.upcoming;

  // Find next appointment (upcoming soonest)
  const upcomingAppointments = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'pending')
    .map(a => {
      const dateObj = a.bookingId?.bookedAt || a.createdAt;
      return { ...a, dateValue: new Date(dateObj) };
    })
    .sort((a, b) => a.dateValue - b.dateValue);

  const nextAppointment = upcomingAppointments[0];
  const nextAppointmentText = nextAppointment
    ? `${nextAppointment.doctorId?.specialty || 'Doctor'} on ${nextAppointment.dateValue.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'None scheduled';

  const formatCardDate = (appointment) => {
    // Use bookedAt from booking as the appointment date
    const dateString = appointment.bookingId?.bookedAt || appointment.createdAt;
    if (!dateString) return 'Date not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCardTime = (appointment) => {
    const slot = appointment.bookingId?.slotId;
    if (slot?.startTime) {
      return slot.endTime ? `${slot.startTime} – ${slot.endTime}` : slot.startTime;
    }
    return 'Time not set';
  };

  return (
    <div className="my-appointments-page">
      <Navbar />
      <main className="my-appointments-main">
        {/* Header Section */}
        <div className="my-appointments-header">
          <div>
            <h1 className="my-appointments-title">My Appointments</h1>
            <p className="my-appointments-subtitle">Manage your clinical visits and healthcare schedule in one place.</p>
          </div>
          {/* Tab Navigation */}
          <div className="my-appointments-tabs-container">
            <button 
              className={`my-appointments-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`my-appointments-tab ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past
            </button>
            <button 
              className={`my-appointments-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Appointment Cards Container */}
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filtered.length > 0 ? (
          <div className="my-appointments-grid">
            {filtered.map((appt) => {
              const doc = appt.doctorId || {};
              const docUser = doc.userId || {};
              const docName = docUser.name || 'Doctor';
              const docSpecialty = doc.specialty || 'General Specialist';
              const docAvatarPath = docUser.profilePicture || '';
              const docAvatar = docAvatarPath
                ? (docAvatarPath.startsWith('http') ? docAvatarPath : `http://localhost:5000${docAvatarPath}`)
                : null;
              const formattedDate = formatCardDate(appt);
              const formattedTime = formatCardTime(appt);
              const isExpanded = expandedId === appt._id;

              return (
                <div key={appt._id} className="appointment-premium-card group">
                  <div className="appointment-card-inner">
                    
                    {/* Doctor info section */}
                    <div className="appointment-card-doctor-info">
                      <div className="appointment-card-avatar-wrapper">
                        {docAvatar ? (
                          <img src={docAvatar} alt={docName} className="appointment-card-img" />
                        ) : (
                          <div className="appointment-card-img-placeholder">
                            <span className="material-symbols-outlined">person</span>
                          </div>
                        )}
                        {doc.isVerified && (
                          <div className="appointment-card-verified-badge">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="appointment-card-doctor-name">Dr. {docName}</h3>
                        <div className="appointment-card-specialty-row">
                          <span className="material-symbols-outlined">medical_services</span>
                          {docSpecialty}
                        </div>
                      </div>
                    </div>

                    {/* Columns grid */}
                    <div className="appointment-card-columns">
                      <div className="appointment-card-col">
                        <div className="appointment-col-icon-box">
                          <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div>
                          <p className="appointment-col-label">Date</p>
                          <p className="appointment-col-value">{formattedDate}</p>
                        </div>
                      </div>
                      
                      <div className="appointment-card-col">
                        <div className="appointment-col-icon-box">
                          <span className="material-symbols-outlined">schedule</span>
                        </div>
                        <div>
                          <p className="appointment-col-label">Time</p>
                          <p className="appointment-col-value">{formattedTime}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons and Status */}
                    <div className="appointment-card-actions-row">
                      <div className={`appointment-status-badge status-${appt.status}`}>
                        <span className="status-badge-dot"></span>
                        {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                      </div>
                      
                      <div className="appointment-card-buttons">
                        {(appt.status === 'confirmed' || appt.status === 'pending') && (
                          <button 
                            className="appointment-btn-reschedule"
                            onClick={() => navigate(`/patient/book/${doc._id}?reschedule=${appt._id}`)}
                          >
                            Reschedule
                          </button>
                        )}
                        {(appt.status === 'confirmed' || appt.status === 'pending') && (
                          <button 
                            className="appointment-btn-cancel-action"
                            onClick={() => handleCancelClick(appt)}
                            disabled={cancellingId === appt._id}
                          >
                            {cancellingId === appt._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                        {(appt.status === 'completed' || appt.status === 'cancelled') && (
                          <button 
                            className="appointment-btn-cancel-action"
                            style={{ borderColor: '#ef4444', color: '#ef4444' }}
                            onClick={() => handleDeleteClick(appt._id)}
                            disabled={deletingId === appt._id}
                          >
                            {deletingId === appt._id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                        <button 
                          className="appointment-btn-details"
                          onClick={() => setExpandedId(isExpanded ? null : appt._id)}
                        >
                          Details
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Expandable details segment */}
                  {isExpanded && (
                    <div className="appointment-card-expanded-content">
                      <div className="expanded-details-layout">
                        <div className="expanded-detail-box">
                          <h4 className="expanded-detail-title">
                            <span className="material-symbols-outlined text-primary">info</span>
                            Booking Information
                          </h4>
                          <p className="expanded-detail-text"><strong>Appointment ID:</strong> {appt._id}</p>
                          <p className="expanded-detail-text"><strong>Clinic Location:</strong> {doc.clinic || 'General Clinic'}</p>
                        </div>
                        <div className="expanded-detail-box">
                          <h4 className="expanded-detail-title">
                            <span className="material-symbols-outlined text-primary">notes</span>
                            Patient / Doctor Notes
                          </h4>
                          <p className="expanded-detail-text notes-styled">
                            {appt.notes ? `"${appt.notes}"` : 'No notes provided.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="my-appointments-empty-state">
            <span className="material-symbols-outlined">event_busy</span>
            <h3>No appointments found</h3>
            <p>You don't have any {activeTab} appointments scheduled at the moment.</p>
            {activeTab === 'upcoming' && (
              <Link to="/doctors" className="book-now-btn">
                Book an Appointment
              </Link>
            )}
          </div>
        )}

        {/* Sidebar / Supplemental Info (Asymmetric Layout at the Bottom) */}
        <div className="my-appointments-supplemental-row" style={{ gridTemplateColumns: '1fr' }}>
          
          {/* Telehealth Promo */}
          <div className="telehealth-consultations-banner" style={{ width: '100%' }}>
            <div className="telehealth-banner-icon-box">
              <span className="material-symbols-outlined">health_and_safety</span>
            </div>
            <div className="telehealth-banner-text-box">
              <h4 className="telehealth-banner-heading">Telehealth Consultations</h4>
              <p className="telehealth-banner-paragraph">
                Did you know you can see most of our doctors via a secure video call? Save travel time and book a virtual appointment today.
              </p>
              <button 
                className="telehealth-explore-link"
                onClick={() => navigate('/doctors')}
              >
                Explore Telehealth Options 
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

        </div>

      </main>
      <Footer />

      <AdminModal
        isOpen={cancelModal.isOpen}
        title="Cancel Appointment"
        onClose={() => setCancelModal({ isOpen: false, appointment: null })}
        onConfirm={handleCancelConfirm}
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        isDangerous={true}
        isLoading={!!cancellingId}
      >
        <p>
          Are you sure you want to cancel your appointment with{' '}
          <strong>Dr. {cancelModal.appointment?.doctorId?.userId?.name || 'your doctor'}</strong>?
        </p>
        <p className="admin-modal-subtext">
          This action cannot be undone. You can book a new appointment anytime.
        </p>
      </AdminModal>

      <AdminModal
        isOpen={deleteModal.isOpen}
        title="Delete Completed Appointment"
        onClose={() => setDeleteModal({ isOpen: false, appointmentId: null })}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete Record"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deletingId === deleteModal.appointmentId}
      >
        <p>
          Are you sure you want to permanently delete this completed appointment from your history?
        </p>
        <p className="admin-modal-subtext">
          This action will remove the record from your view and cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}
