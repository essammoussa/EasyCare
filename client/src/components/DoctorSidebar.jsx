import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LogoutModal from './LogoutModal';
import './DoctorSidebar.css';

export default function DoctorSidebar({ activePage, isOpen, onClose }) {
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
      <aside className={`doctor-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="doctor-sidebar-header">
          <div className="doctor-sidebar-logo-icon">
            <span className="material-symbols-outlined">medical_services</span>
          </div>
          <div className="doctor-sidebar-logo-text">
            <h1>EasyCare</h1>
            <p>Medical Suite</p>
          </div>
        </div>

        <nav className="doctor-sidebar-nav">
          <NavLink
            to="/doctor/dashboard"
            className={`doctor-nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink
            to="/doctor/appointments"
            className={`doctor-nav-link ${activePage === 'appointments' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">event_available</span>
            <span>Appointments</span>
          </NavLink>

          <NavLink
            to="/doctor/records"
            className={`doctor-nav-link ${activePage === 'records' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">folder_shared</span>
            <span>Patient Records</span>
          </NavLink>

          <NavLink
            to="/doctor/results"
            className={`doctor-nav-link ${activePage === 'results' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">biotech</span>
            <span>Lab Results</span>
          </NavLink>

          <NavLink
            to="/doctor/stats"
            className={`doctor-nav-link ${activePage === 'stats' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">query_stats</span>
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/doctor/diagnosis"
            className={`doctor-nav-link ${activePage === 'diagnosis' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">medical_services</span>
            <span>Diagnosis</span>
          </NavLink>

          <NavLink
            to="/doctor/chat"
            className={`doctor-nav-link ${activePage === 'chat' ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined">chat</span>
            <span>Messages</span>
          </NavLink>
        </nav>

        <div className="doctor-sidebar-bottom">
          <NavLink 
            to="/doctor/settings"
            className={`doctor-nav-link ${activePage === 'settings' ? 'active' : ''}`}
            onClick={handleNavClick}
            style={{ marginBottom: '8px' }}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </NavLink>
          <button className="doctor-sidebar-bottom-link" onClick={() => {
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
