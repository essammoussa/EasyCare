import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { isStaffRole } from '../utils/roleRoutes';
import { scrollToTop } from './ScrollToTop';
import LogoutModal from './LogoutModal';
import NotificationDropdown from './NotificationDropdown';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navbar is patient/guest only — doctors and admins use their portal sidebars
  if (isStaffRole(user?.role)) {
    return null;
  }

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    setMobileOpen(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleNavClick = () => {
    setMobileOpen(false);
    setDropdownOpen(false);
    scrollToTop(true);
  };

  const renderLinks = () => {
    if (!isAuthenticated) {
      return (
        <>
          <NavLink to="/" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} end onClick={handleNavClick}>Home</NavLink>
          <NavLink to="/doctors" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} onClick={handleNavClick}>Find Doctors</NavLink>
        </>
      );
    }

    if (user?.role === 'patient') {
      return (
        <>
          <NavLink to="/" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} end onClick={handleNavClick}>Home</NavLink>
          <NavLink to="/patient/dashboard" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} onClick={handleNavClick}>Dashboard</NavLink>
          <NavLink to="/doctors" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} onClick={handleNavClick}>Find Doctors</NavLink>
          <NavLink to="/patient/appointments" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} onClick={handleNavClick}>My Appointments</NavLink>
          <NavLink to="/patient/records" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} onClick={handleNavClick}>Medical Records</NavLink>
          <NavLink to="/patient/upload" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} onClick={handleNavClick}>Upload Results</NavLink>
        </>
      );
    }

    return null;
  };

  const renderActions = () => {
    if (!isAuthenticated) {
      return (
        <div className="navbar-actions-container">
          <button
            className="navbar-icon-btn"
            type="button"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <Link to="/login" className="navbar-btn-outlined" onClick={handleNavClick}>Login</Link>
          <Link to="/register" className="navbar-btn-filled" onClick={handleNavClick}>Register</Link>
        </div>
      );
    }

    const handleSettingsClick = () => {
      handleNavClick();
      navigate('/patient/settings');
    };

    return (
      <div className="navbar-actions-container">
        <div className="navbar-icon-group">
          <button className="navbar-icon-btn" type="button" onClick={() => navigate('/patient/chat')}>
            <span className="material-symbols-outlined">chat</span>
          </button>
          <NotificationDropdown />
          <button className="navbar-icon-btn" type="button" onClick={toggleTheme} title="Toggle Theme">
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <button className="navbar-icon-btn" type="button" onClick={handleSettingsClick}>
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        <div className="navbar-divider" />

        <div className="navbar-profile-wrapper" ref={dropdownRef}>
          <div
            className="navbar-profile-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {user?.profilePicture ? (
              <img
                alt="User Avatar"
                className="navbar-profile-avatar"
                src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`}
              />
            ) : (
              <div className="navbar-profile-avatar-fallback">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="navbar-profile-info">
              <p className="navbar-profile-name">{user?.name || 'User'}</p>
              <p className="navbar-profile-id">ID: {user?._id ? `PT-${user._id.toString().slice(-5)}` : 'Patient'}</p>
            </div>
            <span className="material-symbols-outlined navbar-profile-icon">expand_more</span>
          </div>

          <div className={`navbar-profile-dropdown ${dropdownOpen ? 'open' : ''}`}>
            <button className="navbar-dropdown-item logout" type="button" onClick={handleLogoutClick}>
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand" onClick={handleNavClick}>
            <div className="navbar-brand-icon">
              <span className="material-symbols-outlined">medical_services</span>
            </div>
            <span className="navbar-brand-text">EasyCare</span>
          </Link>

          <nav className="navbar-links">
            {renderLinks()}
          </nav>

          <div className="navbar-actions">
            {renderActions()}
          </div>

          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            type="button"
          >
            <span className="material-symbols-outlined">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {mobileOpen && (
          <div className="navbar-mobile-menu">
            {renderLinks()}
            <div className="navbar-mobile-actions">
              {renderActions()}
            </div>
          </div>
        )}
      </header>

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}
