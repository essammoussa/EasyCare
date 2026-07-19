import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserAppointments, updateAppointmentStatus, deleteAppointment } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import DoctorSidebar from '../../components/DoctorSidebar';
import DoctorHeader from '../../components/DoctorHeader';
import AdminModal from '../../components/AdminModal';
import './Doctor.css';
import './DoctorAppointments.css';

export default function DoctorAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, appointmentId: null });

  // Filter and Sort states
  const [dateTab, setDateTab] = useState('upcoming'); // 'upcoming', 'past'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'age'

  const fetchData = async () => {
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
    fetchData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      // Update local state directly
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a))
      );
    } catch (err) {
      setError('Failed to update status.');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, appointmentId: id });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteModal.appointmentId;
    if (!id) return;
    try {
      await deleteAppointment(id);
      setDeleteModal({ isOpen: false, appointmentId: null });
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError('Failed to delete appointment.');
    }
  };

  // Helper to get the appointment date (kept for sort logic)
  const getAppointmentDate = (appt) => {
    return appt.bookingId?.bookedAt || appt.createdAt;
  };

  // Filter Logic
  // Upcoming = pending or confirmed; Past = completed (cancelled shown in both with filter)
  const filteredAppointments = appointments.filter((appt) => {
    // 1. Tab Filtering by status
    if (dateTab === 'upcoming') {
      if (appt.status === 'completed') return false;
    } else if (dateTab === 'past') {
      if (appt.status !== 'completed') return false;
    }

    // 2. Search Query Filtering (Patient name)
    const patientName = appt.patientId?.name || '';
    if (searchQuery && !patientName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 3. Status Filtering (secondary filter within tab)
    if (statusFilter !== 'all' && appt.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Sort Logic
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (sortBy === 'time') {
      const dateA = new Date(getAppointmentDate(a));
      const dateB = new Date(getAppointmentDate(b));
      return dateA - dateB; // soonest first
    }
    if (sortBy === 'name') {
      const nameA = a.patientId?.name || '';
      const nameB = b.patientId?.name || '';
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'age') {
      // default age to 30 if not provided
      const ageA = a.patientId?.age || 30;
      const ageB = b.patientId?.age || 30;
      return ageA - ageB;
    }
    return 0;
  });

  return (
    <div className="doctor-page-wrapper">
      {mobileMenuOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <DoctorSidebar 
        activePage="appointments" 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      <div className="doctor-content">
        <DoctorHeader onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="doctor-main doc-appt-main">
          {/* Page Header & Tabs */}
          <div className="doc-appt-header-row">
            <div>
              <h2 className="doc-appt-title">Doctor Appointments</h2>
              <p className="doc-appt-subtitle">Manage your daily schedule and patient clinical records.</p>
            </div>
            
            {/* Custom Tabs Navigation */}
            <div className="doc-appt-tab-container">
              <button 
                className={`doc-appt-tab-btn ${dateTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setDateTab('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={`doc-appt-tab-btn ${dateTab === 'past' ? 'active' : ''}`}
                onClick={() => setDateTab('past')}
              >
                Past
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="doc-appt-filter-bar">
            <div className="doc-appt-search-wrapper">
              <span className="material-symbols-outlined">filter_list</span>
              <input 
                type="text" 
                placeholder="Filter by patient name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              className="doc-appt-select" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select 
              className="doc-appt-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by: Name</option>
              <option value="age">Sort by: Age</option>
            </select>
          </div>

          {/* Appointment List */}
          <div className="doc-appt-list-wrapper">
            {loading ? (
              <div className="doctor-spinner-container">
                <div className="doctor-spinner" />
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : sortedAppointments.length > 0 ? (
              <div className="doc-appt-cards-container">
                {sortedAppointments.map((appt) => {
                  const patientName = appt.patientId?.name || 'Patient';
                  const patientAge = appt.patientId?.age || '28';
                  const notes = appt.notes || 'General Consultation';
                  
                  const apptDate = new Date(getAppointmentDate(appt));
                  const slot = appt.bookingId?.slotId;
                  const formattedDate = apptDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                  const formattedTime = slot?.startTime
                    ? (slot.endTime ? `${slot.startTime} – ${slot.endTime}` : slot.startTime)
                    : apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  const initials = patientName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  // Determine sub-icons based on appointment type or notes
                  let typeIcon = 'history';
                  let typeLabel = 'Follow-up Visit';
                  if (notes.toLowerCase().includes('lab') || notes.toLowerCase().includes('test')) {
                    typeIcon = 'biotech';
                    typeLabel = 'Lab Review';
                  } else if (notes.toLowerCase().includes('new') || notes.toLowerCase().includes('pain') || notes.toLowerCase().includes('emergency')) {
                    typeIcon = 'emergency';
                    typeLabel = 'New Consultation';
                  }

                  return (
                    <div className="doc-appt-horizontal-card" key={appt._id}>
                      {/* Left: Patient Profile */}
                      <div className="doc-appt-card-left">
                        {appt.patientId?.profilePicture ? (
                          <img 
                            src={appt.patientId.profilePicture.startsWith('http') ? appt.patientId.profilePicture : `http://localhost:5000${appt.patientId.profilePicture}`} 
                            alt="Patient Avatar" 
                            className="doc-appt-patient-img"
                          />
                        ) : (
                          <div className="doc-appt-patient-fallback">{initials}</div>
                        )}
                        <div>
                          <h3 className="doc-appt-patient-name">{patientName}</h3>
                          <div className="doc-appt-patient-tags">
                            <span className="doc-appt-age-tag">{patientAge} years</span>
                            <span className="doc-appt-type-tag">
                              <span className="material-symbols-outlined">{typeIcon}</span>
                              {typeLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Details (Time & Status) */}
                      <div className="doc-appt-card-mid">
                        <div className="doc-appt-detail-block">
                          <div className="doc-appt-detail-icon blue">
                            <span className="material-symbols-outlined">schedule</span>
                          </div>
                          <div>
                            <p className="doc-appt-detail-label">Date & Time</p>
                            <p className="doc-appt-detail-value">{formattedDate}</p>
                            <p className="doc-appt-detail-value" style={{ marginTop: '4px' }}>{formattedTime}</p>
                          </div>
                        </div>

                        <div className="doc-appt-detail-block">
                          <div className={`doc-appt-detail-icon status-${appt.status}`}>
                            <span className="material-symbols-outlined">
                              {appt.status === 'confirmed' ? 'check_circle' : 
                               appt.status === 'completed' ? 'task_alt' :
                               appt.status === 'cancelled' ? 'cancel' : 'pending'}
                            </span>
                          </div>
                          <div>
                            <p className="doc-appt-detail-label">Status</p>
                            <p className={`doc-appt-detail-value status-text-${appt.status}`}>{appt.status}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="doc-appt-card-right">
                        <button 
                          className="doc-appt-action-outline"
                          onClick={() => navigate(`/doctor/records?patientId=${appt.patientId?._id}`)}
                        >
                          View Record
                        </button>
                        
                        {appt.status === 'confirmed' && (
                          <button 
                            className="doc-appt-action-blue-outline"
                            onClick={() => navigate(`/doctor/diagnosis?appointmentId=${appt._id}&patientId=${appt.patientId?._id}`)}
                          >
                            Add Diagnosis
                          </button>
                        )}

                        {appt.status === 'pending' && (
                          <button 
                            className="doc-appt-action-solid confirm"
                            onClick={() => handleStatusUpdate(appt._id, 'confirmed')}
                          >
                            Confirm
                          </button>
                        )}

                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                          <>
                            <button 
                              className="doc-appt-action-solid complete"
                              onClick={() => handleStatusUpdate(appt._id, 'completed')}
                            >
                              Complete
                            </button>
                            <button 
                              className="doc-appt-action-solid cancel"
                              onClick={() => handleStatusUpdate(appt._id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {appt.status === 'cancelled' && (
                          <button 
                            className="doc-appt-action-solid cancel"
                            onClick={() => handleDeleteClick(appt._id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="doc-appt-empty-state">
                <span className="material-symbols-outlined">event_busy</span>
                <p>No appointments match the selected filters.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <AdminModal
        isOpen={deleteModal.isOpen}
        title="Delete Appointment Record"
        onClose={() => setDeleteModal({ isOpen: false, appointmentId: null })}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete Record"
        cancelText="Cancel"
        isDangerous={true}
      >
        <p>
          Are you sure you want to permanently delete this cancelled appointment from your schedule?
        </p>
        <p className="admin-modal-subtext">
          This action will remove the record from your schedule view.
        </p>
      </AdminModal>
    </div>
  );
}
