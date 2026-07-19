import './AdminModal.css';

export default function AdminModal({ 
  isOpen, 
  title, 
  onClose, 
  onConfirm, 
  children, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  isDangerous = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button 
            className="admin-modal-close" 
            onClick={onClose}
            disabled={isLoading}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="admin-modal-body">
          {children}
        </div>

        <div className="admin-modal-footer">
          <button
            className="admin-modal-btn cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`admin-modal-btn ${isDangerous ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="admin-modal-spinner"></span>
                {confirmText}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
