import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import './Login.css';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await forgotPassword({ email });
      setSuccess(true);
      // In dev mode the token is returned directly
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-blob-top" />
      <div className="login-blob-bottom" />

      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-card-body">
            <div className="login-brand">
              <div className="login-brand-logo">
                <div className="login-brand-icon">
                  <span className="material-symbols-outlined">local_hospital</span>
                </div>
                <span className="login-brand-name">EasyCare</span>
              </div>

              {!success ? (
                <>
                  <h1 className="login-title">Forgot Password</h1>
                  <p className="login-subtitle">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </>
              ) : (
                <>
                  <div className="fp-success-icon">
                    <span className="material-symbols-outlined">mark_email_read</span>
                  </div>
                  <h1 className="login-title">Check Your Email</h1>
                  <p className="login-subtitle">
                    If an account exists for <strong>{email}</strong>, you will receive password reset instructions.
                  </p>
                </>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            {!success ? (
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-field">
                  <label className="login-label" htmlFor="fp-email">
                    EMAIL ADDRESS
                  </label>
                  <div className="login-input-wrapper">
                    <span className="material-symbols-outlined">mail</span>
                    <input
                      id="fp-email"
                      className="login-input"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                  {!loading && (
                    <span className="material-symbols-outlined">send</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="fp-token-section">
                {resetToken && (
                  <div className="fp-dev-token">
                    <p className="fp-dev-label">
                      <span className="material-symbols-outlined">code</span>
                      Dev Mode — Reset Token:
                    </p>
                    <code className="fp-token-code">{resetToken}</code>
                    <Link to={`/reset-password?token=${resetToken}`} className="login-submit" style={{ textDecoration: 'none', marginTop: 16 }}>
                      Reset Password Now
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="login-card-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>

        <div className="login-aux-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </div>
      </div>
    </div>
  );
}
