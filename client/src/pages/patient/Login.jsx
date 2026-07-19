import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuth from '../../hooks/useAuth';
import { getRoleDashboard } from '../../utils/roleRoutes';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(getRoleDashboard(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const hadDarkTheme = document.body.classList.contains('dark-theme');
    document.body.classList.remove('dark-theme');
    return () => {
      if (hadDarkTheme) {
        document.body.classList.add('dark-theme');
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ email, password });
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
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
        err.response?.data?.message || 'Google login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div className="login-page">
      <div className="login-main-shell">

        {/* Left Side: Visual Anchor */}
        <section className="login-visual-panel">
          <div>
            <div className="login-brand-section">
              <span className="material-symbols-outlined login-brand-logo-icon">medical_services</span>
              <span className="login-brand-name">EasyCare</span>
            </div>
            <h1 className="login-visual-title">Elevating health with intelligence.</h1>
            <p className="login-visual-desc">
              Experience a new standard of healthcare management tailored to your lifestyle.
            </p>
          </div>

          <div className="login-visual-footer">
            <div className="login-trusted-card">
              <div className="login-trusted-icon-wrapper">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <div>
                <p className="login-trusted-text">Trusted by 2M+ users</p>
                <p className="login-trusted-subtext">Secure, encrypted medical data</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="login-form-panel">
          <div className="login-form-container">
            <div>
              <h2 className="login-heading-title">Welcome Back</h2>
              <p className="login-heading-subtitle">Log in to manage your health journey.</p>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="login-field">
                <label className="login-label" htmlFor="login-email">Email Address</label>
                <div className="login-input-wrapper">
                  <span className="material-symbols-outlined">mail</span>
                  <input
                    id="login-email"
                    className="login-input"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field">
                <div className="login-label-row">
                  <label className="login-label" htmlFor="login-password">Password</label>
                  <Link to="/forgot-password" className="login-forgot-link">Forgot Password?</Link>
                </div>
                <div className="login-input-wrapper">
                  <span className="material-symbols-outlined">lock</span>
                  <input
                    id="login-password"
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    className="login-password-toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                <span>{loading ? 'Signing in...' : 'Login'}</span>
                {!loading && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>}
              </button>
            </form>

            {/* Divider */}
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">OR CONTINUE WITH</span>
            </div>

            {/* Google Login */}
            <div className="login-google-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width="100%"
                text="signin_with"
                shape="pill"
              />
            </div>

            {/* Register Link */}
            <div className="login-footer-text">
              <p>
                Don&apos;t have an account?
                <Link to="/register" style={{ marginLeft: '4px' }}>Register Now</Link>
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* Footer Credits */}
      <p className="login-footer-credits">© 2026 EasyCare. Trusted Healthcare Technology.</p>
    </div>
  );
}
