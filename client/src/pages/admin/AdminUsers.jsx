import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import AdminModal from '../../components/AdminModal';
import Toast from '../../components/Toast';
import { 
  getAdminUsers, 
  createAdminUser,
  updateAdminUser, 
  deleteAdminUser, 
  toggleAdminUserStatus 
} from '../../services/api';
import './AdminUsers.css';
import PageLoader from '../../components/PageLoader';
import Pagination from '../../components/Pagination';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Modal states
  const [editModal, setEditModal] = useState({ isOpen: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [statusModalAction, setStatusModalAction] = useState({ isOpen: false, user: null });
  const [addModal, setAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [addFormData, setAddFormData] = useState({ name: '', email: '', role: 'patient', password: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await getAdminUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const handleAddClick = () => {
    setAddFormData({ name: '', email: '', role: 'patient', password: '' });
    setAddModal(true);
  };

  const handleAddSave = async () => {
    if (!addFormData.name || !addFormData.email) {
      showToast('Please fill in name and email', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data } = await createAdminUser(addFormData);
      setUsers([data, ...users]);
      setAddModal(false);
      showToast('User created successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (users.length === 0) return;
    
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const csvRows = [headers.join(',')];
    
    users.forEach(u => {
      const row = [
        u._id,
        `"${u.name}"`,
        `"${u.email}"`,
        u.role,
        u.isActive ? 'Active' : 'Inactive',
        new Date(u.createdAt).toLocaleDateString()
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "easycare_users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export started', 'success');
  };

  const handleEditClick = (user) => {
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setEditModal({ isOpen: true, user });
  };

  const handleEditSave = async () => {
    if (!editFormData.name || !editFormData.email) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateAdminUser(editModal.user._id, editFormData);
      const updatedUsers = users.map(u => 
        u._id === editModal.user._id 
          ? { ...u, ...editFormData }
          : u
      );
      setUsers(updatedUsers);
      setEditModal({ isOpen: false, user: null });
      showToast('User updated successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteModal({ isOpen: true, user });
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await deleteAdminUser(deleteModal.user._id);
      setUsers(users.filter(u => u._id !== deleteModal.user._id));
      setDeleteModal({ isOpen: false, user: null });
      showToast('User deleted successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (user) => {
    setStatusModalAction({ isOpen: true, user });
  };

  const handleToggleStatusConfirm = async () => {
    setIsSubmitting(true);
    try {
      await toggleAdminUserStatus(statusModalAction.user._id);
      const updatedUsers = users.map(u => 
        u._id === statusModalAction.user._id 
          ? { ...u, isActive: !u.isActive }
          : u
      );
      setUsers(updatedUsers);
      setStatusModalAction({ isOpen: false, user: null });
      const action = statusModalAction.user.isActive ? 'deactivated' : 'activated';
      showToast(`User ${action} successfully`, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'badge-admin';
      case 'doctor': return 'badge-doctor';
      default: return 'badge-patient';
    }
  };

  // Filter logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Map dropdown roles to backend roles
    let mappedRole = roleFilter;
    if (roleFilter === 'Administrator') mappedRole = 'admin';
    if (roleFilter === 'Doctor') mappedRole = 'doctor';
    if (roleFilter === 'Patient') mappedRole = 'patient';

    const matchesRole = roleFilter === 'All Roles' || user.role === mappedRole;
    return matchesSearch && matchesRole;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate dynamic stats
  const activeUsersCount = users.filter(u => u.isActive).length;
  const pendingApprovalCount = users.filter(u => !u.isActive).length;

  return (
    <div className="admin-page-wrapper">
      {mobileMenuOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <AdminSidebar activePage="users" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="admin-content">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="admin-main admin-users-main">
          {/* Page Header */}
          <div className="users-page-header">
            <div>
              <h2>Users Management</h2>
              <p>Manage and monitor platform access for all healthcare professionals and staff.</p>
            </div>
            <div className="users-header-actions">
              <button className="btn-outline" onClick={handleExport}>
                <span className="material-symbols-outlined">file_download</span>
                Export List
              </button>
              <button className="btn-primary" onClick={handleAddClick}>
                <span className="material-symbols-outlined">person_add</span>
                Add New User
              </button>
            </div>
          </div>

          {/* Dashboard Stats Summary */}
          <div className="users-stats-grid">
            <div className="users-stat-card">
              <div className="stat-card-top">
                <div>
                  <p className="stat-label">TOTAL USERS</p>
                  <h3>{users.length}</h3>
                </div>
                <div className="stat-icon bg-primary-light color-primary-text">
                  <span className="material-symbols-outlined">group</span>
                </div>
              </div>
              <p className="stat-trend trend-up">
                <span className="material-symbols-outlined">trending_up</span>
                +4.2% from last month
              </p>
            </div>
            <div className="users-stat-card">
              <div className="stat-card-top">
                <div>
                  <p className="stat-label">ACTIVE NOW</p>
                  <h3>{activeUsersCount}</h3>
                </div>
                <div className="stat-icon bg-secondary-light color-secondary-text">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
              </div>
              <p className="stat-trend trend-neutral">Current session average: 18m</p>
            </div>
          </div>

          {/* Table Area */}
          <div className="users-table-container">
            {/* Table Controls */}
            <div className="table-controls">
              <div className="filters-group">
                <div className="search-wrap">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="select-wrap">
                  <select 
                    value={roleFilter} 
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option>All Roles</option>
                    <option>Administrator</option>
                    <option>Doctor</option>
                    <option>Patient</option>
                  </select>
                  <span className="material-symbols-outlined select-arrow">expand_more</span>
                </div>
              </div>
              <p className="showing-text">
                Showing <span>{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of {filteredUsers.length} users
              </p>
            </div>

            {/* Main Data Table */}
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                    <th>Status</th>
                    <th className="align-text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6">
                        <PageLoader message="Loading users..." />
                      </td>
                    </tr>
                  ) : currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="user-name">{user.name}</p>
                              <p className="user-id">UID: EC-{user._id.substring(0, 4).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="color-secondary-text">{user.email}</td>
                        <td>
                          <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="color-secondary-text">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            <span className="status-dot"></span> {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="align-text-right">
                          <div className="actions-cell">
                            <button 
                              className="action-btn" 
                              title="Edit"
                              onClick={() => handleEditClick(user)}
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button 
                              className={`action-btn ${user.isActive ? 'danger' : 'warning'}`} 
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleStatus(user)}
                            >
                              <span className="material-symbols-outlined">{user.isActive ? 'block' : 'check_circle'}</span>
                            </button>
                            <button 
                              className="action-btn danger" 
                              title="Delete"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        <p>No users found matching your criteria.</p>
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

      {/* Add Modal */}
      <AdminModal
        isOpen={addModal}
        title="Add New User"
        onClose={() => setAddModal(false)}
        onConfirm={handleAddSave}
        confirmText="Create User"
        isLoading={isSubmitting}
      >
        <div className="admin-form-group">
          <label>Name</label>
          <input
            type="text"
            value={addFormData.name}
            onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
            placeholder="User name"
          />
        </div>
        <div className="admin-form-group">
          <label>Email</label>
          <input
            type="email"
            value={addFormData.email}
            onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
            placeholder="user@example.com"
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
          <label>Role</label>
          <select
            value={addFormData.role}
            onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </AdminModal>

      {/* Edit Modal */}
      <AdminModal
        isOpen={editModal.isOpen}
        title="Edit User"
        onClose={() => setEditModal({ isOpen: false, user: null })}
        onConfirm={handleEditSave}
        confirmText="Save Changes"
        isLoading={isSubmitting}
      >
        <div className="admin-form-group">
          <label>Name</label>
          <input
            type="text"
            value={editFormData.name || ''}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            placeholder="User name"
          />
        </div>
        <div className="admin-form-group">
          <label>Email</label>
          <input
            type="email"
            value={editFormData.email || ''}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            placeholder="user@example.com"
          />
        </div>
        <div className="admin-form-group">
          <label>Role</label>
          <select
            value={editFormData.role || 'patient'}
            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </AdminModal>

      {/* Delete Modal */}
      <AdminModal
        isOpen={deleteModal.isOpen}
        title="Delete User"
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete User"
        isDangerous={true}
        isLoading={isSubmitting}
      >
        <p>Are you sure you want to delete <strong>{deleteModal.user?.name}</strong>?</p>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '12px' }}>
          This action cannot be undone. All associated data will be deleted.
        </p>
      </AdminModal>

      {/* Toggle Status Modal */}
      <AdminModal
        isOpen={statusModalAction.isOpen}
        title={statusModalAction.user?.isActive ? 'Deactivate User' : 'Activate User'}
        onClose={() => setStatusModalAction({ isOpen: false, user: null })}
        onConfirm={handleToggleStatusConfirm}
        confirmText={statusModalAction.user?.isActive ? 'Deactivate' : 'Activate'}
        isDangerous={statusModalAction.user?.isActive}
        isLoading={isSubmitting}
      >
        <p>
          Are you sure you want to {statusModalAction.user?.isActive ? 'deactivate' : 'activate'} <strong>{statusModalAction.user?.name}</strong>?
        </p>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '12px' }}>
          {statusModalAction.user?.isActive 
            ? 'This user will not be able to access their account until reactivated.'
            : 'This user will be able to access their account again.'}
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
