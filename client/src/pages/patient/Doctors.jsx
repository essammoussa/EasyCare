import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getDoctors } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import RatingStars from '../../components/RatingStars';
import './Doctors.css';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'All');
  const [cityFilter, setCityFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');

  // Pagination
  const [visibleCount, setVisibleCount] = useState(8);

  // Specialties list
  const specialties = ['All', 'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Practice'];

  // Fetch doctors from backend
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (selectedSpecialty && selectedSpecialty !== 'All') params.specialty = selectedSpecialty;

        const { data } = await getDoctors(params);
        const docsData = data.doctors || data || [];
        setDoctors(docsData);
      } catch (err) {
        console.error('Failed to load doctors:', err);
        setError('Failed to load doctors.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [searchQuery, selectedSpecialty]);

  // Apply client-side filters (City and Rating)
  useEffect(() => {
    let result = [...doctors];

    // Filter by city / clinic
    if (cityFilter.trim() !== '') {
      const cityLower = cityFilter.toLowerCase();
      result = result.filter(doc =>
        doc.clinic && doc.clinic.toLowerCase().includes(cityLower)
      );
    }

    // Filter by rating
    if (ratingFilter !== 'All') {
      const minRating = parseFloat(ratingFilter);
      result = result.filter(doc => (doc.rating || 0) >= minRating);
    }

    setFilteredDoctors(result);
  }, [doctors, cityFilter, ratingFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (searchQuery) newParams.search = searchQuery;
    if (selectedSpecialty !== 'All') newParams.specialty = selectedSpecialty;
    setSearchParams(newParams);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 4);
  };

  return (
    <div className="doctors-page">
      <Navbar />

      <main className="doctors-main">
        {/* Title Block */}
        <div className="doctors-header-intro">
          <h1 className="doctors-intro-title">Find Your Doctor</h1>
          <p className="doctors-intro-subtitle">Browse through our network of board-certified specialists and book appointments instantly.</p>
        </div>

        {/* Premium Unified Search Bar */}
        <section className="search-bar-section">
          <form className="search-bar-glass-card" onSubmit={handleSearchSubmit}>

            {/* Input Name / Clinic */}
            <div className="search-input-wrapper name-search">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Search doctor name..."
                className="search-inner-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Dropdown Specialty */}
            <div className="search-input-wrapper select-specialty">
              <span className="material-symbols-outlined input-icon text-blue">medical_services</span>
              <select
                className="search-inner-select"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                {specialties.map(spec => (
                  <option key={spec} value={spec}>
                    {spec === 'All' ? 'All Specialties' : spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Input City */}
            <div className="search-input-wrapper input-city">
              <span className="material-symbols-outlined input-icon text-blue">location_on</span>
              <input
                type="text"
                placeholder="City / Clinic location"
                className="search-inner-input"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>

            {/* Dropdown Rating */}
            <div className="search-input-wrapper select-rating">
              <span className="material-symbols-outlined input-icon text-orange">star</span>
              <select
                className="search-inner-select"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="All">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="search-buttons-group">
              <button
                type="button"
                className="action-btn-map"
                onClick={() => navigate('/patient/map')}
              >
                <span className="material-symbols-outlined">map</span>
                View Map
              </button>
            </div>

          </form>
        </section>

        {/* Dynamic Quick Stats */}
        <div className="doctors-quick-stats-row">
          <div className="quick-stat-badge bg-teal">
            <span className="badge-text-strong">{filteredDoctors.length} Doctors Available</span>
          </div>
          <div className="quick-stat-badge bg-white shadow-sm">
            <span className="material-symbols-outlined text-blue">verified</span>
            <span className="badge-text-medium">All providers are board-certified</span>
          </div>
        </div>

        {/* Loader / Errors / Grid */}
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredDoctors.length > 0 ? (
          <>
            <div className="doctors-premium-grid">
              {filteredDoctors.slice(0, visibleCount).map((doc) => {
                const name = doc.userId?.name || 'Doctor';
                const specialty = doc.specialty || 'General Practitioner';
                const avatarPath = doc.userId?.profilePicture || '';
                const avatar = avatarPath
                  ? (avatarPath.startsWith('http') ? avatarPath : `http://localhost:5000${avatarPath}`)
                  : null;
                const experience = doc.experience || 5;
                const clinic = doc.clinic || 'General Medical Clinic';
                const rating = doc.rating !== undefined ? doc.rating : 0;
                const reviewsCount = doc.reviewsCount || 0;
                const isVerified = doc.isVerified;

                return (
                  <div
                    key={doc._id}
                    className="doctor-premium-card hover-lift"
                    onClick={() => navigate(`/doctors/${doc._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-top-header">
                      <div className="avatar-badge-container">
                        {avatar ? (
                          <img src={avatar} alt={name} className="doctor-card-avatar" />
                        ) : (
                          <div className="doctor-card-avatar-placeholder">
                            <span className="material-symbols-outlined">person</span>
                          </div>
                        )}
                        {isVerified && (
                          <div className="avatar-check-badge">
                            <span className="material-symbols-outlined">check</span>
                          </div>
                        )}
                      </div>
                      <div className="experience-badge-tag">
                        {experience} years exp
                      </div>
                    </div>

                    <div className="card-body-details">
                      <h3 className="doctor-card-name">Dr. {name}</h3>
                      <div className="specialty-badge-row">
                        <span className="specialty-badge-capsule">{specialty}</span>
                      </div>
                      <p className="doctor-clinic-location">
                        <span className="material-symbols-outlined">local_hospital</span>
                        {clinic}
                      </p>
                    </div>

                    <div className="card-reviews-rating">
                      <RatingStars rating={rating} reviewsCount={reviewsCount} size="sm" />
                    </div>

                    <div className="card-footer-actions">
                      <button
                        className="btn-book-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patient/book/${doc._id}`);
                        }}
                      >
                        Book Appointment
                      </button>
                      <button
                        className="btn-view-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/doctors/${doc._id}`);
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {filteredDoctors.length > visibleCount && (
              <div className="doctors-pagination-area">
                <button className="btn-load-more" onClick={handleLoadMore}>
                  Load More Doctors
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
                <p className="pagination-stats-text">
                  Showing 1-{Math.min(visibleCount, filteredDoctors.length)} of {filteredDoctors.length} available specialists
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="doctors-empty-container">
            <span className="material-symbols-outlined">person_off</span>
            <p className="empty-message-title">No doctors found</p>
            <p className="empty-message-subtitle">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </main>

      {/* Floating Action Button for support - Hidden for logged in members */}
      {!isAuthenticated && (
        <div className="floating-chat-action">
          <button className="btn-floating-chat" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined">chat</span>
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
