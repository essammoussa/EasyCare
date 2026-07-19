import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import './DoctorCard.css';

export default function DoctorCard({ doctor }) {
  const {
    _id,
    userId,
    specialty,
    clinic,
    experience,
    rating,
    reviewsCount,
    availableSlots,
  } = doctor;

  const name = userId?.name || 'Doctor';
  const avatarPath = userId?.profilePicture || '';
  const avatar = avatarPath
    ? (avatarPath.startsWith('http') ? avatarPath : `http://localhost:5000${avatarPath}`)
    : null;
  const slotsCount = typeof availableSlots === 'number' ? availableSlots : (Array.isArray(availableSlots) ? availableSlots.length : 0);

  return (
    <div className="doctor-card">
      {/* Avatar */}
      <div className="doctor-card-avatar">
        {avatar ? (
          <img src={avatar} alt={name} />
        ) : (
          <div className="doctor-card-avatar-placeholder">
            <span className="material-symbols-outlined">person</span>
          </div>
        )}
      </div>

      {/* Specialty Badge */}
      <span className="doctor-card-specialty">
        {specialty || 'General Practice'}
      </span>

      {/* Name */}
      <h3 className="doctor-card-name">{name}</h3>

      {/* Clinic */}
      {clinic && (
        <p className="doctor-card-clinic">
          <span className="material-symbols-outlined">location_on</span>
          {clinic}
        </p>
      )}

      {/* Experience */}
      {experience && (
        <p className="doctor-card-experience">
          {experience} years experience
        </p>
      )}

      {/* Rating */}
      <RatingStars
        rating={rating || 0}
        reviewsCount={reviewsCount}
        size="sm"
      />

      {/* Available Slots */}
      <span className={`doctor-card-slots${slotsCount === 0 ? ' none' : ''}`}>
        <span className="material-symbols-outlined">event_available</span>
        {slotsCount} slots available
      </span>

      {/* Actions */}
      <div className="doctor-card-actions">
        <Link to={`/doctors/${_id}`} className="doctor-card-btn-view">
          View Profile
        </Link>
        <Link to={`/patient/book/${_id}`} className="doctor-card-btn-book">
          <span className="material-symbols-outlined">calendar_month</span>
          Book Now
        </Link>
      </div>
    </div>
  );
}
