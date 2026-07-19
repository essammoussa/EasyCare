import './LogoutModal.css';

export default function LogoutModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="logout-modal-backdrop" onClick={onCancel}>
      <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="logout-modal-icon-wrap">
          <span className="material-symbols-outlined">logout</span>
        </div>
        <h3>Sign Out?</h3>
        <p>Are you sure you want to log out of your account?</p>
        <div className="logout-modal-actions">
          <button className="logout-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="logout-modal-confirm" onClick={onConfirm}>
            <span className="material-symbols-outlined">logout</span>
            Yes, Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
