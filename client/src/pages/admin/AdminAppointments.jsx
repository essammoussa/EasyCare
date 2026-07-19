import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import AdminModal from '../../components/AdminModal';
import Toast from '../../components/Toast';
import {
  getAdminAppointments,
  updateAdminAppointment,
  deleteAdminAppointment
} from '../../services/api';
import './AdminAppointments.css';
import PageLoader from '../../components/PageLoader';
import Pagination from '../../components/Pagination';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Filters
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('All Doctors');

  // Modal states
  const [statusModal, setStatusModal] = useState({ isOpen: false, appointment: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, appointment: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await getAdminAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const handleStatusClick = (appointment) => {
    setNewStatus(appointment.status);
    setStatusModal({ isOpen: true, appointment });
  };

  const handleStatusSave = async () => {
    setIsSubmitting(true);
    try {
      await updateAdminAppointment(statusModal.appointment._id, { status: newStatus });
      const updatedAppointments = appointments.map(a =>
        a._id === statusModal.appointment._id
          ? { ...a, status: newStatus }
          : a
      );
      setAppointments(updatedAppointments);
      setStatusModal({ isOpen: false, appointment: null });
      showToast('Appointment status updated successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update appointment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (appointment) => {
    setDeleteModal({ isOpen: true, appointment });
  };

  const handleExportCSV = () => {
    if (!appointments || appointments.length === 0) {
      showToast('No appointments to export', 'error');
      return;
    }

    const headers = ['ID', 'Patient Name', 'Doctor Name', 'Date', 'Time', 'Status', 'Booked On'];
    const csvRows = [
      headers.join(','),
      ...appointments.map(app => {
        const slot = app.bookingId?.slotId;
        const appointmentDate = app.bookingId?.bookedAt || app.createdAt;
        return [
          app._id,
          `"${app.patientId?.name || 'Unknown'}"`,
          `"${app.doctorId?.userId?.name || 'Unknown'}"`,
          appointmentDate ? new Date(appointmentDate).toLocaleDateString() : 'N/A',
          slot ? `${slot.startTime} - ${slot.endTime}` : 'N/A',
          app.status,
          new Date(app.createdAt).toLocaleDateString()
        ].join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `appointments_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Appointments exported successfully', 'success');
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await deleteAdminAppointment(deleteModal.appointment._id);
      setAppointments(appointments.filter(a => a._id !== deleteModal.appointment._id));
      setDeleteModal({ isOpen: false, appointment: null });
      showToast('Appointment deleted successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete appointment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract unique doctor names for the filter dropdown
  const uniqueDoctors = [...new Set(
    appointments
      .map(app => app.doctorId?.userId?.name)
      .filter(Boolean)
  )];

  // Helper to parse the bookedAt date for filtering
  const getAppointmentDate = (app) => {
    const bookedAt = app.bookingId?.bookedAt || app.createdAt;
    if (!bookedAt) return null;
    const d = new Date(bookedAt);
    return isNaN(d.getTime()) ? null : d;
  };

  // Filter logic
  const filteredAppointments = appointments.filter((app) => {
    // Status filter
    if (statusFilter !== 'All Statuses' && app.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    // Doctor filter
    if (doctorFilter !== 'All Doctors' && app.doctorId?.userId?.name !== doctorFilter) {
      return false;
    }
    // Date range filter
    if (dateFrom || dateTo) {
      const appDate = getAppointmentDate(app);
      if (!appDate) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (appDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (appDate > to) return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const currentAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'status-badge-confirmed';
      case 'pending': return 'status-badge-pending';
      case 'completed': return 'status-badge-completed';
      case 'cancelled': return 'status-badge-cancelled';
      default: return 'status-badge-pending';
    }
  };

  return (
    <div className="admin-page-wrapper">
      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <AdminSidebar activePage="appointments" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="admin-content">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="admin-main admin-appointments-main">
          <div className="admin-container-lg">
            {/* Header Section */}
            <div className="appointments-page-header">
              <div>
                <h2>Appointments Management</h2>
                <p>Review and manage patient bookings across all departments.</p>
              </div>
              <div className="appointments-actions">
                <button className="btn-outline-pill" onClick={handleExportCSV}>
                  <span className="material-symbols-outlined">download</span>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Dashboard Statistics Bento */}
            <div className="appointments-stats-grid">
              <div className="app-stat-card">
                <div className="app-stat-header">
                  <div className="app-icon-wrap bg-light-blue color-primary-text">
                    <span className="material-symbols-outlined">calendar_today</span>
                  </div>
                  <span className="app-trend color-secondary-text">
                    <span className="material-symbols-outlined text-sm">trending_up</span> 12%
                  </span>
                </div>
                <p className="app-stat-label">Total Bookings</p>
                <h3>{appointments.length}</h3>
              </div>
              <div className="app-stat-card">
                <div className="app-stat-header">
                  <div className="app-icon-wrap bg-light-amber color-warning-text">
                    <span className="material-symbols-outlined">pending_actions</span>
                  </div>
                  <span className="app-trend color-danger-text">
                    <span className="material-symbols-outlined text-sm">trending_down</span> 4%
                  </span>
                </div>
                <p className="app-stat-label">Pending</p>
                <h3>{appointments.filter(a => a.status === 'pending').length}</h3>
              </div>
              <div className="app-stat-card">
                <div className="app-stat-header">
                  <div className="app-icon-wrap bg-light-teal color-secondary-text">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <span className="app-trend color-secondary-text">
                    <span className="material-symbols-outlined text-sm">trending_up</span> 8%
                  </span>
                </div>
                <p className="app-stat-label">Completed</p>
                <h3>{appointments.filter(a => a.status === 'completed').length}</h3>
              </div>
              <div className="app-stat-card">
                <div className="app-stat-header">
                  <div className="app-icon-wrap bg-light-red color-danger-text">
                    <span className="material-symbols-outlined">cancel</span>
                  </div>
                  <span className="app-trend color-slate-medium">Stable</span>
                </div>
                <p className="app-stat-label">Cancelled</p>
                <h3>{appointments.filter(a => a.status === 'cancelled').length}</h3>
              </div>
            </div>

            {/* Filters & Table Section */}
            <div className="appointments-table-wrapper">
              <div className="advanced-filters-bar">
                <div className="filter-group">
                  <label>Status Filter</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option>All Statuses</option>
                    <option>Pending</option>
                    <option>Confirmed</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>From Date</label>
                  <div className="input-with-icon">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
                <div className="filter-group">
                  <label>To Date</label>
                  <div className="input-with-icon">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
                <div className="filter-group">
                  <label>Doctor</label>
                  <select
                    value={doctorFilter}
                    onChange={(e) => {
                      setDoctorFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option>All Doctors</option>
                    {uniqueDoctors.map((name) => (
                      <option key={name} value={name}>Dr. {name}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-action">
                  <button
                    className="btn-icon-dark"
                    title="Clear all filters"
                    onClick={() => {
                      setStatusFilter('All Statuses');
                      setDateFrom('');
                      setDateTo('');
                      setDoctorFilter('All Doctors');
                      setCurrentPage(1);
                    }}
                  >
                    <span className="material-symbols-outlined">filter_list_off</span>
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Doctor</th>
                      <th>Date & Time</th>
                      <th>Booked On</th>
                      <th>Status</th>
                      <th className="align-text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6"><PageLoader message="Loading appointments..." /></td>
                      </tr>
                    ) : currentAppointments.length > 0 ? (
                      currentAppointments.map((app) => {
                        const slot = app.bookingId?.slotId;
                        const appointmentDate = app.bookingId?.bookedAt || app.createdAt;
                        return (
                          <tr key={app._id}>
                            <td>
                              <div className="patient-cell">
                                <div className="patient-avatar-sm bg-pale-blue color-primary-text">
                                  {app.patientId?.name?.charAt(0).toUpperCase() || 'P'}
                                </div>
                                <div>
                                  <p className="patient-name">{app.patientId?.name || 'Unknown'}</p>
                                  <p className="patient-id">#PAT-{app.patientId?._id?.substring(0, 4).toUpperCase() || '0000'}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="doctor-cell">
                                <div className="doc-avatar-sm">
                                  {app.doctorId?.userId?.name?.charAt(0).toUpperCase() || 'D'}
                                </div>
                                <span className="doc-name">Dr. {app.doctorId?.userId?.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td>
                              <p className="datetime-date">
                                {appointmentDate ? new Date(appointmentDate).toLocaleDateString() : 'N/A'}
                              </p>
                              <p className="datetime-time">
                                {slot ? `${slot.startTime} - ${slot.endTime}` : 'N/A'}
                              </p>
                            </td>
                            <td className="booking-date">{new Date(app.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge-modern ${getStatusClass(app.status)}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="align-text-right">
                              <div className="actions-cell">
                                <button
                                  className="action-btn color-slate-light"
                                  title="Change Status"
                                  onClick={() => handleStatusClick(app)}
                                >
                                  <span className="material-symbols-outlined">edit</span>
                                </button>
                                <button
                                  className="action-btn color-danger-text"
                                  title="Cancel Appointment"
                                  onClick={() => handleDeleteClick(app)}
                                >
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="align-text-center py-8 color-slate-medium">No appointments found.</td>
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
          </div>
        </main>
      </div>

      {/* Status Change Modal */}
      <AdminModal
        isOpen={statusModal.isOpen}
        title="Update Appointment Status"
        onClose={() => setStatusModal({ isOpen: false, appointment: null })}
        onConfirm={handleStatusSave}
        confirmText="Update Status"
        isLoading={isSubmitting}
      >
        <div className="admin-form-group">
          <label>New Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="admin-form-group">
          <label>Notes (Optional)</label>
          <textarea
            placeholder="Add notes about this status change..."
            style={{ minHeight: '100px', fontFamily: 'Manrope, sans-serif', padding: '12px', border: '1px solid #e0e2e9', borderRadius: '8px', resize: 'vertical' }}
          />
        </div>
      </AdminModal>

      {/* Delete Modal */}
      <AdminModal
        isOpen={deleteModal.isOpen}
        title="Cancel Appointment"
        onClose={() => setDeleteModal({ isOpen: false, appointment: null })}
        onConfirm={handleDeleteConfirm}
        confirmText="Cancel Appointment"
        isDangerous={true}
        isLoading={isSubmitting}
      >
        <p>
          Are you sure you want to cancel this appointment with <strong>{deleteModal.appointment?.patientId?.name}</strong>?
        </p>
        <p className="admin-modal-subtext">
          The patient will be notified of the cancellation. This action cannot be undone.
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