import React, { useState, useEffect } from 'react';
import { linksAPI, usersAPI } from '../../services/api';
import { 
  Link as LinkIcon, 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Lock, 
  Download,
  AlertCircle,
  Search,
  Edit
} from 'lucide-react';

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkUpdated: () => void;
  link: any; // The link object to edit
}

interface User {
  _id: string;
  username: string;
  email: string;
}

const EditLinkModal: React.FC<EditLinkModalProps> = ({
  isOpen,
  onClose,
  onLinkUpdated,
  link
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customName: '',
    expirationType: 'none',
    expirationValue: '',
    accessLimit: '',
    verificationType: 'none',
    verificationValue: '',
    accessScope: 'public',
    allowedUsers: [] as string[],
    downloadAllowed: false,
    description: ''
  });

  useEffect(() => {
    if (isOpen && link) {
      setFormData({
        customName: link.customName,
        expirationType: link.expirationType || 'none',
        expirationValue: link.expirationValue || '',
        accessLimit: link.accessLimit || '',
        verificationType: link.verificationType || 'none',
        verificationValue: link.verificationValue || '',
        accessScope: link.accessScope || 'public',
        allowedUsers: link.allowedUsers.map((u: any) => u._id) || [],
        downloadAllowed: link.downloadAllowed || false,
        description: link.description || ''
      });
    }
  }, [isOpen, link]);

  useEffect(() => {
    if (userSearchQuery.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [userSearchQuery]);

  const searchUsers = async () => {
    try {
      const response = await usersAPI.searchUsers(userSearchQuery);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setError('');
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      allowedUsers: prev.allowedUsers.includes(userId)
        ? prev.allowedUsers.filter(id => id !== userId)
        : [...prev.allowedUsers, userId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customName.trim()) {
      setError('Please provide a custom name');
      return;
    }

    if (formData.expirationType === 'duration' && (!formData.expirationValue || parseInt(formData.expirationValue) <= 0)) {
      setError('Please provide a valid expiration duration');
      return;
    }

    if (formData.expirationType === 'date' && (!formData.expirationValue || new Date(formData.expirationValue) <= new Date())) {
      setError('Please provide a valid future expiration date');
      return;
    }

    if (formData.verificationType !== 'none' && !formData.verificationValue.trim()) {
      setError('Please provide a verification value');
      return;
    }

    if (formData.accessScope === 'selected' && formData.allowedUsers.length === 0) {
      setError('Please select at least one user for selected access scope');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const linkData = {
        customName: formData.customName.trim(),
        expirationType: formData.expirationType,
        expirationValue: formData.expirationType === 'none' ? null : 
                        formData.expirationType === 'date' ? formData.expirationValue :
                        parseInt(formData.expirationValue),
        accessLimit: formData.accessLimit ? parseInt(formData.accessLimit) : null,
        verificationType: formData.verificationType,
        verificationValue: formData.verificationType === 'none' ? null : formData.verificationValue.trim(),
        accessScope: formData.accessScope,
        allowedUsers: formData.accessScope === 'selected' ? formData.allowedUsers : [],
        downloadAllowed: formData.downloadAllowed,
        description: formData.description.trim()
      };

      await linksAPI.updateLink(link._id, linkData);
      
      onLinkUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update link');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setUserSearchQuery('');
      setUsers([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content glass">
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title">
              <Edit className="me-2" size={20} />
              Edit Shareable Link
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger glass d-flex align-items-center mb-4" role="alert">
                  <AlertCircle className="me-2" size={16} />
                  {error}
                </div>
              )}

              <div className="row">
                {/* Left Column */}
                <div className="col-md-6">
                  {/* File Information */}
                  <div className="mb-3">
                    <label className="form-label">File</label>
                    <input
                      type="text"
                      className="form-control"
                      value={`${link?.file?.customFilename} (${link?.file?.originalFilename})`}
                      disabled
                    />
                  </div>

                  {/* Custom Name */}
                  <div className="mb-3">
                    <label htmlFor="customName" className="form-label">
                      Custom Link Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="customName"
                      name="customName"
                      value={formData.customName}
                      onChange={handleInputChange}
                      placeholder="Enter a unique name for this link"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      Description (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Add a description for this link"
                      rows={3}
                      disabled={loading}
                    />
                  </div>

                  {/* Expiration */}
                  <div className="mb-3">
                    <label className="form-label">
                      <Calendar className="me-2" size={16} />
                      Expiration
                    </label>
                    <div className="row">
                      <div className="col-6">
                        <select
                          className="form-select"
                          name="expirationType"
                          value={formData.expirationType}
                          onChange={handleInputChange}
                          disabled={loading}
                        >
                          <option value="none">Never expires</option>
                          <option value="duration">Duration (seconds)</option>
                          <option value="date">Specific date</option>
                        </select>
                      </div>
                      <div className="col-6">
                        {formData.expirationType === 'duration' && (
                          <input
                            type="number"
                            className="form-control"
                            name="expirationValue"
                            value={formData.expirationValue}
                            onChange={handleInputChange}
                            placeholder="Seconds"
                            min="1"
                            disabled={loading}
                          />
                        )}
                        {formData.expirationType === 'date' && (
                          <input
                            type="datetime-local"
                            className="form-control"
                            name="expirationValue"
                            value={formData.expirationValue}
                            onChange={handleInputChange}
                            disabled={loading}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Access Limit */}
                  <div className="mb-3">
                    <label htmlFor="accessLimit" className="form-label">
                      Access Limit (Optional)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="accessLimit"
                      name="accessLimit"
                      value={formData.accessLimit}
                      onChange={handleInputChange}
                      placeholder="Leave empty for unlimited access"
                      min="1"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="col-md-6">
                  {/* Verification */}
                  <div className="mb-3">
                    <label className="form-label">
                      <Lock className="me-2" size={16} />
                      Verification
                    </label>
                    <div className="row">
                      <div className="col-6">
                        <select
                          className="form-select"
                          name="verificationType"
                          value={formData.verificationType}
                          onChange={handleInputChange}
                          disabled={loading}
                        >
                          <option value="none">No verification</option>
                          <option value="password">Password</option>
                          <option value="username">Username</option>
                        </select>
                      </div>
                      <div className="col-6">
                        {formData.verificationType !== 'none' && (
                          <input
                            type={formData.verificationType === 'password' ? 'password' : 'text'}
                            className="form-control"
                            name="verificationValue"
                            value={formData.verificationValue}
                            onChange={handleInputChange}
                            placeholder={`Enter ${formData.verificationType}`}
                            disabled={loading}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Access Scope */}
                  <div className="mb-3">
                    <label className="form-label">
                      <Users className="me-2" size={16} />
                      Access Scope
                    </label>
                    <select
                      className="form-select"
                      name="accessScope"
                      value={formData.accessScope}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <option value="public">Public (anyone with link)</option>
                      <option value="users">Registered users only</option>
                      <option value="selected">Selected users only</option>
                    </select>
                  </div>

                  {/* Selected Users */}
                  {formData.accessScope === 'selected' && (
                    <div className="mb-3">
                      <label className="form-label">Select Users</label>
                      <div className="input-group mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search users..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          disabled={loading}
                        />
                        <span className="input-group-text">
                          <Search size={16} />
                        </span>
                      </div>
                      
                      {users.length > 0 && (
                        <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {users.map((user) => (
                            <div key={user._id} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`user-edit-${user._id}`}
                                checked={formData.allowedUsers.includes(user._id)}
                                onChange={() => handleUserToggle(user._id)}
                                disabled={loading}
                              />
                              <label className="form-check-label" htmlFor={`user-edit-${user._id}`}>
                                {user.username} ({user.email})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {formData.allowedUsers.length > 0 && (
                        <div className="mt-2">
                          <small className="text-muted">
                            {formData.allowedUsers.length} user(s) selected
                          </small>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Download Permission */}
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="downloadAllowed-edit"
                        name="downloadAllowed"
                        checked={formData.downloadAllowed}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      <label className="form-check-label" htmlFor="downloadAllowed-edit">
                        <Download className="me-2" size={16} />
                        Allow file download
                      </label>
                    </div>
                    <small className="text-muted">
                      If unchecked, users can only view file information
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top border-secondary">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="me-2" size={16} />
                    Update Link
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLinkModal;