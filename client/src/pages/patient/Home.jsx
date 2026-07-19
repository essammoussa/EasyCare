import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDoctors } from '../../services/api';
import DoctorCard from '../../components/DoctorCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './Home.css';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch top 6 doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await getDoctors({ limit: 6 });
        setTopDoctors(data.doctors || data || []);
      } catch (err) {
        setError('Could not load doctors.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="home-page">
      <Navbar />

      {/* ─── Hero Section ───────────────── */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-content">
            <div className="home-hero-badge">
              <span className="material-symbols-outlined">verified</span>
              TRUSTED BY 2M+ USERS
            </div>
            <h1 className="home-hero-title">
              Your Health,<br />
              <span>Simplified.</span>
            </h1>
            <p className="home-hero-text">
              Find doctors, book appointments, and manage your health records —
              all in one place. Experience clinical reliability with modern technology.
            </p>
            <div className="home-hero-buttons">
              <Link to="/register" className="home-hero-btn-primary">
                Get Started
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <a href="#features" className="home-hero-btn-secondary">
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Right — Search Card */}
          <div className="home-hero-visual">
            <div className="home-hero-blob-1" />
            <div className="home-hero-blob-2" />
            <div className="home-hero-card">
              <form className="home-search-bar" onSubmit={handleSearch}>
                <div className="home-search-input-wrap">
                  <span className="material-symbols-outlined">search</span>
                  <input
                    className="home-search-input"
                    type="text"
                    placeholder="Search doctors, specialties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="home-search-btn">
                  <span className="material-symbols-outlined">search</span>
                  Search
                </button>
              </form>
              <div className="home-hero-stats">
                <div className="home-hero-stat">
                  <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>
                    favorite
                  </span>
                  <p className="home-hero-stat-value">72 bpm</p>
                  <p className="home-hero-stat-label">Heart Rate</p>
                </div>
                <div className="home-hero-stat">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                    monitor_heart
                  </span>
                  <p className="home-hero-stat-value">120/80</p>
                  <p className="home-hero-stat-label">Blood Pressure</p>
                </div>
                <div className="home-hero-stat">
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>
                    calendar_month
                  </span>
                  <p className="home-hero-stat-value">1,284</p>
                  <p className="home-hero-stat-label">Appointments</p>
                </div>
                <div className="home-hero-stat">
                  <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>
                    star
                  </span>
                  <p className="home-hero-stat-value">4.9</p>
                  <p className="home-hero-stat-label">Avg Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ───────────── */}
      <section className="home-features" id="features">
        <div className="home-features-inner">
          <div className="home-features-header">
            <h2>Powerful Features for Peace of Mind</h2>
            <p>
              Our platform is designed with the user at the center, ensuring that
              healthcare management is intuitive, fast, and secure.
            </p>
          </div>
          <div className="home-features-grid">
            <div className="home-feature-card">
              <div className="home-feature-icon">
                <span className="material-symbols-outlined">person_search</span>
              </div>
              <h3>Find Doctors</h3>
              <p>
                Search through thousands of verified specialists by location,
                expertise, and patient ratings.
              </p>
              <div className="home-feature-link" onClick={() => navigate('/doctors')}>
                Explore Directory
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon">
                <span className="material-symbols-outlined">event_available</span>
              </div>
              <h3>Book Instantly</h3>
              <p>
                No more waiting on hold. See real-time availability and book your
                slot in under 60 seconds.
              </p>
              <div className="home-feature-link" onClick={() => navigate('/doctors')}>
                Check Schedule
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon">
                <span className="material-symbols-outlined">description</span>
              </div>
              <h3>Track Records</h3>
              <p>
                Keep your lab results, prescriptions, and history in a secure,
                encrypted vault accessible anywhere.
              </p>
              <div className="home-feature-link" onClick={() => navigate('/register')}>
                View Records
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Top Doctors Section ─────────── */}
      <section className="home-doctors" id="doctors">
        <div className="home-doctors-inner">
          <div className="home-doctors-header">
            <h2>Top Rated Doctors</h2>
            <Link to="/doctors">View All →</Link>
          </div>

          {loading ? (
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : topDoctors.length > 0 ? (
            <div className="home-doctors-grid">
              {topDoctors.slice(0, 6).map((doc) => (
                <DoctorCard key={doc._id} doctor={doc} />
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--color-secondary-text)', padding: '48px 0' }}>
              No doctors found. Check back soon!
            </p>
          )}
        </div>
      </section>

      {/* ─── CTA Section ────────────────── */}
      <section className="home-cta" id="about">
        <div className="home-cta-inner">
          <div className="home-cta-card">
            <div className="home-cta-decoration" />
            <div className="home-cta-content">
              <h2>Ready to take control of your health?</h2>
              <p>
                Join thousands of others who have simplified their healthcare
                journey with EasyCare. Your wellness is just a click away.
              </p>
              <div className="home-cta-buttons">
                <Link to="/register" className="home-cta-btn-white">
                  Get Started
                </Link>
                <a href="#features" className="home-cta-btn-outline">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact Section ─────────────── */}
      <section className="home-contact" id="contact">
        <div className="home-contact-inner">

          {/* Header */}
          <div className="home-contact-header">
            <span className="home-contact-badge">
              <span className="material-symbols-outlined">support_agent</span>
              CONTACT US
            </span>
            <h2 className="home-contact-title">We're Here to Help</h2>
            <p className="home-contact-subtitle">
              Have a question or need support? Reach out and our team will get back to you within 24 hours.
            </p>
          </div>

          <div className="home-contact-grid">
            {/* Info Cards */}
            <div className="home-contact-info">
              <div className="home-contact-card">
                <div className="home-contact-card-icon">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <h4 className="home-contact-card-label">Email Us</h4>
                  <p className="home-contact-card-value">info@easycare.com</p>
                  <p className="home-contact-card-hint">We reply within 24 hours</p>
                </div>
              </div>

              <div className="home-contact-card">
                <div className="home-contact-card-icon">
                  <span className="material-symbols-outlined">phone</span>
                </div>
                <div>
                  <h4 className="home-contact-card-label">Call Us</h4>
                  <p className="home-contact-card-value">+20 100 000 0000</p>
                  <p className="home-contact-card-hint">Sun–Thu, 9am–6pm EET</p>
                </div>
              </div>

              <div className="home-contact-card">
                <div className="home-contact-card-icon">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <h4 className="home-contact-card-label">Visit Us</h4>
                  <p className="home-contact-card-value">Cairo, Egypt</p>
                  <p className="home-contact-card-hint">Downtown Medical District</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form className="home-contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="home-contact-form-row">
                <div className="home-contact-form-field">
                  <label className="home-contact-form-label">Full Name</label>
                  <input className="home-contact-form-input" type="text" placeholder="John Doe" />
                </div>
                <div className="home-contact-form-field">
                  <label className="home-contact-form-label">Email Address</label>
                  <input className="home-contact-form-input" type="email" placeholder="john@email.com" />
                </div>
              </div>
              <div className="home-contact-form-field">
                <label className="home-contact-form-label">Subject</label>
                <input className="home-contact-form-input" type="text" placeholder="How can we help?" />
              </div>
              <div className="home-contact-form-field">
                <label className="home-contact-form-label">Message</label>
                <textarea className="home-contact-form-textarea" rows={5} placeholder="Tell us more about your question..." />
              </div>
              <button type="submit" className="home-contact-form-submit">
                Send Message
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
