import { useState, useEffect } from 'react';
import { getDoctorResults, updateResultStatus } from '../../services/api';
import DoctorSidebar from '../../components/DoctorSidebar';
import DoctorHeader from '../../components/DoctorHeader';
import './Doctor.css';
import './DoctorResults.css';

const API_BASE = 'http://localhost:5000';

export default function DoctorResults() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState([]);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchResults = async () => {
    try {
      const { data } = await getDoctorResults();
      const list = data || [];
      list.sort((a, b) => new Date(b.uploadedAt || b.createdAt) - new Date(a.uploadedAt || a.createdAt));
      setAllResults(list);
    } catch (err) {
      setError('Failed to load lab results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleValidate = async (resultId) => {
    setValidating(resultId);
    try {
      const { data } = await updateResultStatus(resultId, 'reviewed');
      setAllResults((prev) =>
        prev.map((r) => (r._id === resultId ? { ...r, status: data.status } : r))
      );
    } catch (err) {
      setError('Failed to validate result.');
    } finally {
      setValidating(null);
    }
  };

  const getResultDate = (res) => res.uploadedAt || res.createdAt;

  const filteredResults = allResults.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return !r.status || r.status === 'pending';
    return r.status === statusFilter;
  });

  const stats = {
    total: allResults.length,
    pending: allResults.filter((r) => !r.status || r.status === 'pending').length,
    validated: allResults.filter((r) => r.status === 'reviewed').length,
    urgent: allResults.filter((r) => r.status === 'urgent').length,
  };

  const bentoResults = filteredResults
    .filter((r) => !r.status || r.status === 'pending')
    .slice(0, 6);
  const historyResults = filteredResults.filter((r) => r.status && r.status !== 'pending');

  const getResultIcon = (testName = '') => {
    const name = testName.toLowerCase();
    if (name.includes('blood') || name.includes('cbc') || name.includes('hemoglobin')) return 'bloodtype';
    if (name.includes('xray') || name.includes('x-ray') || name.includes('mri') || name.includes('scan')) return 'radiology';
    if (name.includes('urine') || name.includes('metabolic')) return 'water_drop';
    return 'description';
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="doctor-page-wrapper">
      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <DoctorSidebar
        activePage="results"
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="doctor-content">
        <DoctorHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="doctor-main doc-results-main">
          <div className="doc-results-header-row">
            <div>
              <h2 className="doc-results-title">Lab Results Review</h2>
              <p className="doc-results-subtitle">
                Manage and validate pending diagnostic reports from patient uploads.
              </p>
            </div>
            <div className="doc-results-header-actions">
              <div className="doc-results-filter-wrapper">
                <button
                  className="doc-results-filter-btn"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <span className="material-symbols-outlined">filter_list</span>
                  {statusFilter === 'all' ? 'Filter' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </button>
                {filterOpen && (
                  <div className="doc-results-filter-menu">
                    {['all', 'pending', 'reviewed', 'urgent'].map((f) => (
                      <button
                        key={f}
                        className={statusFilter === f ? 'active' : ''}
                        onClick={() => { setStatusFilter(f); setFilterOpen(false); }}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="doctor-spinner-container">
              <div className="doctor-spinner" />
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="doc-results-stats-grid">
                <div className="doc-results-stat-card">
                  <div className="doc-results-stat-icon-box blue">
                    <span className="material-symbols-outlined">inbox</span>
                  </div>
                  <div>
                    <p className="doc-results-stat-label">Total Received</p>
                    <p className="doc-results-stat-value">{stats.total}</p>
                  </div>
                </div>

                <div className="doc-results-stat-card">
                  <div className="doc-results-stat-icon-box amber">
                    <span className="material-symbols-outlined">pending_actions</span>
                  </div>
                  <div>
                    <p className="doc-results-stat-label">Pending Review</p>
                    <p className="doc-results-stat-value">{stats.pending}</p>
                  </div>
                </div>

                <div className="doc-results-stat-card">
                  <div className="doc-results-stat-icon-box teal">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <p className="doc-results-stat-label">Validated</p>
                    <p className="doc-results-stat-value">{stats.validated}</p>
                  </div>
                </div>

                <div className="doc-results-stat-card">
                  <div className="doc-results-stat-icon-box red">
                    <span className="material-symbols-outlined">priority_high</span>
                  </div>
                  <div>
                    <p className="doc-results-stat-label">Urgent Action</p>
                    <p className="doc-results-stat-value">{stats.urgent}</p>
                  </div>
                </div>
              </div>

              {bentoResults.length > 0 && (
                <>
                  <h3 className="doc-results-section-title">Pending Review</h3>
                  <div className="doc-results-bento-grid">
                    {bentoResults.map((res) => {
                      const patientName = res.patientId?.name || 'Patient';
                      const initials = patientName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                      const isValidating = validating === res._id;
                      const isReviewed = res.status === 'reviewed';

                      return (
                        <div
                          key={res._id}
                          className={`doc-results-bento-card ${isReviewed ? 'reviewed' : ''}`}
                        >
                          <div className="doc-results-bento-card-header">
                            <div className="doc-results-bento-patient">
                              {res.patientId?.profilePicture ? (
                                <img
                                  src={
                                    res.patientId.profilePicture.startsWith('http')
                                      ? res.patientId.profilePicture
                                      : `${API_BASE}${res.patientId.profilePicture}`
                                  }
                                  alt={patientName}
                                  className="doc-results-bento-avatar"
                                />
                              ) : (
                                <div className="doc-results-bento-avatar-fallback">{initials}</div>
                              )}
                              <div>
                                <h3 className="doc-results-bento-patient-name">{patientName}</h3>
                                <p className="doc-results-bento-patient-id">
                                  ID: #{res.patientId?._id?.slice(-4) || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <span className={`doc-results-status-badge ${isReviewed ? 'badge-reviewed' : 'badge-pending'}`}>
                              {isReviewed ? 'Reviewed' : 'Pending'}
                            </span>
                          </div>

                          <div className="doc-results-file-row">
                            <span className="material-symbols-outlined doc-results-file-icon">
                              {getResultIcon(res.testName)}
                            </span>
                            <div className="doc-results-file-info">
                              <p className="doc-results-file-name">{res.testName || 'Lab Report'}</p>
                              <p className="doc-results-file-time">{getTimeAgo(getResultDate(res))}</p>
                            </div>
                          </div>

                          <div className="doc-results-bento-actions">
                            {res.fileUrl && (
                              <a
                                href={
                                  res.fileUrl.startsWith('http')
                                    ? res.fileUrl
                                    : `${API_BASE}${res.fileUrl}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className={`doc-results-view-btn ${isReviewed ? 'outline' : 'solid'}`}
                              >
                                View File
                              </a>
                            )}
                            <button
                              className={`doc-results-validate-btn ${isReviewed ? 'validated' : ''}`}
                              onClick={() => !isReviewed && handleValidate(res._id)}
                              disabled={isValidating || isReviewed}
                              title={isReviewed ? 'Already Reviewed' : 'Mark as Reviewed'}
                            >
                              {isValidating ? (
                                <div className="doc-results-mini-spinner" />
                              ) : (
                                <span className="material-symbols-outlined">check_circle</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="doc-results-history-panel">
                <div className="doc-results-history-header">
                  <h3>History</h3>
                </div>
                <div className="doc-results-history-table-wrapper">
                  <table className="doc-results-history-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Test Type</th>
                        <th>Status</th>
                        <th>Date Uploaded</th>
                        <th className="doc-results-table-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyResults.length > 0 ? (
                        historyResults.map((res) => {
                          const patientName = res.patientId?.name || 'Patient';
                          const initials = patientName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                          const uploadDate = new Date(getResultDate(res)).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          });

                          return (
                            <tr key={res._id} className="doc-results-history-row">
                              <td>
                                <div className="doc-results-table-patient">
                                  <div className="doc-results-table-avatar">{initials}</div>
                                  <span>{patientName}</span>
                                </div>
                              </td>
                              <td>{res.testName || 'Lab Report'}</td>
                              <td>
                                <span className={`doc-results-table-badge ${
                                  res.status === 'reviewed' ? 'badge-reviewed' :
                                  res.status === 'urgent' ? 'badge-urgent' : 'badge-pending'
                                }`}>
                                  {res.status || 'Pending'}
                                </span>
                              </td>
                              <td>{uploadDate}</td>
                              <td className="doc-results-table-actions">
                                {res.fileUrl && (
                                  <a
                                    href={
                                      res.fileUrl.startsWith('http')
                                        ? res.fileUrl
                                        : `${API_BASE}${res.fileUrl}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="doc-results-more-btn"
                                    title="View file"
                                  >
                                    <span className="material-symbols-outlined">visibility</span>
                                  </a>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="doc-results-table-empty">
                            No reviewed results yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
