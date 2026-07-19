import { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-container ${type}`}>
      <span className="material-symbols-outlined">
        {type === 'success' ? 'check_circle' : 'error'}
      </span>
      <p>{message}</p>
      <button className="toast-close" onClick={onClose}>
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}
