import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { User, Mail, Shield, X, Edit, Save, AlertCircle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim()) {
      setError('Username and email are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await authAPI.updateProfile({
        username: formData.username.trim(),
        email: formData.email.trim()
      });
      
      setSuccess('Profile updated successfully');
      setEditing(false);
      
      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || ''
    });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content glass">
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title">
              <User className="me-2" size={20} />
              User Profile
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger glass d-flex align-items-center mb-4" role="alert">
                <AlertCircle className="me-2" size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success glass d-flex align-items-center mb-4" role="alert">
                <AlertCircle className="me-2" size={16} />
                {success}
              </div>
            )}

            {/* Profile Header */}
            <div className="text-center mb-4">
              <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                   style={{ width: '80px', height: '80px' }}>
                <span className="text-white fw-bold fs-2">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <h4 className="text-gradient">{user.username}</h4>
              <div className="d-flex align-items-center justify-content-center">
                {user.role === 'superuser' ? (
                  <Shield className="text-warning me-2" size={16} />
                ) : (
                  <User className="text-primary me-2" size={16} />
                )}
                <span className={`badge ${user.role === 'superuser' ? 'bg-warning' : 'bg-primary'}`}>
                  {user.role === 'superuser' ? 'Super User' : 'User'}
                </span>
              </div>
            </div>

            {editing ? (
              /* Edit Form */
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="username" className="form-label">
                      <User className="me-2" size={16} />
                      Username
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">
                      <Mail className="me-2" size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="me-2" size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card glass-strong p-3">
                      <div className="d-flex align-items-center mb-2">
                        <User className="text-primary me-2" size={16} />
                        <small className="text-muted">Username</small>
                      </div>
                      <div className="fw-semibold">{user.username}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card glass-strong p-3">
                      <div className="d-flex align-items-center mb-2">
                        <Mail className="text-primary me-2" size={16} />
                        <small className="text-muted">Email</small>
                      </div>
                      <div className="fw-semibold">{user.email}</div>
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card glass-strong p-3">
                      <div className="d-flex align-items-center mb-2">
                        <Shield className="text-warning me-2" size={16} />
                        <small className="text-muted">Role</small>
                      </div>
                      <div className="fw-semibold text-capitalize">{user.role}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card glass-strong p-3">
                      <div className="d-flex align-items-center mb-2">
                        <User className="text-success me-2" size={16} />
                        <small className="text-muted">Status</small>
                      </div>
                      <span className="badge bg-success">Active</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="me-2" size={16} />
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;