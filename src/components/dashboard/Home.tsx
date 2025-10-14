import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { filesAPI, linksAPI } from '../../services/api';
import { 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  Star, 
  Eye,
  MoreVertical,
  Plus
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import FileUploadModal from './FileUploadModal';
import CreateLinkModal from './CreateLinkModal';

interface RecentFile {
  _id: string;
  customFilename: string;
  originalFilename: string;
  size: number;
  mimetype: string;
  favorite: boolean;
  createdAt: string;
  linksCount?: number;
}

interface RecentLink {
  _id: string;
  customName: string;
  linkId: string;
  file: {
    customFilename: string;
    originalFilename: string;
  };
  isActive: boolean;
  currentAccessCount: number;
  createdAt: string;
}

const Home: React.FC = () => {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [recentLinks, setRecentLinks] = useState<RecentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useState(false);
  const [selectedFileForLink, setSelectedFileForLink] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [filesResponse, linksResponse] = await Promise.all([
        filesAPI.getRecent(),
        linksAPI.getRecent()
      ]);
      
      console.log('filesResponse', filesResponse);
      console.log('linksResponse', linksResponse);
      setRecentFiles(filesResponse.data.files);
      setRecentLinks(linksResponse.data.links);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = () => {
    setUploadModalOpen(false);
    loadDashboardData();
  };

  const handleLinkCreated = () => {
    setCreateLinkModalOpen(false);
    setSelectedFileForLink(null);
    loadDashboardData();
  };

  const handleCreateLinkForFile = (fileId: string) => {
    setSelectedFileForLink(fileId);
    setCreateLinkModalOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-gradient mb-1">Dashboard</h2>
          <p className="text-muted mb-0">Manage your files and links</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => setCreateLinkModalOpen(true)}
          >
            <LinkIcon className="me-2" size={16} />
            Create Link
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setUploadModalOpen(true)}
          >
            <Upload className="me-2" size={16} />
            Upload File
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card glass h-100">
            <div className="card-body text-center">
              <FileText className="text-primary mb-2" size={32} />
              <h4 className="text-primary mb-1">{recentFiles.length}</h4>
              <small className="text-muted">Recent Files</small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card glass h-100">
            <div className="card-body text-center">
              <LinkIcon className="text-success mb-2" size={32} />
              <h4 className="text-success mb-1">{recentLinks.length}</h4>
              <small className="text-muted">Recent Links</small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card glass h-100">
            <div className="card-body text-center">
              <Star className="text-warning mb-2" size={32} />
              <h4 className="text-warning mb-1">
                {recentFiles.filter(f => f.favorite).length}
              </h4>
              <small className="text-muted">Favorites</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Recent Files */}
        <div className="col-lg-6 mb-4">
          <div className="card glass h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FileText className="me-2" size={20} />
                Recent Files
              </h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/dashboard/files')}
              >
                View All
              </button>
            </div>
            <div className="card-body p-0">
              {recentFiles.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="text-muted mb-2" size={48} />
                  <p className="text-muted mb-3">No files uploaded yet</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <Upload className="me-2" size={16} />
                    Upload Your First File
                  </button>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentFiles.map((file) => (
                    <div key={file._id} className="list-group-item glass border-0 d-flex align-items-center">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <h6 className="mb-0 me-2">{file.customFilename}</h6>
                          {file.favorite && (
                            <Star className="text-warning" size={14} fill="currentColor" />
                          )}
                        </div>
                        <small className="text-muted">
                          {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                        </small>
                      </div>
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-link text-muted"
                          data-bs-toggle="dropdown"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <ul className="dropdown-menu glass">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleCreateLinkForFile(file._id)}
                            >
                              <Plus className="me-2" size={14} />
                              Create Link
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Links */}
        <div className="col-lg-6 mb-4">
          <div className="card glass h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <LinkIcon className="me-2" size={20} />
                Recent Links
              </h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/dashboard/links')}
              >
                View All
              </button>
            </div>
            <div className="card-body p-0">
              {recentLinks.length === 0 ? (
                <div className="text-center py-4">
                  <LinkIcon className="text-muted mb-2" size={48} />
                  <p className="text-muted mb-3">No links created yet</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setCreateLinkModalOpen(true)}
                  >
                    <Plus className="me-2" size={16} />
                    Create Your First Link
                  </button>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentLinks.map((link) => (
                    <div key={link._id} className="list-group-item glass border-0">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <h6 className="mb-0">{link.customName}</h6>
                        <span className={`badge ${link.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <small className="text-muted">
                          {link.file.customFilename}
                        </small>
                        <div className="d-flex align-items-center text-muted">
                          <Eye className="me-1" size={12} />
                          <small>{link.currentAccessCount}</small>
                        </div>
                      </div>
                      <small className="text-muted">
                        Created {formatDate(link.createdAt)}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onFileUploaded={handleFileUploaded}
      />

      <CreateLinkModal
        isOpen={createLinkModalOpen}
        onClose={() => {
          setCreateLinkModalOpen(false);
          setSelectedFileForLink(null);
        }}
        onLinkCreated={handleLinkCreated}
        preselectedFileId={selectedFileForLink}
      />
    </div>
  );
};

export default Home;