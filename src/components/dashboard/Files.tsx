import React, { useState, useEffect } from 'react';
import { filesAPI } from '../../services/api';
import { 
  Upload, 
  Search, 
  Star, 
  Download, 
  Trash2, 
  MoreVertical,
  Plus,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import FileUploadModal from './FileUploadModal';
import CreateLinkModal from './CreateLinkModal';

interface File {
  _id: string;
  customFilename: string;
  originalFilename: string;
  size: number;
  mimetype: string;
  favorite: boolean;
  createdAt: string;
  uploadedBy: {
    username: string;
    email: string;
  };
  linksCount?: number;
}

const Files: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useState(false);
  const [selectedFileForLink, setSelectedFileForLink] = useState<string | null>(null);

  useEffect(() => {
    // In Files.tsx, before loadFiles
console.log('filesAPI:', filesAPI);
    loadFiles();
  }, [currentPage, searchQuery, sortBy, sortOrder, favoriteFilter]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await filesAPI.getAll({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        favorite: favoriteFilter,
        sortBy,
        sortOrder
      });
      
      setFiles(response.data.files);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadFiles();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleToggleFavorite = async (fileId: string) => {
    try {
      await filesAPI.toggleFavorite(fileId);
      loadFiles();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteFile = async (fileId: string, filename: string) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"? This will also delete all associated links.`)) {
      try {
        await filesAPI.deleteFile(fileId);
        loadFiles();
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await filesAPI.download(fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />;
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-gradient mb-1">Files</h2>
          <p className="text-muted mb-0">Manage your uploaded files</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setUploadModalOpen(true)}
        >
          <Upload className="me-2" size={16} />
          Upload File
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card glass mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-6 mb-3 mb-md-0">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="submit">
                    <Search size={16} />
                  </button>
                </div>
              </form>
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-2 justify-content-md-end">
                <button
                  className={`btn ${favoriteFilter ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => {
                    setFavoriteFilter(!favoriteFilter);
                    setCurrentPage(1);
                  }}
                >
                  <Star size={16} className={favoriteFilter ? 'fill-current' : ''} />
                  Favorites
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="card glass">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <LoadingSpinner size="lg" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-5">
              <Upload className="text-muted mb-3" size={64} />
              <h5 className="text-muted mb-3">No files found</h5>
              <p className="text-muted mb-3">
                {searchQuery || favoriteFilter 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first file to get started'
                }
              </p>
              {!searchQuery && !favoriteFilter && (
                <button
                  className="btn btn-primary"
                  onClick={() => setUploadModalOpen(true)}
                >
                  <Upload className="me-2" size={16} />
                  Upload File
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th 
                        className="cursor-pointer user-select-none"
                        onClick={() => handleSort('customFilename')}
                      >
                        <div className="d-flex align-items-center">
                          File Name
                          {getSortIcon('customFilename')}
                        </div>
                      </th>
                      <th 
                        className="cursor-pointer user-select-none"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="d-flex align-items-center">
                          Upload Time
                          {getSortIcon('createdAt')}
                        </div>
                      </th>
                      <th>Owner</th>
                      <th>Size</th>
                      <th>Links</th>
                      <th>Favorite</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file._id}>
                        <td>
                          <div>
                            <div className="fw-semibold">{file.customFilename}</div>
                            <small className="text-muted">{file.originalFilename}</small>
                          </div>
                        </td>
                        <td>
                          <small>{formatDate(file.createdAt)}</small>
                        </td>
                        <td>
                          <small>{file.uploadedBy.username}</small>
                        </td>
                        <td>
                          <small>{formatFileSize(file.size)}</small>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {file.linksCount || 0}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${file.favorite ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => handleToggleFavorite(file._id)}
                          >
                            <Star size={14} className={file.favorite ? 'fill-current' : ''} />
                          </button>
                        </td>
                        <td>
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              data-bs-toggle="dropdown"
                            >
                              <MoreVertical size={14} />
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
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDownload(file._id, file.originalFilename)}
                                >
                                  <Download className="me-2" size={14} />
                                  Download
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  onClick={() => handleDeleteFile(file._id, file.customFilename)}
                                >
                                  <Trash2 className="me-2" size={14} />
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center p-3">
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onFileUploaded={() => {
          setUploadModalOpen(false);
          loadFiles();
        }}
      />

      <CreateLinkModal
        isOpen={createLinkModalOpen}
        onClose={() => {
          setCreateLinkModalOpen(false);
          setSelectedFileForLink(null);
        }}
        onLinkCreated={() => {
          setCreateLinkModalOpen(false);
          setSelectedFileForLink(null);
          loadFiles();
        }}
        preselectedFileId={selectedFileForLink}
      />
    </div>
  );
};

export default Files;