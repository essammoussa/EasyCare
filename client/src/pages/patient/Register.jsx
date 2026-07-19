import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuth from '../../hooks/useAuth';
import './Register.css';

export default function Register() {
  useEffect(() => {
    const hadDarkTheme = document.body.classList.contains('dark-theme');
    document.body.classList.remove('dark-theme');
    return () => {
      if (hadDarkTheme) {
        document.body.classList.add('dark-theme');
      }
    };
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ name, email, password, phone, role: 'patient' });
      // Redirect based on role
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Google registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in failed. Please try again.');
  };

  const getPasswordStrength = () => {
    if (!password) return { width: '0%', color: 'transparent', label: '' };
    if (password.length < 6) return { width: '33.33%', color: '#ba1a1a', label: 'Weak' };
    if (password.length < 10) return { width: '66.66%', color: '#F59E0B', label: 'Medium' };
    return { width: '100%', color: '#006b58', label: 'Strong' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="register-page">
      <div className="register-main-shell">
        
        {/* Left Side: Visual/Branding Panel */}
        <section className="register-visual-panel">
          <div className="register-brand-section">
            <div className="register-brand-logo-box">
              <span className="material-symbols-outlined">health_and_safety</span>
            </div>
            <span className="register-brand-name">EasyCare</span>
          </div>

          <div>
            <h1 className="register-visual-title">Elevate your healthcare experience.</h1>
            <p className="register-visual-subtitle">Join over 50,000 users managing their health with clinical precision and digital ease.</p>
          </div>

          <div className="register-visual-footer">
            <div className="register-glass-panel">
              <div className="register-specialists-row">
                <div className="register-avatar-group">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB44w-2eJ9TqENqZw8JPJh2qe10qmcGQxsBpUBMKcoyCjM_iAmiAS3blqfwlbk-EoZPwFQKQ9kOBYmXCjEh0MOKtaA2sjRkVpYEr80et22-1-wIhYa2qeJY4UN2PBkt7X_4eNO-YMQG5PtS_9KFSJrMIqf9UOMRayaxTsDR68FehRrVWitgoeUbG2ZyyUttSQd58DTcoELePIi4dejQTtk-D-SXtAnpst_GDzC1w0_xIR3rFUz1LHBFQ2hcG1iKLJykT04kSYp88Zg" alt="Doctor avatar" />
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa6GgSAeTr_0nvT9uwqNn68loI3fOUWJ25yOaTPwa7A2x17iyXQhj4KQYw928azJ8JdT3tNAWhwlqgtSKSusbSo0v1tdi8DEn-jwBxayT3bvv8XBqDVDnnvOhFp4iMi-6UE7WTirribT56mBwRQk9BjcdhDD80eKLeOL6iLphWlXZreionPJY8tX1bTLpcyxqQ2G_Sed58aiudmEdcdGMES2LSsfkDANWdZ4A6fE5WAo-FKIixmyiXAI_waruP7IcFXGeE9fCW1Tj8" alt="Doctor avatar" />
                  <div className="register-avatar-more">+12</div>
                </div>
                <span className="register-specialists-label">Verified Specialists Active</span>
              </div>
              <div className="register-progress-bar">
                <div className="register-progress-bar-fill"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Form Panel */}
        <section className="register-form-panel">
          <div className="register-form-container">
            <div className="register-heading">
              <h2 className="register-heading-title">Create an Account</h2>
              <p className="register-heading-desc">Start your journey toward better health today.</p>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            <form className="register-form" onSubmit={handleSubmit} autoComplete="off">
              <div className="register-form-inputs">
                
                {/* Full Name */}
                <div className="register-input-group">
                  <label className="register-input-label" htmlFor="fullName">Full Name</label>
                  <div className="register-field-wrapper">
                    <span className="material-symbols-outlined">badge</span>
                    <input
                      id="fullName"
                      className="register-field-input"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="register-input-group">
                  <label className="register-input-label" htmlFor="email">Email Address</label>
                  <div className="register-field-wrapper">
                    <span className="material-symbols-outlined">mail</span>
                    <input
                      id="email"
                      className="register-field-input"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number (Preserved Feature) */}
                <div className="register-input-group">
                  <label className="register-input-label" htmlFor="phone">Phone Number</label>
                  <div className="register-field-wrapper">
                    <span className="material-symbols-outlined">phone</span>
                    <input
                      id="phone"
                      className="register-field-input"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="register-input-group">
                  <label className="register-input-label" htmlFor="password">Password</label>
                  <div className="register-field-wrapper">
                    <span className="material-symbols-outlined">lock</span>
                    <input
                      id="password"
                      className="register-field-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      className="register-password-toggle"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {password && (
                    <div className="register-password-strength">
                      <div className="register-strength-bar">
                        <div
                          className="register-strength-bar-fill"
                          style={{
                            width: strength.width,
                            backgroundColor: strength.color,
                            transition: 'all 0.3s ease'
                          }}
                        ></div>
                      </div>
                      <span className="register-strength-text" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Terms */}
              <div className="register-terms-row">
                <input
                  id="terms"
                  className="register-terms-checkbox"
                  type="checkbox"
                  required
                />
                <label className="register-terms-label" htmlFor="terms">
                  I agree to the <a className="register-terms-link" href="#">Terms of Service</a> and <a className="register-terms-link" href="#">Privacy Policy</a>.
                </label>
              </div>

              {/* Submit */}
              <button
                className="register-btn-submit"
                type="submit"
                disabled={loading}
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>

              {/* Divider */}
              <div className="register-divider">
                <div className="register-divider-line"></div>
                <span className="register-divider-text">Or join with</span>
              </div>

              {/* Google Register */}
              <div className="register-google-btn-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signup_with"
                  shape="pill"
                />
              </div>

            </form>

            {/* Footer */}
            <p className="register-footer-text">
              Already have an account? 
              <Link to="/login" style={{ marginLeft: '4px' }}>Sign in</Link>
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
