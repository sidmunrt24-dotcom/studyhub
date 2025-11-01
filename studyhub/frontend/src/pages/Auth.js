import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { register, login } = useAuth();
  const navigate = useNavigate();

  // Check for auth error from redirect
  useEffect(() => {
    const authError = sessionStorage.getItem('auth_error');
    if (authError) {
      setError(authError);
      sessionStorage.removeItem('auth_error');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!isLogin) {
      if (formData.name.length < 2) {
        return 'Name must be at least 2 characters long';
      }
      if (formData.password !== formData.confirmPassword) {
        return 'Passwords do not match';
      }
      if (formData.password.length < 6) {
        return 'Password must be at least 6 characters long';
      }
    }
    
    if (!formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError({ message: validationError, errors: null });
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        const { confirmPassword, ...registerData } = formData;
        result = await register(registerData);
      }

      if (result.success) {
        setSuccess(isLogin ? 'Login successful! Redirecting...' : 'Registration successful! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError({ message: result.error || `Failed to ${isLogin ? 'login' : 'register'}. Please try again.`, errors: result.errors });
      }
    } catch (err) {
      setError({ message: 'An unexpected error occurred. Please try again.', errors: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="logo-link">
              <span className="auth-logo">📚</span>
              <h1>StudyHub</h1>
            </Link>
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Sign in to your account to continue' : 'Join thousands of students learning together'}</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <div>
                <div>{error.message}</div>
                {error.errors && error.errors.length > 0 && (
                  <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                    {error.errors.map((err, index) => (
                      <li key={index}>{err.msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">I am a</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="loading">
                  <span className="spinner"></span>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                className="link-btn"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccess('');
                }}
                disabled={loading}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <div className="auth-features">
            <h3>Why Join StudyHub?</h3>
            <div className="features-grid">
              <div className="feature">
                <span className="feature-icon">📝</span>
                <span>Smart Notes</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🎓</span>
                <span>Expert Courses</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🕒</span>
                <span>Study Planner</span>
              </div>
              <div className="feature">
                <span className="feature-icon">❓</span>
                <span>Doubt Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;