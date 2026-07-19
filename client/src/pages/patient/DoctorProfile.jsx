import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { getDoctor, getDoctorReviews, getSlots, createBooking, createReview } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import RatingStars from '../../components/RatingStars';
import 'leaflet/dist/leaflet.css';
import './DoctorProfile.css';

// Fix for default Leaflet icon paths
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function DoctorProfile() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Booking Info
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [visitReason, setVisitReason] = useState('General Consultation');
  const [consultType, setConsultType] = useState('In-Clinic');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Review Form Info
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Tab management
  const [activeTab, setActiveTab] = useState('about'); // about, schedule, reviews

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, revRes, slotRes] = await Promise.all([
          getDoctor(id),
          getDoctorReviews(id).catch(() => ({ data: [] })),
          getSlots(id).catch(() => ({ data: [] })),
        ]);
        setDoctor(docRes.data.doctor || docRes.data);
        setReviews(revRes.data.reviews || revRes.data || []);
        
        // Filter out booked slots
        const available = (slotRes.data.slots || slotRes.data || []).filter(s => !s.isBooked);
        const availableDates = [...new Set(available.map((slot) => slot.date).filter(Boolean))].sort();
        setSlots(available);
        setSelectedDate((prev) => (prev && availableDates.includes(prev) ? prev : (availableDates[0] || '')));
      } catch (err) {
        console.error('Failed to load profile details:', err);
        setError('Failed to load doctor profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBookingSubmit = async () => {
    if (!isAuthenticated) {
      setBookingError('Please log in to book an appointment.');
      return;
    }
    if (user?.role !== 'patient') {
      setBookingError('Only patients can book appointments.');
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please select a time slot from the schedule.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      const payload = {
        doctorId: id,
        slotId: selectedSlot._id,
        notes: `${visitReason} (${consultType}) - ${notes}`.trim()
      };
      await createBooking(payload);
      setBookingSuccess('Booking confirmed successfully!');
      setSelectedSlot(null);
      // Refresh available slots
      const slotRes = await getSlots(id);
      const available = (slotRes.data.slots || slotRes.data || []).filter(s => !s.isBooked);
      const availableDates = [...new Set(available.map((slot) => slot.date).filter(Boolean))].sort();
      setSlots(available);
      setSelectedDate((prev) => (prev && availableDates.includes(prev) ? prev : (availableDates[0] || '')));
      
      setTimeout(() => {
        navigate('/patient/appointments');
      }, 2000);
    } catch (err) {
      console.error(err);
      setBookingError(err.response?.data?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setReviewError('You must be logged in to write a review.');
      return;
    }
    if (reviewRating === 0) {
      setReviewError('Please select a star rating.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const { data } = await createReview(id, {
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      setReviews(prev => [
        { ...data, patientId: { name: user?.name || 'You' } },
        ...prev
      ]);
      setReviewRating(0);
      setReviewComment('');
      setReviewSuccess('Your review has been submitted successfully.');
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-profile-page">
        <Navbar />
        <div className="spinner-container"><div className="spinner" /></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="doctor-profile-page">
        <Navbar />
        <main className="doctor-profile-main">
          <div className="error-message">{error || 'Doctor not found.'}</div>
        </main>
      </div>
    );
  }

  const name = doctor.userId?.name || 'Doctor';
  const specialty = doctor.specialty || 'General Practitioner';
  const avatarPath = doctor.userId?.profilePicture || '';
  const avatar = avatarPath
    ? (avatarPath.startsWith('http') ? avatarPath : `http://localhost:5000${avatarPath}`)
    : null;
  const experience = doctor.experience || 5;
  const clinicName = doctor.clinic || 'City Health Center';
  const rating = doctor.rating !== undefined ? doctor.rating : 0;
  const reviewsCount = doctor.reviewsCount || 0;
  const isVerified = doctor.isVerified;
  const availableDates = [...new Set(slots.map((slot) => slot.date).filter(Boolean))].sort();
  const visibleSlots = slots.filter((slot) => slot.date === selectedDate);
  const formatDateLabel = (value) => {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="doctor-profile-page">
      <Navbar />

      <main className="profile-main-content">
        {/* Banner header gradient */}
        <div className="profile-hero-banner">
          <div className="banner-pattern-overlay"></div>
        </div>

        <div className="profile-container-wrapper">
          <div className="profile-columns-layout">
            
            {/* Left Column: Details & Schedule */}
            <div className="profile-details-column">
              
              {/* Profile Main Card */}
              <div className="profile-header-card">
                {isVerified && (
                  <div className="profile-verified-badge">
                    <span className="material-symbols-outlined icon-fill">verified</span>
                    <span>Verified Profile</span>
                  </div>
                )}

                <div className="profile-avatar-row">
                  <div className="profile-avatar-container">
                    {avatar ? (
                      <img src={avatar} alt={name} className="profile-img-tag" />
                    ) : (
                      <div className="profile-avatar-placeholder">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                    )}
                    <span className="active-green-dot"></span>
                  </div>

                  <div className="profile-text-details">
                    <h2 className="doctor-full-name">{name}</h2>
                    <p className="doctor-sub-info">
                      <span className="specialty-text">{specialty}</span>
                      <span className="bullet-dot"></span>
                      <span className="exp-text">{experience} Years Experience</span>
                    </p>

                    <div className="rating-location-row">
                      <div className="rating-snippet">
                        <span className="material-symbols-outlined rating-star icon-fill">star</span>
                        <span className="rating-score-bold">{rating.toFixed(1)}</span>
                        <span className="rating-count-text">({reviewsCount} Reviews)</span>
                      </div>
                      <div className="location-snippet">
                        <span className="material-symbols-outlined">location_on</span>
                        <span>{clinicName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bento Quick Stats */}
                <div className="profile-bento-grid">
                  <div className="bento-box bg-blue">
                    <p className="bento-label">Consultation</p>
                    <p className="bento-value">$120</p>
                  </div>
                  <div className="bento-box bg-slate">
                    <p className="bento-label">Languages</p>
                    <p className="bento-value">EN, ES</p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="profile-navigation-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                  onClick={() => setActiveTab('about')}
                >
                  <span className="material-symbols-outlined">person</span>
                  About
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  <span className="material-symbols-outlined">calendar_month</span>
                  Availability
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  <span className="material-symbols-outlined">rate_review</span>
                  Reviews ({reviews.length})
                </button>
              </div>

              {/* Tab Content: About */}
              {activeTab === 'about' && (
                <div className="tab-content-panel fade-in">
                  <div className="profile-bio-box">
                    <h3 className="section-block-title">Professional Biography</h3>
                    <p className="bio-description-text">
                      {doctor.bio || `Dr. ${name} is a highly accomplished ${specialty.toLowerCase()} specialist with extensive experience in clinical care. Committed to delivering advanced, personalized health treatments with an empathetic approach, Dr. ${name} strives to support every patient through their wellness journey.`}
                    </p>
                    
                    <div className="bio-grid-blocks">
                      <div className="bio-sub-block">
                        <h4 className="bio-block-heading">
                          <span className="material-symbols-outlined">school</span>
                          Education
                        </h4>
                        <ul className="bio-education-list">
                          <li>
                            <span className="bullet"></span>
                            <div>
                              <p className="inst-name">Harvard Medical School</p>
                              <p className="degree-name">Doctor of Medicine (M.D.)</p>
                            </div>
                          </li>
                          <li>
                            <span className="bullet"></span>
                            <div>
                              <p className="inst-name">Johns Hopkins University</p>
                              <p className="degree-name">Residency & fellowship</p>
                            </div>
                          </li>
                        </ul>
                      </div>

                      <div className="bio-sub-block">
                        <h4 className="bio-block-heading">
                          <span className="material-symbols-outlined">emoji_events</span>
                          Specializations
                        </h4>
                        <div className="spec-badges-container">
                          <span className="spec-capsule">Clinical Care</span>
                          <span className="spec-capsule">Diagnostics</span>
                          <span className="spec-capsule">Chronic Management</span>
                          <span className="spec-capsule">Preventative Health</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Availability */}
              {activeTab === 'schedule' && (
                <div className="tab-content-panel fade-in">
                  <div className="profile-schedule-box">
                    <h3 className="section-block-title">Availability Calendar</h3>
                    <p className="schedule-helper-text">Choose a day first, then pick an open slot for that date.</p>

                    {availableDates.length > 0 ? (
                      <>
                        <div className="availability-date-picker-row">
                          <label className="booking-field-label">Select a day</label>
                          <input
                            type="date"
                            className="availability-date-input"
                            value={selectedDate}
                            onChange={(e) => {
                              setSelectedDate(e.target.value);
                              setSelectedSlot(null);
                            }}
                          />
                        </div>

                        <div className="availability-date-chips">
                          {availableDates.map((date) => (
                            <button
                              key={date}
                              type="button"
                              className={`availability-date-chip ${selectedDate === date ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedSlot(null);
                              }}
                            >
                              {formatDateLabel(date)}
                            </button>
                          ))}
                        </div>

                        {selectedDate ? (
                          visibleSlots.length > 0 ? (
                            <div className="slots-capsules-grid">
                              {visibleSlots.map((slot) => {
                                const isSelected = selectedSlot?._id === slot._id;
                                return (
                                  <button
                                    key={slot._id}
                                    className={`slot-time-capsule ${isSelected ? 'selected' : ''}`}
                                    onClick={() => setSelectedSlot(slot)}
                                  >
                                    <span className="material-symbols-outlined">schedule</span>
                                    <span>{slot.startTime} - {slot.endTime}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="schedule-empty-state">
                              <span className="material-symbols-outlined">event_busy</span>
                              <p>No available slots for {formatDateLabel(selectedDate)}.</p>
                            </div>
                          )
                        ) : (
                          <div className="schedule-empty-state">
                            <span className="material-symbols-outlined">event_busy</span>
                            <p>Select a date to view available slots.</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="schedule-empty-state">
                        <span className="material-symbols-outlined">event_busy</span>
                        <p>No available slots scheduled for Dr. {name} at the moment.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content: Reviews */}
              {activeTab === 'reviews' && (
                <div className="tab-content-panel fade-in">
                  <div className="profile-reviews-box">
                    <h3 className="section-block-title">Patient Reviews</h3>
                    
                    {/* Add Review Form */}
                    {isAuthenticated && user?.role === 'patient' && (
                      <div className="write-review-form-wrapper">
                        <h4 className="write-review-title">Write a Review</h4>
                        
                        {reviewSuccess && <div className="review-alert success-style"><span className="material-symbols-outlined">check_circle</span>{reviewSuccess}</div>}
                        {reviewError && <div className="review-alert error-style"><span className="material-symbols-outlined">error</span>{reviewError}</div>}

                        <form className="review-input-form" onSubmit={handleReviewSubmit}>
                          <div className="rating-select-group">
                            <span className="rating-label-title">Your Rating:</span>
                            <div className="rating-stars-selection">
                              {[1,2,3,4,5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  className={`star-select-btn ${(reviewHover || reviewRating) >= star ? 'active' : ''}`}
                                  onClick={() => setReviewRating(star)}
                                  onMouseEnter={() => setReviewHover(star)}
                                  onMouseLeave={() => setReviewHover(0)}
                                >
                                  <span className="material-symbols-outlined icon-fill">star</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="comment-textarea-group">
                            <textarea
                              placeholder="Write a comment about your checkup experience..."
                              className="comment-textarea"
                              rows={3}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                            ></textarea>
                          </div>

                          <button 
                            type="submit" 
                            className="btn-submit-review"
                            disabled={reviewSubmitting || reviewRating === 0}
                          >
                            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                      <div className="reviews-cards-list">
                        {reviews.map((rev) => (
                          <div key={rev._id} className="review-comment-card">
                            <div className="review-card-header">
                              <span className="review-author-name">{rev.patientId?.name || 'Anonymous Patient'}</span>
                              <RatingStars rating={rev.rating || 0} size="sm" />
                            </div>
                            {rev.comment && <p className="review-comment-body">"{rev.comment}"</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="reviews-empty-state">
                        <span className="material-symbols-outlined">rate_review</span>
                        <p>No reviews posted yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Sticky Booking Card & Map */}
            <div className="profile-booking-column">
              <div className="sticky-booking-card-wrapper">
                
                {/* Main booking container */}
                <div className="booking-premium-form-card">
                  <div className="booking-card-header bg-primary-theme">
                    <h3 className="booking-card-title">Book Appointment</h3>
                    <p className="booking-card-subtitle">Secure your slot with {name}</p>
                  </div>

                  <div className="booking-card-body">
                    {/* Booking message alerts */}
                    {bookingSuccess && <div className="booking-alert success-style"><span className="material-symbols-outlined">check_circle</span>{bookingSuccess}</div>}
                    {bookingError && <div className="booking-alert error-style"><span className="material-symbols-outlined">error</span>{bookingError}</div>}

                    {/* Next slot notification box */}
                    {slots.length > 0 ? (
                      <div className="next-available-slot-box">
                        <div className="slot-calendar-badge">
                          <span className="cal-month">OCT</span>
                          <span className="cal-day">25</span>
                        </div>
                        <div className="slot-badge-details">
                          <p className="slot-badge-title">Available Slot Ready</p>
                          <p className="slot-badge-time">Select from schedule options</p>
                        </div>
                      </div>
                    ) : (
                      <div className="next-available-slot-box no-slots">
                        <div className="slot-badge-details">
                          <p className="slot-badge-title">No Slots Available</p>
                          <p className="slot-badge-time">Please contact hospital</p>
                        </div>
                      </div>
                    )}

                    {/* Selected Slot Information */}
                    {selectedSlot && (
                      <div className="selected-slot-preview">
                        <span className="material-symbols-outlined text-blue">event_available</span>
                        <div className="preview-text">
                          <p className="preview-label">Selected Schedule Slot</p>
                          <p className="preview-value">
                            {selectedDate ? `${formatDateLabel(selectedDate)} • ` : ''}{selectedSlot.startTime} - {selectedSlot.endTime}
                          </p>
                        </div>
                        <button className="btn-clear-slot" onClick={() => setSelectedSlot(null)}>
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    )}

                    {/* Form Controls */}
                    <div className="booking-inputs-group">
                      <div className="booking-field-row">
                        <label className="booking-field-label">Visit Reason</label>
                        <select 
                          className="booking-field-select"
                          value={visitReason}
                          onChange={(e) => setVisitReason(e.target.value)}
                        >
                          <option value="General Consultation">General Cardiac Checkup</option>
                          <option value="Hypertension Management">Hypertension Management</option>
                          <option value="Chest Pain Consultation">Chest Pain Consultation</option>
                          <option value="Follow-up Visit">Follow-up Visit</option>
                        </select>
                      </div>

                      <div className="booking-field-row">
                        <label className="booking-field-label">Consultation Type</label>
                        <div className="consult-type-selector-grid">
                          <button 
                            type="button"
                            className={`type-select-btn ${consultType === 'In-Clinic' ? 'active' : ''}`}
                            onClick={() => setConsultType('In-Clinic')}
                          >
                            <span className="material-symbols-outlined">apartment</span>
                            In-Clinic
                          </button>
                          <button 
                            type="button"
                            className={`type-select-btn ${consultType === 'Video Call' ? 'active' : ''}`}
                            onClick={() => setConsultType('Video Call')}
                          >
                            <span className="material-symbols-outlined">videocam</span>
                            Video Call
                          </button>
                        </div>
                      </div>

                      <div className="booking-field-row">
                        <label className="booking-field-label">Notes for Doctor</label>
                        <textarea 
                          placeholder="Type optional symptoms or details..."
                          className="booking-field-textarea"
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                      </div>
                    </div>

                    {/* Pricing calculation summary */}
                    <div className="booking-pricing-breakdown">
                      <div className="pricing-row">
                        <span className="pricing-label">Consultation Fee</span>
                        <span className="pricing-amount">$120.00</span>
                      </div>
                      <div className="pricing-row">
                        <span className="pricing-label">Booking Service Fee</span>
                        <span className="pricing-amount">$5.00</span>
                      </div>
                      <div className="pricing-total-row">
                        <span className="total-label">Total Payable</span>
                        <span className="total-amount">$125.00</span>
                      </div>
                    </div>

                    {/* Submit Booking Button */}
                    <button 
                      className="btn-confirm-booking"
                      onClick={handleBookingSubmit}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? 'Confirming Booking...' : 'Confirm Booking'}
                    </button>

                    <p className="cancellation-policy-text">
                      Free cancellation up to 24 hours before the appointment
                    </p>
                  </div>
                </div>

                {/* Map Card */}
                <div className="booking-map-card">
                  <div className="booking-map-media">
                    {doctor.location?.coordinates?.length === 2 && (doctor.location.coordinates[0] !== 0 || doctor.location.coordinates[1] !== 0) ? (
                      <MapContainer
                        center={[doctor.location.coordinates[1], doctor.location.coordinates[0]]}
                        zoom={15}
                        scrollWheelZoom={false}
                        dragging={false}
                        zoomControl={false}
                        attributionControl={false}
                        style={{ width: '100%', height: '100%', borderRadius: '12px 12px 0 0' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[doctor.location.coordinates[1], doctor.location.coordinates[0]]} />
                      </MapContainer>
                    ) : (
                      <div className="booking-map-placeholder">
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary, #005596)' }}>location_on</span>
                        <p style={{ color: '#666', marginTop: '8px' }}>Map not available</p>
                      </div>
                    )}
                  </div>
                  <div className="booking-map-details">
                    <p className="map-clinic-title">{clinicName}</p>
                    <p className="map-clinic-address">{doctor.address || clinicName}</p>
                    <a 
                      href={
                        doctor.location?.coordinates?.length === 2
                          ? `https://maps.google.com/?q=${doctor.location.coordinates[1]},${doctor.location.coordinates[0]}`
                          : `https://maps.google.com/?q=${encodeURIComponent(doctor.address || clinicName)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-get-directions-btn"
                    >
                      Get Directions
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </a>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
