import { Link } from 'react-router-dom';
import './AppointmentCard.css';

export default function AppointmentCard({ appointment, role, onStatusUpdate }) {
  const {
    _id,
    patientId,
    doctorId,
    status = 'pending',
    notes,
    createdAt,
    bookingId,
  } = appointment;

  // Determine display name based on role
  const displayName =
    role === 'patient'
      ? doctorId?.userId?.name || doctorId?.specialty || 'Doctor'
      : patientId?.name || 'Patient';

  const subtitle =
    role === 'patient'
      ? `${doctorId?.specialty || ''} ${doctorId?.clinic ? '• ' + doctorId.clinic : ''}`
      : patientId?.email || '';

  // Get initials for avatar
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format date
  const dateObj = bookingId?.bookedAt || createdAt;
  const formattedDate = dateObj
    ? new Date(dateObj).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Date not set';

  const timeStr = bookingId?.slotId
    ? `${bookingId.slotId.startTime} - ${bookingId.slotId.endTime}`
    : '';

  return (
    <div className={`appointment-card status-${status}`}>
      {/* Avatar */}
      <div className="appointment-card-avatar">{initials}</div>

      {/* Content */}
      <div className="appointment-card-content">
        <p className="appointment-card-name">{displayName}</p>
        {subtitle && <p className="appointment-card-specialty">{subtitle}</p>}
        <p className="appointment-card-date">
          <span className="material-symbols-outlined">calendar_today</span>
          {formattedDate} {timeStr && `• ${timeStr}`}
        </p>
        {notes && <p className="appointment-card-notes">"{notes}"</p>}
      </div>

      {/* Right */}
      <div className="appointment-card-right">
        <span className={`appointment-status-badge ${status}`}>{status}</span>

        {/* Doctor Actions */}
        {role === 'doctor' && onStatusUpdate && status !== 'completed' && status !== 'cancelled' && (
          <div className="appointment-card-actions">
            {status === 'pending' && (
              <button
                className="appointment-action-btn confirm"
                onClick={() => onStatusUpdate(_id, 'confirmed')}
              >
                <span className="material-symbols-outlined">check_circle</span>
                Confirm
              </button>
            )}
            {status === 'confirmed' && (
              <Link
                className="appointment-action-btn diagnosis-btn"
                to={`/doctor/diagnosis?appointmentId=${_id}&patientId=${patientId?._id || patientId}`}
              >
                <span className="material-symbols-outlined">edit_document</span>
                Write Diagnosis
              </Link>
            )}
            {(status === 'pending' || status === 'confirmed') && (
              <button
                className="appointment-action-btn complete"
                onClick={() => onStatusUpdate(_id, 'completed')}
              >
                <span className="material-symbols-outlined">task_alt</span>
                Complete
              </button>
            )}
            {status !== 'cancelled' && (
              <button
                className="appointment-action-btn cancel"
                onClick={() => onStatusUpdate(_id, 'cancelled')}
              >
                <span className="material-symbols-outlined">cancel</span>
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
