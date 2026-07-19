import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LogoutModal from './LogoutModal';
import './AdminSidebar.css';

export default function AdminSidebar({ activePage, isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo-icon">
            <span className="material-symbols-outlined">medical_services</span>
          </div>
          <div className="admin-sidebar-logo-text">
            <h1>EasyCare Admin</h1>
            <p>Healthcare Portal</p>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            className={`admin-nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/users"
            className={`admin-nav-link ${activePage === 'users' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">group</span>
            <span>Users</span>
          </NavLink>
          <NavLink
            to="/admin/doctors"
            className={`admin-nav-link ${activePage === 'doctors' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">medical_services</span>
            <span>Doctors</span>
          </NavLink>
          <NavLink
            to="/admin/appointments"
            className={`admin-nav-link ${activePage === 'appointments' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">event_available</span>
            <span>Appointments</span>
          </NavLink>
          <NavLink
            to="/admin/reviews"
            className={`admin-nav-link ${activePage === 'reviews' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">rate_review</span>
            <span>Reviews</span>
          </NavLink>
          <NavLink
            to="/admin/analytics"
            className={`admin-nav-link ${activePage === 'analytics' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">analytics</span>
            <span>Analytics</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <NavLink 
            to="/admin/settings"
            className={`admin-nav-link ${activePage === 'settings' ? 'active' : ''}`}
            onClick={handleNavClick}
            style={{ marginBottom: '8px' }}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </NavLink>
          <button className="admin-sidebar-bottom-link" onClick={() => {
            handleNavClick();
            handleLogoutClick();
          }}>
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}
