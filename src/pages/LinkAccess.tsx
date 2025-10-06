import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { linksAPI } from '../services/api';
import { Download, Shield, Zap, Lock, User, Clock, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface LinkData {
  id: string;
  customName: string;
  description: string;
  accessType: 'info' | 'view' | 'download';
  file: {
    id: string;
    customFilename: string;
    originalFilename: string;
    mimetype: string;
    size: number;
  };
}

const LinkAccess: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [error, setError] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authType, setAuthType] = useState<'password' | 'username' | null>(null);
  const [authValue, setAuthValue] = useState('');

  useEffect(() => {
    if (linkId) {
      accessLink();
    }
  }, [linkId]);

  const accessLink = async (authParams?: { password?: string; username?: string }) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await linksAPI.access(linkId!, authParams);
      setLinkData(response.data.link);
      setNeedsAuth(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to access link';
      
      if (err.response?.status === 401) {
        if (errorMsg.includes('password')) {
          setAuthType('password');
          setNeedsAuth(true);
        } else if (errorMsg.includes('username')) {
          setAuthType('username');
          setNeedsAuth(true);
        } else if (errorMsg.includes('Login is required')) {
          setError('This link is accessible only to logged-in users. Please log in to proceed.');
        } else if (errorMsg.includes('Authentication required')) {
          setError('This link requires authentication. Please log in to access it.');
        } else {
          setError(errorMsg);
        }
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authValue.trim()) return;

    const authParams = authType === 'password' 
      ? { password: authValue }
      : { username: authValue };
    
    accessLink(authParams);
  };

  const handleDownload = async () => {
    if (linkData?.accessType !== 'download') return;

    try {
      setDownloading(true);
      
      const authParams = authType && authValue 
        ? (authType === 'password' ? { password: authValue } : { username: authValue })
        : undefined;

      const response = await linksAPI.download(linkId!, authParams);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', linkData.file.originalFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleView = async () => {
    if (!linkData || (linkData.accessType !== 'view' && linkData.accessType !== 'download')) return;
  
    try {
      setViewing(true);
      
      const authParams = authType && authValue 
        ? (authType === 'password' ? { password: authValue } : { username: authValue })
        : undefined;
  
      const response = await linksAPI.view(linkId!, authParams);
      
      const file = new Blob([response.data], { type: linkData.file.mimetype });
      const fileURL = URL.createObjectURL(file);
      
      // Open file in a new tab
      window.open(fileURL, '_blank');
      
      // Clean up the object URL after some time
      setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
  
    } catch (err: any) {
      setError(err.response?.data?.message || 'File view failed');
    } finally {
      setViewing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-muted">Accessing link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <Shield className="text-primary me-2" size={32} />
                <Zap className="text-warning" size={24} />
              </div>
              <h1 className="font-handcrafted text-gradient mb-2">GuardShare</h1>
              <p className="text-muted">Secure File Access</p>
            </div>

            {/* Error State */}
            {error && !needsAuth && (
              <div className="card glass p-4 text-center fade-in">
                <div className="card-body">
                  <AlertCircle className="text-danger mb-3" size={48} />
                  <h4 className="text-danger mb-3">Access Denied</h4>
                  <p className="text-muted mb-3">{error}</p>
                  <Link to="/login" className="btn btn-primary">
                    Go to Login
                  </Link>
                </div>
              </div>
            )}

            {/* Authentication Required */}
            {needsAuth && (
              <div className="card glass p-4 fade-in">
                <div className="card-body">
                  <div className="text-center mb-4">
                    <Lock className="text-warning mb-3" size={48} />
                    <h4>Authentication Required</h4>
                    <p className="text-muted">
                      This link requires {authType} verification to access.
                    </p>
                  </div>

                  {error && (
                    <div className="alert alert-danger glass" role="alert">
                      <small>{error}</small>
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit}>
                    <div className="mb-3">
                      <label htmlFor="authValue" className="form-label">
                        {authType === 'password' ? 'Password' : 'Username'}
                      </label>
                      <div className="position-relative">
                        <input
                          type={authType === 'password' ? 'password' : 'text'}
                          className="form-control pe-5"
                          id="authValue"
                          value={authValue}
                          onChange={(e) => setAuthValue(e.target.value)}
                          placeholder={`Enter ${authType}`}
                          required
                        />
                        {authType === 'password' ? (
                          <Lock className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted" size={18} />
                        ) : (
                          <User className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted" size={18} />
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Verifying...
                        </>
                      ) : (
                        'Access Link'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Link Content */}
            {linkData && !needsAuth && (
              <div className="card glass p-4 fade-in">
                <div className="card-body">
                  <div className="text-center mb-4">
                    <Shield className="text-success mb-3" size={48} />
                    <h4 className="text-success">Access Granted</h4>
                  </div>

                  {/* Link Info */}
                  <div className="mb-4">
                    <h5 className="text-primary mb-3">{linkData.customName}</h5>
                    {linkData.description && (
                      <p className="text-muted mb-3">{linkData.description}</p>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="card glass-strong p-3 mb-4">
                    <div className="row align-items-center">
                      <div className="col">
                        <h6 className="mb-1">{linkData.file.customFilename}</h6>
                        <small className="text-muted">
                          {linkData.file.originalFilename} • {formatFileSize(linkData.file.size)}
                        </small>
                      </div>
                      <div className="col-auto">
                        <span className="badge bg-secondary">
                          {linkData.file.mimetype.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="text-center">
                    {linkData.accessType === 'info' ? (
                      <div className="alert alert-info glass" role="alert">
                        <Clock className="me-2" size={18} />
                        Download and view are not allowed for this link. You can only see file information.
                      </div>
                    ) : (
                      <div className="d-flex justify-content-center gap-2">
                        {/* View Button */}
                        {(linkData.accessType === 'view' || linkData.accessType === 'download') && (
                          <button
                            onClick={handleView}
                            className="btn btn-info btn-lg"
                            disabled={viewing}
                          >
                            {viewing ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Opening...
                              </>
                            ) : (
                              <>
                                <Download className="me-2" size={20} />
                                View File
                              </>
                            )}
                          </button>
                        )}

                        {/* Download Button */}
                        {linkData.accessType === 'download' ? (
                          <button
                            onClick={handleDownload}
                            className="btn btn-success btn-lg"
                            disabled={downloading}
                          >
                            {downloading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="me-2" size={20} />
                                Download File
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="alert alert-warning glass" role="alert">
                            <Clock className="me-2" size={18} />
                            Download is not allowed for this link.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-4 pt-3 border-top border-secondary">
                    <small className="text-muted">
                      Powered by <span className="text-gradient font-handcrafted">GuardShare</span>
                    </small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkAccess;