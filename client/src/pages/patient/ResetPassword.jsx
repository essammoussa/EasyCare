import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import './Login.css';
import './ForgotPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 20, label: 'Weak', color: '#ef4444' };
    if (score === 2) return { level: 40, label: 'Fair', color: '#f59e0b' };
    if (score === 3) return { level: 60, label: 'Good', color: '#eab308' };
    if (score === 4) return { level: 80, label: 'Strong', color: '#22c55e' };
    return { level: 100, label: 'Very Strong', color: '#059669' };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Token may be expired.');
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
              <h1 className="login-title">Reset Password</h1>
              <p className="login-subtitle">
                Enter your new password below to regain access to your account.
              </p>
            </div>

            {success && (
              <div className="rp-success-message">
                <span className="material-symbols-outlined">check_circle</span>
                <p>Password reset successfully! Redirecting to login...</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {!success && (
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-field">
                  <label className="login-label" htmlFor="rp-token">
                    RESET TOKEN
                  </label>
                  <div className="login-input-wrapper">
                    <span className="material-symbols-outlined">key</span>
                    <input
                      id="rp-token"
                      className="login-input"
                      type="text"
                      placeholder="Paste your reset token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="rp-new-password">
                    NEW PASSWORD
                  </label>
                  <div className="login-input-wrapper">
                    <span className="material-symbols-outlined">lock</span>
                    <input
                      id="rp-new-password"
                      className="login-input"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  {newPassword && (
                    <>
                      <div className="rp-strength-bar">
                        <div
                          className="rp-strength-fill"
                          style={{ width: `${strength.level}%`, background: strength.color }}
                        />
                      </div>
                      <p className="rp-strength-text" style={{ color: strength.color }}>
                        {strength.label}
                      </p>
                    </>
                  )}
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="rp-confirm-password">
                    CONFIRM PASSWORD
                  </label>
                  <div className="login-input-wrapper">
                    <span className="material-symbols-outlined">lock</span>
                    <input
                      id="rp-confirm-password"
                      className="login-input"
                      type="password"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                  {!loading && (
                    <span className="material-symbols-outlined">lock_reset</span>
                  )}
                </button>
              </form>
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
