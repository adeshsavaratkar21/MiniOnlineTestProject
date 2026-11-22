import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/subjects';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please enter your phone number.');
      return;
    }

    // Phone number should contain at least 7 to 15 digits
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      setErrorMessage('Please enter a valid phone number (at least 7 to 10 digits).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      await login({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password
      });

      const destination = location.state?.from?.pathname || '/subjects';
      navigate(destination, { replace: true });
    } catch (err) {
      let msg = 'Failed to log in. Please check your credentials and try again.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Cannot connect to backend API server at http://localhost:5000. Please ensure the backend server is started.';
      }
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutofillDemo = () => {
    setName('Demo Student');
    setEmail('test@example.com');
    setPhone('9876543210');
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card examinee-login-card">
        <div className="auth-header">
          <div className="auth-badge-icon">🎓</div>
          <h2>Examinee Portal Login</h2>
          <p>Enter your full registration credentials to enter the online examination.</p>
        </div>

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Quick Demo Autofill Box */}
          <div className="demo-credentials-box">
            <div className="demo-box-header">
              <span>💡 Quick Demo Examinee</span>
              <button
                type="button"
                className="btn-link-autofill"
                onClick={handleAutofillDemo}
              >
                Auto-fill All
              </button>
            </div>
            <div className="demo-credentials-details">
              <span><strong>Name:</strong> Demo Student</span>
              <span><strong>Email:</strong> test@example.com</span>
              <span><strong>Phone:</strong> 9876543210</span>
              <span><strong>Password:</strong> password123</span>
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="name">
              Full Name <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="field-icon">👤</span>
              <input
                id="name"
                type="text"
                className="form-control with-icon"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="field-icon">✉️</span>
              <input
                id="email"
                type="email"
                className="form-control with-icon"
                placeholder="e.g. student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phone">
              Phone Number <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="field-icon">📱</span>
              <input
                id="phone"
                type="tel"
                className="form-control with-icon"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="label-row-flex">
              <label htmlFor="password">
                Password <span className="req-star">*</span>
              </label>
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="input-with-icon">
              <span className="field-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control with-icon"
                placeholder="Enter password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-exam-login"
            disabled={submitting}
          >
            {submitting ? 'Verifying & Entering Exam...' : 'Log In to Examination →'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            First time registering?{' '}
            <Link to="/signup" className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
