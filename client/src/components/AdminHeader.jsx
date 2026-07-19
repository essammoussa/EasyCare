import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import './AdminHeader.css';

const API_BASE = 'http://localhost:5000';

export default function AdminHeader({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button className="admin-mobile-menu-btn" onClick={onMenuClick}>
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
      <div className="admin-header-right">
        <button
          className="admin-header-icon-btn"
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          <span className="material-symbols-outlined">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
        <button
          className="admin-header-icon-btn"
          onClick={() => navigate('/admin/settings')}
          title="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        
        <div className="admin-header-divider"></div>
        
        <div className="admin-header-profile">
          <div className="admin-header-profile-text">
            <p className="name">{user?.name || 'Admin User'}</p>
            <p className="role">{user?.role === 'admin' ? 'Super Admin' : user?.role}</p>
          </div>
          {user?.profilePicture ? (
            <img
              src={user.profilePicture.startsWith('http') ? user.profilePicture : `${API_BASE}${user.profilePicture}`}
              alt="Admin Profile"
              className="admin-header-avatar-img"
            />
          ) : (
            <div className="admin-header-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
