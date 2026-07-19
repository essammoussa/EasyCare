import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand Column */}
        <div className="footer-brand-col">
          <div className="footer-brand">
            <div className="footer-brand-icon">
              <span className="material-symbols-outlined">local_hospital</span>
            </div>
            <span className="footer-brand-name">EasyCare</span>
          </div>
          <p className="footer-tagline">
            Your Health, Simplified. Reliable, secure, and modern healthcare management for everyone.
          </p>
          <div className="footer-socials">
            <button className="footer-social-btn" aria-label="Website">
              <span className="material-symbols-outlined">public</span>
            </button>
            <button className="footer-social-btn" aria-label="Email">
              <span className="material-symbols-outlined">mail</span>
            </button>
            <button className="footer-social-btn" aria-label="Share">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>


        {/* Services */}
        <div className="footer-col">
          <h4>Services</h4>
          <ul>
            <li><Link to="/doctors">Book Appointment</Link></li>
            <li><Link to="/patient/records">Medical Records</Link></li>
            <li><Link to="/patient/upload">Upload Results</Link></li>
            <li><Link to="/patient/map">Map Search</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li>
              <div className="footer-contact-item">
                <span className="material-symbols-outlined">mail</span>
                <span>info@easycare.com</span>
              </div>
            </li>
            <li>
              <div className="footer-contact-item">
                <span className="material-symbols-outlined">phone</span>
                <span>+20 100 000 0000</span>
              </div>
            </li>
            <li>
              <div className="footer-contact-item">
                <span className="material-symbols-outlined">location_on</span>
                <span>Cairo, Egypt</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} EasyCare Health. All rights reserved.</p>
      </div>
    </footer>
  );
}