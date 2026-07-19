import { useState, useEffect, useRef, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import './NotificationDropdown.css';

function timeAgo(dateString, now) {
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationDropdown() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [now, setNow] = useState(new Date());
  const dropdownRef = useRef(null);

  // Tick timer to update timestamps in real time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await getNotifications();
      setNotifications(data);
    } catch (err) {
      // Silently fail — user may have logged out mid-poll
    }
  }, [isAuthenticated]);

  // Initial fetch + polling every 30s (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications(); // Refresh when opening
    }
  };

  const handleMarkRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'appointment': return 'calendar_month';
      case 'result': return 'science';
      case 'message': return 'chat';
      default: return 'info';
    }
  };

  // Don't render anything for unauthenticated users
  if (!isAuthenticated) return null;

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button
        className={`notification-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        title="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="notification-mark-all" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          <ul className="notification-list">
            {notifications.length === 0 ? (
              <li className="notification-empty">
                <span className="material-symbols-outlined">notifications_off</span>
                <p>No notifications yet.</p>
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n._id}
                  className={`notification-item ${n.isRead ? '' : 'unread'}`}
                  onClick={() => handleMarkRead(n._id, n.isRead)}
                >
                  <div className={`notification-icon ${n.type || 'system'}`}>
                    <span className="material-symbols-outlined">{getIcon(n.type)}</span>
                  </div>
                  <div className="notification-content">
                    <h4 className="notification-title">{n.title}</h4>
                    <p className="notification-message">{n.message}</p>
                    <span className="notification-time">{timeAgo(n.createdAt, now)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
