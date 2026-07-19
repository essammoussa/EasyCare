import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserAppointments, getPatientRecords, getPatientResults } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      try {
        const [appointmentsRes, recordsRes, resultsRes] = await Promise.all([
          getUserAppointments(),
          getPatientRecords(user._id),
          getPatientResults(user._id)
        ]);

        const appointmentsData = appointmentsRes.data.appointments || appointmentsRes.data || [];
        setAppointments(appointmentsData);

        const recordsData = recordsRes.data.records || recordsRes.data || [];
        setRecords(recordsData);

        const resultsData = resultsRes.data.results || resultsRes.data || [];
        setResults(resultsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const upcoming = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');

  const formatTime = (timeString) => {
    if (!timeString) return 'Time not set';
    // If already formatted with AM/PM (from slot), return as-is
    if (timeString.includes('AM') || timeString.includes('PM')) return timeString;
    try {
      const [hour, minute] = timeString.split(':');
      const h = parseInt(hour, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHour = h % 12 || 12;
      return `${formattedHour}:${minute} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-main">
        {/* Welcome Section */}
        <div className="dashboard-welcome">
          <div className="welcome-text-container">
            <h1 className="welcome-title">Welcome back, {user?.name || 'Patient'}</h1>
            <p className="welcome-subtitle">Manage your clinical visits and healthcare schedule in one place.</p>
          </div>
          <div className="welcome-id-tag">
            <span className="welcome-id-label">Patient ID</span>
            <span className="welcome-id-value">#{user?._id ? user._id.slice(-6).toUpperCase() : 'EC-0000'}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="dashboard-stats-grid">
          <div className="stat-card blue-theme" onClick={() => navigate('/patient/appointments')}>
            <div className="stat-icon-wrapper">
              <span className="material-symbols-outlined icon-fill">calendar_month</span>
            </div>
            <div className="stat-info">
              <p className="stat-label">Upcoming Appointments</p>
              <h3 className="stat-value">{upcoming.length}</h3>
            </div>
          </div>

          <div className="stat-card teal-theme" onClick={() => navigate('/patient/records')}>
            <div className="stat-icon-wrapper">
              <span className="material-symbols-outlined icon-fill">description</span>
            </div>
            <div className="stat-info">
              <p className="stat-label">Medical Records</p>
              <h3 className="stat-value">{records.length}</h3>
            </div>
          </div>

          <div className="stat-card orange-theme" onClick={() => navigate('/patient/upload')}>
            <div className="stat-icon-wrapper">
              <span className="material-symbols-outlined icon-fill">upload_file</span>
            </div>
            <div className="stat-info">
              <p className="stat-label">Uploaded Results</p>
              <h3 className="stat-value">{results.length}</h3>
            </div>
          </div>

          <div className="stat-card purple-theme" onClick={() => navigate('/patient/chat')}>
            <div className="stat-icon-wrapper">
              <span className="material-symbols-outlined icon-fill">chat</span>
            </div>
            <div className="stat-info">
              <p className="stat-label">Messages</p>
              <h3 className="stat-value">Chat</h3>
            </div>
          </div>
        </section>

        {/* Loading & Error States */}
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="dashboard-content-layout">

            {/* Left Column: Upcoming Appointments */}
            <div className="dashboard-section-column">
              <div className="section-header-row">
                <h2 className="section-heading-title">Upcoming Appointments</h2>
                <Link to="/patient/appointments" className="section-action-link">See all appointments</Link>
              </div>

              {upcoming.length > 0 ? (
                <div className="appointments-list-container">
                  {upcoming.slice(0, 3).map((appointment) => {
                    const doc = appointment.doctorId;
                    const docName = doc?.userId?.name || 'Doctor';
                    const specialty = doc?.specialty || 'General Practitioner';
                    const avatarPath = doc?.userId?.profilePicture || '';
                    const avatar = avatarPath
                      ? (avatarPath.startsWith('http') ? avatarPath : `http://localhost:5000${avatarPath}`)
                      : null;
                    const appointmentDate = appointment.bookingId?.bookedAt || appointment.createdAt;
                    const appointmentTime = appointment.bookingId?.slotId?.startTime || null;

                    return (
                      <div key={appointment._id} className="appointment-premium-card">
                        {avatar ? (
                          <img src={avatar} alt={docName} className="appointment-doc-avatar" />
                        ) : (
                          <div className="appointment-doc-avatar-placeholder">
                            <span className="material-symbols-outlined">person</span>
                          </div>
                        )}
                        <div className="appointment-info-content">
                          <div className="appointment-badge-row">
                            <span className={`status-badge-capsule ${appointment.status}`}>
                              {appointment.status}
                            </span>
                            <span className="appointment-specialty-text">• {specialty}</span>
                          </div>
                          <h4 className="appointment-doc-name">Dr. {docName}</h4>
                          <div className="appointment-time-details">
                            <div className="detail-item">
                              <span className="material-symbols-outlined">calendar_today</span>
                              <span>{formatDate(appointmentDate)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="material-symbols-outlined">schedule</span>
                              <span>{formatTime(appointmentTime)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          className="appointment-action-btn"
                          onClick={() => navigate('/patient/appointments')}
                        >
                          View Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state-panel">
                  <span className="material-symbols-outlined">event_busy</span>
                  <p>No upcoming appointments scheduled.</p>
                  <Link to="/doctors" className="empty-state-btn">Find a Doctor</Link>
                </div>
              )}
            </div>

            {/* Right Column: Recent Medical Records */}
            <div className="dashboard-section-column">
              <div className="section-header-row">
                <h2 className="section-heading-title">Recent Medical Records</h2>
                <Link to="/patient/records" className="section-action-link">See all records</Link>
              </div>

              {records.length > 0 ? (
                <div className="medical-records-table-container">
                  <table className="premium-dashboard-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Doctor</th>
                        <th>Diagnosis Summary</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.slice(0, 3).map((record) => {
                        const recDate = record.visitDate || record.createdAt;
                        const doc = record.doctorId;
                        const docName = doc?.userId?.name || 'Doctor';
                        const diagSummary = record.diagnosis || 'Routine checkup';

                        return (
                          <tr key={record._id}>
                            <td>
                              <span className="table-date-text">{formatDate(recDate)}</span>
                            </td>
                            <td>
                              <div className="table-doc-profile">
                                <div className="doc-letter-avatar">
                                  {docName.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="table-doc-name">Dr. {docName}</span>
                              </div>
                            </td>
                            <td>
                              <p className="table-diagnosis-snippet">
                                {diagSummary.length > 60 ? `${diagSummary.slice(0, 60)}...` : diagSummary}
                              </p>
                            </td>
                            <td className="text-right">
                              <button
                                className="table-download-btn"
                                onClick={() => navigate('/patient/records')}
                                title="View Record Details"
                              >
                                <span className="material-symbols-outlined">visibility</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-panel">
                  <span className="material-symbols-outlined">folder_open</span>
                  <p>No medical records on file.</p>
                </div>
              )}
            </div>

            {/* Grid Banners */}
            <section className="dashboard-banners-grid">
              <div className="banner-glass-card hover-glow">
                <div className="banner-text-content">
                  <h3 className="banner-title">Need a Specialist?</h3>
                  <p className="banner-description">Browse through our network of over 500+ verified doctors across all specialties.</p>
                  <button className="banner-btn" onClick={() => navigate('/doctors')}>
                    Find Now <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
                <div className="banner-icon-bg">
                  <span className="material-symbols-outlined">medical_services</span>
                </div>
              </div>

              <div className="banner-dashed-card hover-border" onClick={() => navigate('/patient/upload')}>
                <div className="dashed-card-icon-wrapper">
                  <span className="material-symbols-outlined">cloud_upload</span>
                </div>
                <div className="dashed-card-text">
                  <h4 className="dashed-card-title">Upload Lab Results</h4>
                  <p className="dashed-card-subtitle">Drag and drop or browse files (PDF, JPG, PNG)</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
