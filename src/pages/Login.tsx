import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card glass p-4 fade-in">
              <div className="card-body">
                {/* Logo and Title */}
                <div className="text-center mb-4">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <ShieldCheck className="text-primary me-2" size={32} />
                    <span className="fs-5 fw-bold text-gradient">Guard</span>
                    <span className="fs-5 text-gradient">Share</span>
                  </div>
                  <p className="text-muted">Secure file sharing reimagined</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger glass" role="alert">
                    <small>{error}</small>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Username or Email
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter your username or email"
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control pe-5"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ border: 'none', padding: '0.375rem 0.75rem' }}
                      >
                        {showPassword ? (
                          <EyeOff size={18} className="text-muted" />
                        ) : (
                          <Eye size={18} className="text-muted" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Links */}
                <div className="text-center">
                  <p className="mb-2">
                    <Link to="#" className="text-decoration-none text-primary">
                      Forgot Password?
                    </Link>
                  </p>
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-decoration-none text-primary fw-semibold">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="card glass mt-3 p-3">
              <div className="card-body p-2">
                <h6 className="text-center mb-2">Demo Credentials</h6>
                <div className="row text-center">
                  <div className="col-6">
                    <small className="text-muted d-block">Regular User</small>
                    <small><strong>demo</strong> / <strong>demo123</strong></small>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Super User</small>
                    <small><strong>admin</strong> / <strong>admin123</strong></small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;