import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import AdminModal from '../../components/AdminModal';
import Toast from '../../components/Toast';
import {
  getAdminDoctors,
  createAdminDoctor,
  updateAdminDoctor,
  verifyAdminDoctor,
  toggleAdminDoctorStatus,
  deleteAdminDoctor
} from '../../services/api';
import './AdminDoctors.css';
import PageLoader from '../../components/PageLoader';
import Pagination from '../../components/Pagination';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editFormData, setEditFormData] = useState({});
  const [addModal, setAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: '', email: '', password: '', specialty: '', clinic: '', experience: 0 });
  const itemsPerPage = 10;

  // Modal states
  const [editModal, setEditModal] = useState({ isOpen: false, doctor: null });
  const [verifyModal, setVerifyModal] = useState({ isOpen: false, doctor: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, doctor: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, doctor: null });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data } = await getAdminDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      showToast('Failed to load doctors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const handleAddClick = () => {
    setAddFormData({ name: '', email: '', password: '', specialty: '', clinic: '', experience: 0 });
    setAddModal(true);
  };

  const handleAddSave = async () => {
    if (!addFormData.name || !addFormData.email || !addFormData.specialty) {
      showToast('Please fill in name, email, and specialty', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await createAdminDoctor(addFormData);
      setDoctors([data, ...doctors]);
      setAddModal(false);
      showToast('Doctor created successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create doctor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (doctors.length === 0) return;

    const headers = ['ID', 'Name', 'Specialty', 'Clinic', 'Experience', 'Status', 'Verified'];
    const csvRows = [headers.join(',')];

    doctors.forEach(d => {
      const row = [
        d._id,
        `"Dr. ${d.userId?.name || ''}"`,
        `"${d.specialty || ''}"`,
        `"${d.clinic || ''}"`,
        d.experience || 0,
        d.isActive ? 'Active' : 'Inactive',
        d.isVerified ? 'Yes' : 'No'
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "easycare_doctors_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export started', 'success');
  };

  const handleEditClick = (doctor) => {
    setEditFormData({
      specialty: doctor.specialty,
      clinic: doctor.clinic,
      experience: doctor.experience,
    });
    setEditModal({ isOpen: true, doctor });
  };

  const handleEditSave = async () => {
    setIsSubmitting(true);
    try {
      await updateAdminDoctor(editModal.doctor._id, editFormData);
      const updatedDoctors = doctors.map(d =>
        d._id === editModal.doctor._id
          ? { ...d, ...editFormData }
          : d
      );
      setDoctors(updatedDoctors);
      setEditModal({ isOpen: false, doctor: null });
      showToast('Doctor updated successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update doctor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyClick = (doctor) => {
    setVerifyModal({ isOpen: true, doctor });
  };

  const handleVerifyConfirm = async () => {
    setIsSubmitting(true);
    try {
      await verifyAdminDoctor(verifyModal.doctor._id);
      const updatedDoctors = doctors.map(d =>
        d._id === verifyModal.doctor._id
          ? { ...d, isVerified: true }
          : d
      );
      setDoctors(updatedDoctors);
      setVerifyModal({ isOpen: false, doctor: null });
      showToast('Doctor verified successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to verify doctor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (doctor) => {
    setStatusModal({ isOpen: true, doctor });
  };

  const handleToggleStatusConfirm = async () => {
    setIsSubmitting(true);
    try {
      await toggleAdminDoctorStatus(statusModal.doctor._id);
      const updatedDoctors = doctors.map(d =>
        d._id === statusModal.doctor._id
          ? { ...d, isActive: !d.isActive }
          : d
      );
      setDoctors(updatedDoctors);
      setStatusModal({ isOpen: false, doctor: null });
      const action = statusModal.doctor.isActive ? 'deactivated' : 'activated';
      showToast(`Doctor ${action} successfully`, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update doctor status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (doctor) => {
    setDeleteModal({ isOpen: true, doctor });
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await deleteAdminDoctor(deleteModal.doctor._id);
      setDoctors(doctors.filter(d => d._id !== deleteModal.doctor._id));
      setDeleteModal({ isOpen: false, doctor: null });
      if (selectedDoctor && selectedDoctor._id === deleteModal.doctor._id) {
        setSelectedDoctor(null);
      }
      showToast('Doctor deleted successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete doctor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredDoctors = doctors.filter((doc) => {
    const nameMatch = doc.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const specMatch = doc.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
    const searchMatch = nameMatch || specMatch;

    if (activeTab === 'On-Duty') {
      return searchMatch && doc.isActive;
    }
    return searchMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const currentDoctors = filteredDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic statistics
  const activeDoctorsCount = doctors.filter(doc => doc.isActive).length;
  const pendingVerificationCount = doctors.filter(doc => !doc.isVerified).length;
  const averageRating = doctors.length > 0
    ? (doctors.reduce((acc, doc) => acc + (doc.rating || 0), 0) / doctors.length).toFixed(2)
    : '0.00';

  return (
    <div className="admin-page-wrapper">
      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <AdminSidebar activePage="doctors" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="admin-content">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="admin-main admin-doctors-main">
          {/* Page Title & Actions */}
          <div className="doctors-page-header">
            <div>
              <h2>Doctors Management</h2>
              <p>Manage medical professionals, monitor performance, and hospital affiliations.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-outline flex-btn shadow-lg" onClick={handleExport}>
                <span className="material-symbols-outlined">file_download</span>
                Export List
              </button>
              <button className="btn-primary flex-btn shadow-lg" onClick={handleAddClick}>
                <span className="material-symbols-outlined">add</span>
                Add New Doctor
              </button>
            </div>
          </div>

          {/* Dashboard Stats Overviews */}
          <div className="doctors-stats-grid">
            <div className="doctors-stat-card">
              <div className="stat-icon-square bg-primary-light color-primary-text">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
              </div>
              <div>
                <p className="stat-label">TOTAL DOCTORS</p>
                <h3>{doctors.length}</h3>
              </div>
            </div>
            <div className="doctors-stat-card">
              <div className="stat-icon-square bg-secondary-light color-secondary-text">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div>
                <p className="stat-label">ACTIVE STATUS</p>
                <h3>{activeDoctorsCount}</h3>
              </div>
            </div>
            <div className="doctors-stat-card">
              <div className="stat-icon-square bg-warning-light color-warning-text">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
              </div>
              <div>
                <p className="stat-label">PENDING APPROVAL</p>
                <h3>{pendingVerificationCount}</h3>
              </div>
            </div>
            <div className="doctors-stat-card">
              <div className="stat-icon-square bg-tertiary-light color-tertiary-text">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <div>
                <p className="stat-label">AVG RATING</p>
                <h3>{averageRating}</h3>
              </div>
            </div>
          </div>

          {/* Main Table Section */}
          <div className="doctors-table-container">
            <div className="doctors-table-header">
              <div className="search-input-wrapper">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="search-input"
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="doctors-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialty</th>
                    <th>Clinic</th>
                    <th className="align-text-center">Rating</th>
                    <th className="align-text-center">Experience</th>
                    <th className="align-text-center">Status</th>
                    <th className="align-text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7">
                        <PageLoader message="Loading doctors..." />
                      </td>
                    </tr>
                  ) : currentDoctors.length > 0 ? (
                    currentDoctors.map((doc) => (
                      <tr
                        key={doc._id}
                        className="doctor-row"
                        onClick={() => setSelectedDoctor(doc)}
                      >
                        <td>
                          <div className="doctor-profile-cell">
                            <div className="doctor-avatar">
                              {doc.userId?.name?.charAt(0).toUpperCase() || 'D'}
                            </div>
                            <div className="doctor-info">
                              <p className="doc-name">Dr. {doc.userId?.name}</p>
                              <p className="doc-id">#{doc._id.substring(0, 6).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="specialty-badge">{doc.specialty}</span>
                        </td>
                        <td>
                          <p className="clinic-text">{doc.clinic || '-'}</p>
                        </td>
                        <td className="align-text-center">
                          <div className="rating-cell">
                            <span className="material-symbols-outlined icon-star">star</span>
                            <span className="rating-value">{doc.rating || '0.0'}</span>
                          </div>
                        </td>
                        <td className="align-text-center">
                          <span className="experience-value">{doc.experience || 0} years</span>
                        </td>
                        <td className="align-text-center">
                          <span className={`status-badge-pill ${doc.isActive ? 'confirmed' : 'cancelled'}`}>
                            {doc.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="align-text-right">
                          <div className="actions-cell" onClick={e => e.stopPropagation()}>
                            <button
                              className="action-btn color-primary-text"
                              title="Edit Doctor Profile"
                              onClick={() => handleEditClick(doc)}
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            {!doc.isVerified && (
                              <button
                                className="action-btn color-secondary-text"
                                title="Verify Doctor"
                                onClick={() => handleVerifyClick(doc)}
                              >
                                <span className="material-symbols-outlined">verified</span>
                              </button>
                            )}
                            <button
                              className={`action-btn ${doc.isActive ? 'color-warning-text' : 'text-success'}`}
                              title={doc.isActive ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleStatus(doc)}
                            >
                              <span className="material-symbols-outlined">
                                {doc.isActive ? 'pause_circle' : 'check_circle'}
                              </span>
                            </button>
                            <button
                              className="action-btn color-danger-text"
                              title="Delete Profile"
                              onClick={() => handleDeleteClick(doc)}
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        <p>No doctors found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </main>
      </div>

      {/* Side Drawer for Doctor Details */}
      <div
        className={`drawer-overlay ${selectedDoctor ? 'open' : ''}`}
        onClick={() => setSelectedDoctor(null)}
      ></div>
      <div className={`side-drawer ${selectedDoctor ? 'open' : ''}`}>
        <div className="drawer-header">
          <button className="drawer-close" onClick={() => setSelectedDoctor(null)}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="drawer-profile-info">
            <div className="drawer-avatar-wrap">
              <div className="drawer-avatar-large">
                {selectedDoctor?.userId?.name?.charAt(0).toUpperCase()}
              </div>
              {selectedDoctor?.isActive && <div className="status-dot-large"></div>}
            </div>
            <h3>Dr. {selectedDoctor?.userId?.name}</h3>
            <p className="role-text">{selectedDoctor?.specialty}</p>
            <div className="drawer-stats">
              <div className="stat-block">
                <p className="stat-label">Experience</p>
                <p className="stat-value">{selectedDoctor?.experience} Years</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-block">
                <p className="stat-label">Patient Rating</p>
                <p className="stat-value">{selectedDoctor?.rating || 4}/5</p>
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-content">
          <section className="drawer-section">
            <h4>Doctor Details</h4>
            <div className="details-list">
              <div className="detail-row">
                <span className="label">Main Clinic</span>
                <span className="value">{selectedDoctor?.clinic || 'Main City Hospital'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email</span>
                <span className="value">{selectedDoctor?.userId?.email || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status</span>
                <span className={`value ${selectedDoctor?.isActive ? 'text-success' : 'color-danger-text'}`}>
                  {selectedDoctor?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Verified</span>
                <span className={`value ${selectedDoctor?.isVerified ? 'color-primary-text' : 'color-warning-text'}`}>
                  {selectedDoctor?.isVerified ? 'Yes' : 'Pending'}
                </span>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h4>Performance Analytics</h4>
            <div className="analytics-grid">
              <div className="analytics-card">
                <p>Completion Rate</p>
                <h5 className="color-secondary-text">98.2%</h5>
              </div>
              <div className="analytics-card">
                <p>Avg. Session</p>
                <h5 className="color-primary-text">22m</h5>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h4>Location Map</h4>
            <div className="map-placeholder">
              <div className="map-overlay">
                <div className="map-pin">
                  <span className="material-symbols-outlined" style={{ color: '#EF4444' }}>location_on</span>
                  <span>{selectedDoctor?.clinic || 'Main City Hospital'}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="drawer-footer">
          <button className="btn-outline-full" onClick={() => {
            if (selectedDoctor) {
              handleEditClick(selectedDoctor);
              setSelectedDoctor(null);
            }
          }}>Edit Doctor</button>
          <button
            className={`btn-${selectedDoctor?.isActive ? 'danger' : 'success'}-full`}
            onClick={() => {
              if (selectedDoctor) {
                handleToggleStatus(selectedDoctor);
                setSelectedDoctor(null);
              }
            }}
          >
            {selectedDoctor?.isActive ? 'Deactivate' : 'Activate'} Doctor
          </button>
        </div>
      </div>

      {/* Add Modal */}
      <AdminModal
        isOpen={addModal}
        title="Add New Doctor"
        onClose={() => setAddModal(false)}
        onConfirm={handleAddSave}
        confirmText="Create Doctor"
        isLoading={isSubmitting}
      >
        <div className="admin-form-group">
          <label>Name</label>
          <input
            type="text"
            value={addFormData.name}
            onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
            placeholder="Dr. Name"
          />
        </div>
        <div className="admin-form-group">
          <label>Email</label>
          <input
            type="email"
            value={addFormData.email}
            onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
            placeholder="doctor@example.com"
          />
        </div>
        <div className="admin-form-group">
          <label>Password (optional)</label>
          <input
            type="password"
            value={addFormData.password}
            onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
            placeholder="Leave blank for default"
          />
        </div>
        <div className="admin-form-group">
          <label>Specialty</label>
          <input
            type="text"
            value={addFormData.specialty}
            onChange={(e) => setAddFormData({ ...addFormData, specialty: e.target.value })}
            placeholder="e.g., Cardiology"
          />
        </div>
        <div className="admin-form-group">
          <label>Clinic</label>
          <input
            type="text"
            value={addFormData.clinic}
            onChange={(e) => setAddFormData({ ...addFormData, clinic: e.target.value })}
            placeholder="Hospital or clinic name"
          />
        </div>
        <div className="admin-form-group">
          <label>Years of Experience</label>
          <input
            type="number"
            value={addFormData.experience}
            onChange={(e) => setAddFormData({ ...addFormData, experience: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </AdminModal>

      {/* Edit Modal */}
      <AdminModal
        isOpen={editModal.isOpen}
        title="Edit Doctor Profile"
        onClose={() => setEditModal({ isOpen: false, doctor: null })}
        onConfirm={handleEditSave}
        confirmText="Save Changes"
        isLoading={isSubmitting}
      >
        <div className="admin-form-group">
          <label>Specialty</label>
          <input
            type="text"
            value={editFormData.specialty || ''}
            onChange={(e) => setEditFormData({ ...editFormData, specialty: e.target.value })}
            placeholder="e.g., Cardiology"
          />
        </div>
        <div className="admin-form-group">
          <label>Clinic</label>
          <input
            type="text"
            value={editFormData.clinic || ''}
            onChange={(e) => setEditFormData({ ...editFormData, clinic: e.target.value })}
            placeholder="Hospital or clinic name"
          />
        </div>
        <div className="admin-form-group">
          <label>Years of Experience</label>
          <input
            type="number"
            value={editFormData.experience || 0}
            onChange={(e) => setEditFormData({ ...editFormData, experience: parseInt(e.target.value) })}
            placeholder="0"
          />
        </div>
      </AdminModal>

      {/* Verify Modal */}
      <AdminModal
        isOpen={verifyModal.isOpen}
        title="Verify Doctor"
        onClose={() => setVerifyModal({ isOpen: false, doctor: null })}
        onConfirm={handleVerifyConfirm}
        confirmText="Verify Doctor"
        isLoading={isSubmitting}
      >
        <p>
          Are you sure you want to verify <strong>Dr. {verifyModal.doctor?.userId?.name}</strong>?
        </p>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '12px' }}>
          This doctor will be marked as verified and their profile will be highlighted as trusted.
        </p>
      </AdminModal>

      {/* Status Modal */}
      <AdminModal
        isOpen={statusModal.isOpen}
        title={statusModal.doctor?.isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
        onClose={() => setStatusModal({ isOpen: false, doctor: null })}
        onConfirm={handleToggleStatusConfirm}
        confirmText={statusModal.doctor?.isActive ? 'Deactivate' : 'Activate'}
        isDangerous={statusModal.doctor?.isActive}
        isLoading={isSubmitting}
      >
        <p>
          Are you sure you want to {statusModal.doctor?.isActive ? 'deactivate' : 'activate'} <strong>Dr. {statusModal.doctor?.userId?.name}</strong>?
        </p>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '12px' }}>
          {statusModal.doctor?.isActive
            ? 'This doctor will not be able to accept new appointments.'
            : 'This doctor will be able to accept new appointments again.'}
        </p>
      </AdminModal>

      {/* Delete Modal */}
      <AdminModal
        isOpen={deleteModal.isOpen}
        title="Delete Doctor"
        onClose={() => setDeleteModal({ isOpen: false, doctor: null })}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete Doctor"
        isDangerous={true}
        isLoading={isSubmitting}
      >
        <p>
          Are you sure you want to delete <strong>Dr. {deleteModal.doctor?.userId?.name}</strong>?
        </p>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '12px' }}>
          This action cannot be undone. All associated data will be deleted.
        </p>
      </AdminModal>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
