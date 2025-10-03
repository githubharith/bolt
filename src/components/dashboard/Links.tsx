import React, { useState, useEffect } from 'react';
import { linksAPI } from '../../services/api';
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  MoreVertical,
  Copy,
  Calendar,
  Users,
  Lock,
  Download,
  SortAsc,
  SortDesc,
  Star
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import CreateLinkModal from './CreateLinkModal';

interface Link {
  _id: string;
  linkId: string;
  customName: string;
  file: {
    customFilename: string;
    originalFilename: string;
  };
  createdBy: {
    username: string;
    email: string;
  };
  createdAt: string;
  expiresAt?: string;
  accessLimit?: number;
  currentAccessCount: number;
  verificationType: 'none' | 'password' | 'username';
  accessScope: 'public' | 'users' | 'selected';
  downloadAllowed: boolean;
  isActive: boolean;
  favorite: boolean;
}

const Links: React.FC = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<boolean | undefined>(undefined);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useState(false);

  useEffect(() => {
    loadLinks();
  }, [currentPage, searchQuery, sortBy, sortOrder, activeFilter, favoriteFilter]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const response = await linksAPI.getLinks({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        active: activeFilter === 'all' ? undefined : activeFilter === 'active',
        favorite: favoriteFilter,
        sortBy,
        sortOrder
      });
      
      setLinks(response.data.links);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadLinks();
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

  const handleToggleActive = async (linkId: string) => {
    try {
      await linksAPI.toggle(linkId);
      loadLinks();
    } catch (error) {
      console.error('Error toggling link:', error);
    }
  };

  const handleToggleFavorite = async (linkId: string) => {
    try {
      await linksAPI.toggleFavorite(linkId);
      loadLinks();
    } catch (error) {
      console.error('Error toggling link favorite:', error);
    }
  };

  const handleDeleteLink = async (linkId: string, customName: string) => {
    if (window.confirm(`Are you sure you want to delete the link "${customName}"?`)) {
      try {
        await linksAPI.deleteLink(linkId);
        loadLinks();
      } catch (error) {
        console.error('Error deleting link:', error);
      }
    }
  };

  const handleCopyLink = (linkId: string) => {
    const url = `${window.location.origin}/link/${linkId}`;
    navigator.clipboard.writeText(url).then(() => {
      // TODO: Show toast notification
      console.log('Link copied to clipboard');
    });
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

  const getAccessScopeIcon = (scope: string) => {
    switch (scope) {
      case 'public':
        return <Eye size={14} className="text-success" />;
      case 'users':
        return <Users size={14} className="text-warning" />;
      case 'selected':
        return <Lock size={14} className="text-danger" />;
      default:
        return null;
    }
  };

  const getVerificationIcon = (type: string) => {
    if (type === 'none') return null;
    return <Lock size={14} className="text-info" />;
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-gradient mb-1">Links</h2>
          <p className="text-muted mb-0">Manage your shareable links</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setCreateLinkModalOpen(true)}
        >
          <Plus className="me-2" size={16} />
          Create Link
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
                    placeholder="Search links..."
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
                <div className="btn-group" role="group">
                  <button
                    className={`btn ${favoriteFilter === undefined ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => {
                      setFavoriteFilter(undefined);
                      setCurrentPage(1);
                    }}
                  >
                    All
                  </button>
                  <button
                    className={`btn ${favoriteFilter === true ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => {
                      setFavoriteFilter(true);
                      setCurrentPage(1);
                    }}
                  >
                    Favorite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Links Table */}
      <div className="card glass">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <LoadingSpinner size="lg" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-5">
              <Plus className="text-muted mb-3" size={64} />
              <h5 className="text-muted mb-3">No links found</h5>
              <p className="text-muted mb-3">
                {searchQuery || activeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first shareable link'
                }
              </p>
              {!searchQuery && activeFilter === 'all' && (
                <button
                  className="btn btn-primary"
                  onClick={() => setCreateLinkModalOpen(true)}
                >
                  <Plus className="me-2" size={16} />
                  Create Link
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Favorite</th>
                      <th>Link</th>
                      <th 
                        className="cursor-pointer user-select-none"
                        onClick={() => handleSort('customName')}
                      >
                        <div className="d-flex align-items-center">
                          Custom Name
                          {getSortIcon('customName')}
                        </div>
                      </th>
                      <th>File</th>
                      <th>Owner</th>
                      <th 
                        className="cursor-pointer user-select-none"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="d-flex align-items-center">
                          Created
                          {getSortIcon('createdAt')}
                        </div>
                      </th>
                      <th>Expiration</th>
                      <th>Access</th>
                      <th>Security</th>
                      <th>Download</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => (
                      <tr key={link._id}>
                        <td>
                          <button
                            className={`btn btn-sm ${link.favorite ? 'btn-warning' : 'btn-outline-secondary'}`}
                            onClick={() => handleToggleFavorite(link._id)}
                          >
                            <Star size={14} />
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleCopyLink(link.linkId)}
                          >
                            <Copy size={14} />
                          </button>
                        </td>
                        <td>
                          <div className="fw-semibold">{link.customName}</div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-semibold">{link.file.customFilename}</div>
                            <small className="text-muted">{link.file.originalFilename}</small>
                          </div>
                        </td>
                        <td>
                          <small>{link.createdBy.username}</small>
                        </td>
                        <td>
                          <small>{formatDate(link.createdAt)}</small>
                        </td>
                        <td>
                          {link.expiresAt ? (
                            <div>
                              <Calendar size={14} className="text-warning me-1" />
                              <small>{formatDate(link.expiresAt)}</small>
                            </div>
                          ) : (
                            <small className="text-muted">Never</small>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {getAccessScopeIcon(link.accessScope)}
                            <span className="ms-1">
                              {link.currentAccessCount}
                              {link.accessLimit && `/${link.accessLimit}`}
                            </span>
                          </div>
                        </td>
                        <td>
                          {getVerificationIcon(link.verificationType)}
                          {link.verificationType !== 'none' && (
                            <small className="ms-1">{link.verificationType}</small>
                          )}
                        </td>
                        <td>
                          {link.downloadAllowed ? (
                            <Download size={14} className="text-success" />
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${link.isActive ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => handleToggleActive(link._id)}
                          >
                            {link.isActive ? (
                              <ToggleRight size={14} />
                            ) : (
                              <ToggleLeft size={14} />
                            )}
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
                                  onClick={() => handleCopyLink(link.linkId)}
                                >
                                  <Copy className="me-2" size={14} />
                                  Copy Link
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={() => window.open(`/link/${link.linkId}`, '_blank')}
                                >
                                  <ExternalLink className="me-2" size={14} />
                                  Open Link
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  onClick={() => handleDeleteLink(link._id, link.customName)}
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

      {/* Create Link Modal */}
      <CreateLinkModal
        isOpen={createLinkModalOpen}
        onClose={() => setCreateLinkModalOpen(false)}
        onLinkCreated={() => {
          setCreateLinkModalOpen(false);
          loadLinks();
        }}
      />
    </div>
  );
};

export default Links;