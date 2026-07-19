import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUserAppointments,
  updateAppointmentStatus,
  getDoctorResults,
  getMyDoctorProfile,
} from '../../services/api';
import useAuth from '../../hooks/useAuth';
import DoctorSidebar from '../../components/DoctorSidebar';
import DoctorHeader from '../../components/DoctorHeader';
import './Doctor.css';
import './DoctorDashboard.css';

const API_BASE = 'http://localhost:5000';

function getAppointmentDate(appt) {
  return new Date(appt.bookingId?.bookedAt || appt.createdAt);
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getResultIcon(testName = '') {
  const name = testName.toLowerCase();
  if (name.includes('xray') || name.includes('x-ray') || name.includes('mri')) return 'radiology';
  if (name.includes('prescription') || name.includes('refill')) return 'prescriptions';
  return 'description';
}

function getFileType(testName = '') {
  const name = testName.toLowerCase();
  if (name.includes('xray') || name.includes('x-ray') || name.includes('mri')) return 'image';
  if (name.includes('prescription') || name.includes('refill')) return 'doc';
  return 'pdf';
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [apptsRes, resultsRes, profileRes] = await Promise.all([
        getUserAppointments(),
        getDoctorResults().catch(() => ({ data: [] })),
        getMyDoctorProfile().catch(() => ({ data: null })),
      ]);

      setAppointments(apptsRes.data.appointments || apptsRes.data || []);
      const results = resultsRes.data || [];
      setAllResults(results);
      setRecentResults(results.slice(0, 3));
      setDoctorProfile(profileRes.data);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      fetchData();
    } catch (err) {
      setError('Failed to update appointment status.');
    }
  };

  const today = new Date();
  const todayAppointments = appointments.filter((a) => {
    const apptDate = getAppointmentDate(a);
    return isSameDay(apptDate, today) && (a.status === 'confirmed' || a.status === 'pending');
  });

  const uniquePatients = new Set(appointments.map((a) => a.patientId?._id).filter(Boolean));
  const pendingLabReviews = allResults.filter((r) => !r.status || r.status === 'pending').length;

  const stats = {
    todayCount: todayAppointments.length,
    totalPatients: uniquePatients.size,
    avgRating: doctorProfile?.rating ? doctorProfile.rating.toFixed(1) : '—',
    pendingReviews: pendingLabReviews,
  };

  const storageUsed = Math.min(allResults.length * 15, 100);
  const confirmedToday = todayAppointments.find((a) => a.status === 'confirmed');

  return (
    <div className="doctor-page-wrapper">
      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <DoctorSidebar
        activePage="dashboard"
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="doctor-content">
        <DoctorHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="doctor-main doc-dash-main">
          <div className="doc-dash-header-section">
            <div className="doc-dash-header-text">
              <h2 className="doc-dash-welcome-title">Medical Dashboard</h2>
              <p className="doc-dash-welcome-subtitle">
                Welcome back, Dr. {user?.name || 'Doctor'}. Here is your overview for today.
              </p>
            </div>
            
          </div>

          <div className="doc-dash-stats-grid">
            <div className="doc-dash-stat-card">
              <div className="doc-dash-stat-icon-wrapper blue">
                <span className="material-symbols-outlined">calendar_today</span>
              </div>
              <div className="doc-dash-stat-body">
                <p className="doc-dash-stat-label">Today&apos;s Appointments</p>
                <p className="doc-dash-stat-value">{stats.todayCount}</p>
              </div>
            </div>

            <div className="doc-dash-stat-card">
              <div className="doc-dash-stat-icon-wrapper teal">
                <span className="material-symbols-outlined">group</span>
              </div>
              <div className="doc-dash-stat-body">
                <p className="doc-dash-stat-label">Total Patients</p>
                <p className="doc-dash-stat-value">{stats.totalPatients}</p>
              </div>
            </div>

            <div className="doc-dash-stat-card">
              <div className="doc-dash-stat-icon-wrapper amber">
                <span className="material-symbols-outlined">star_half</span>
              </div>
              <div className="doc-dash-stat-body">
                <p className="doc-dash-stat-label">Average Rating</p>
                <p className="doc-dash-stat-value">{stats.avgRating}</p>
              </div>
            </div>

            <div className="doc-dash-stat-card">
              <div className="doc-dash-stat-icon-wrapper red">
                <span className="material-symbols-outlined">rate_review</span>
              </div>
              <div className="doc-dash-stat-body">
                <p className="doc-dash-stat-label">Pending Lab Reviews</p>
                <p className="doc-dash-stat-value">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>

          <div className="doc-dash-bento-layout">
            <div className="doc-dash-timeline-column">
              <div className="doc-dash-panel">
                <div className="doc-dash-panel-header">
                  <h3>Today&apos;s Schedule</h3>
                  <button className="doc-dash-panel-link-btn" onClick={() => navigate('/doctor/appointments')}>
                    View Full Calendar
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>

                <div className="doc-dash-panel-content">
                  {loading ? (
                    <div className="doctor-spinner-container">
                      <div className="doctor-spinner" />
                    </div>
                  ) : error ? (
                    <div className="error-message">{error}</div>
                  ) : todayAppointments.length > 0 ? (
                    <div className="doc-dash-timeline-list">
                      {todayAppointments.map((appt) => {
                        const patientName = appt.patientId?.name || 'Patient';
                        const reason = appt.notes || 'Routine Consultation';
                        const timeStr = appt.bookingId?.slotId
                          ? `${appt.bookingId.slotId.startTime}`
                          : getAppointmentDate(appt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                        const initials = patientName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <div className="doc-dash-timeline-entry" key={appt._id}>
                            <div className="doc-dash-timeline-time-col">
                              <span className="doc-dash-timeline-time">{timeStr}</span>
                              <div className="doc-dash-timeline-line" />
                            </div>

                            <div className="doc-dash-timeline-card-col">
                              <div className={`doc-dash-timeline-card border-${appt.status}`}>
                                <div className="doc-dash-timeline-card-left">
                                  {appt.patientId?.profilePicture ? (
                                    <img
                                      src={
                                        appt.patientId.profilePicture.startsWith('http')
                                          ? appt.patientId.profilePicture
                                          : `${API_BASE}${appt.patientId.profilePicture}`
                                      }
                                      alt="Patient"
                                      className="doc-dash-patient-avatar"
                                    />
                                  ) : (
                                    <div className="doc-dash-patient-avatar-fallback">{initials}</div>
                                  )}
                                  <div className="doc-dash-patient-info">
                                    <h4 className="doc-dash-patient-name">{patientName}</h4>
                                    <p className="doc-dash-patient-reason">{reason}</p>
                                  </div>
                                </div>

                                <div className="doc-dash-timeline-card-right">
                                  <span className={`doc-dash-status-badge badge-${appt.status}`}>
                                    {appt.status}
                                  </span>

                                  <div className="doc-dash-card-actions">
                                    {appt.status === 'pending' && (
                                      <button
                                        className="doc-dash-mini-action-btn check"
                                        title="Confirm Appointment"
                                        onClick={() => handleStatusChange(appt._id, 'confirmed')}
                                      >
                                        <span className="material-symbols-outlined">check</span>
                                      </button>
                                    )}
                                    {appt.status === 'confirmed' && (
                                      <button
                                        className="doc-dash-mini-action-btn edit"
                                        title="Write Diagnosis"
                                        onClick={() =>
                                          navigate(
                                            `/doctor/diagnosis?appointmentId=${appt._id}&patientId=${appt.patientId?._id}`
                                          )
                                        }
                                      >
                                        <span className="material-symbols-outlined">edit_document</span>
                                      </button>
                                    )}
                                    {(appt.status === 'pending' || appt.status === 'confirmed') && (
                                      <>
                                        <button
                                          className="doc-dash-mini-action-btn complete"
                                          title="Complete"
                                          onClick={() => handleStatusChange(appt._id, 'completed')}
                                        >
                                          <span className="material-symbols-outlined">done_all</span>
                                        </button>
                                        <button
                                          className="doc-dash-mini-action-btn cancel"
                                          title="Cancel"
                                          onClick={() => handleStatusChange(appt._id, 'cancelled')}
                                        >
                                          <span className="material-symbols-outlined">close</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="doc-dash-empty-timeline">
                      <span className="material-symbols-outlined">calendar_today</span>
                      <p>No appointments scheduled for today.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="doc-dash-records-column">
              <div className="doc-dash-panel">
                <div className="doc-dash-panel-header">
                  <h3>Recent Records</h3>
                  <button className="doc-dash-panel-link-btn" onClick={() => navigate('/doctor/results')}>
                    View All
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>

                <div className="doc-dash-panel-content doc-dash-panel-stack">
                  <div className="doc-dash-records-list">
                    {recentResults.length > 0 ? (
                      recentResults.map((rec) => {
                        const patientName = rec.patientId?.name || 'Patient';
                        const fileName = rec.testName || 'Lab Report';
                        const type = getFileType(fileName);
                        const icon = getResultIcon(fileName);
                        const fileUrl = rec.fileUrl?.startsWith('http')
                          ? rec.fileUrl
                          : `${API_BASE}${rec.fileUrl}`;

                        return (
                          <div className="doc-dash-record-item" key={rec._id}>
                            <div className="doc-dash-record-item-left">
                              <div className={`doc-dash-record-icon-box ${type}`}>
                                <span className="material-symbols-outlined">{icon}</span>
                              </div>
                              <div className="doc-dash-record-text">
                                <p className="doc-dash-record-filename">{fileName}</p>
                                <p className="doc-dash-record-meta">
                                  {patientName} • {getTimeAgo(rec.uploadedAt || rec.createdAt)}
                                </p>
                              </div>
                            </div>
                            {rec.fileUrl ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="doc-dash-record-download-btn"
                                title="View Document"
                              >
                                <span className="material-symbols-outlined">download</span>
                              </a>
                            ) : (
                              <button className="doc-dash-record-download-btn" disabled>
                                <span className="material-symbols-outlined">download</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="doc-dash-empty-timeline">
                        <span className="material-symbols-outlined">description</span>
                        <p>No lab results uploaded yet.</p>
                      </div>
                    )}
                  </div>

                  <div className="doc-dash-storage-card">
                    <div className="doc-dash-storage-content">
                      <p className="doc-dash-storage-title">Records Storage</p>
                      <div className="doc-dash-storage-bar-bg">
                        <div
                          className="doc-dash-storage-bar-fg"
                          style={{ width: `${storageUsed}%` }}
                        />
                      </div>
                      <p className="doc-dash-storage-meta">
                        {allResults.length} files stored
                      </p>
                      <button
                        className="doc-dash-storage-btn"
                        onClick={() => navigate('/doctor/results')}
                      >
                        Review Results
                      </button>
                    </div>
                    <div className="doc-dash-storage-bg-icon">
                      <span className="material-symbols-outlined">cloud</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
