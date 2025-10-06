import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { 
  Users as UsersIcon, 
  Search, 
  Trash2, 
  MoreVertical,
  Shield,
  User,
  Activity,
  FileText,
  Link as LinkIcon,
  SortAsc,
  SortDesc
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'superuser';
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
  stats: {
    fileCount: number;
    linkCount: number;
    lastActivity: string;
  };
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchQuery, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      const response = await usersAPI.getUsers({
        page: currentPage,
        limit: 20,
        search: searchQuery,
        sortBy,
        sortOrder
      });
      
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.pages);
    } catch (error: any) {
      console.error('Error loading users:', error);
      if (error.status === 403) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
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

  const handleDeleteUser = async (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This will deactivate their account and all associated data.`)) {
      try {
        await usersAPI.deleteUser(userId);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'superuser') => {
    try {
      await usersAPI.updateRole(userId, newRole);
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
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
          <h2 className="text-gradient mb-1">Users</h2>
          <p className="text-muted mb-0">Manage user accounts and permissions</p>
        </div>
        <div className="d-flex align-items-center">
          <Shield className="text-warning me-2" size={20} />
          <span className="badge bg-warning">Superuser Only</span>
        </div>
      </div>

      {/* Search */}
      <div className="card glass mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search users by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-secondary" type="submit">
                <Search size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Users Table */}
      {accessDenied ? (
        <div className="card glass">
          <div className="card-body text-center py-5">
            <Shield className="text-danger mb-3" size={64} />
            <h5 className="text-danger mb-3">Access Denied</h5>
            <p className="text-muted">You do not have permission to view this page.</p>
          </div>
        </div>
      ) : (
        <div className="card glass">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <LoadingSpinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-5">
                <UsersIcon className="text-muted mb-3" size={64} />
                <h5 className="text-muted mb-3">No users found</h5>
                <p className="text-muted">
                  {searchQuery 
                    ? 'Try adjusting your search query'
                    : 'No users in the system'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto overflow-y-auto max-h-[500px] min-w-[900px]">
                  <table className="table-auto w-full">
                    <thead>
                      <tr>
                        <th 
                          className="cursor-pointer user-select-none"
                          onClick={() => handleSort('username')}
                        >
                          <div className="d-flex align-items-center">
                            Username
                            {getSortIcon('username')}
                          </div>
                        </th>
                        <th 
                          className="cursor-pointer user-select-none"
                          onClick={() => handleSort('email')}
                        >
                          <div className="d-flex align-items-center">
                            Email
                            {getSortIcon('email')}
                          </div>
                        </th>
                        <th>Role</th>
                        <th>Files</th>
                        <th>Links</th>
                        <th 
                          className="cursor-pointer user-select-none"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="d-flex align-items-center">
                            Joined
                            {getSortIcon('createdAt')}
                          </div>
                        </th>
                        <th 
                          className="cursor-pointer user-select-none"
                          onClick={() => handleSort('lastLogin')}
                        >
                          <div className="d-flex align-items-center">
                            Last Login
                            {getSortIcon('lastLogin')}
                          </div>
                        </th>
                        <th>Status</th>
                        <th className="w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                                   style={{ width: '32px', height: '32px' }}>
                                <span className="text-white fw-bold small">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="fw-semibold">{user.username}</div>
                            </div>
                          </td>
                          <td>
                            <small>{user.email}</small>
                          </td>
                          <td>
                            <div className="dropdown">
                              <button
                                className={`btn btn-sm dropdown-toggle ${
                                  user.role === 'superuser' ? 'btn-warning' : 'btn-outline-secondary'
                                }`}
                                data-bs-toggle="dropdown"
                              >
                                {user.role === 'superuser' ? (
                                  <Shield size={14} className="me-1" />
                                ) : (
                                  <User size={14} className="me-1" />
                                )}
                                {user.role}
                              </button>
                              <ul className="dropdown-menu glass">
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleUpdateRole(user._id, 'user')}
                                    disabled={user.role === 'user'}
                                  >
                                    <User className="me-2" size={14} />
                                    User
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleUpdateRole(user._id, 'superuser')}
                                    disabled={user.role === 'superuser'}
                                  >
                                    <Shield className="me-2" size={14} />
                                    Superuser
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FileText size={14} className="text-primary me-1" />
                              <span>{user.stats.fileCount}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <LinkIcon size={14} className="text-success me-1" />
                              <span>{user.stats.linkCount}</span>
                            </div>
                          </td>
                          <td>
                            <small>{formatDate(user.createdAt)}</small>
                          </td>
                          <td>
                            <small>{formatDate(user.lastLogin)}</small>
                          </td>
                          <td>
                            <span className={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
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
                                    onClick={() => {
                                      // TODO: Open user details modal
                                      console.log('View user details:', user._id);
                                    }}
                                  >
                                    <Activity className="me-2" size={14} />
                                    View Activity
                                  </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button
                                    className="dropdown-item text-danger"
                                    onClick={() => handleDeleteUser(user._id, user.username)}
                                  >
                                    <Trash2 className="me-2" size={14} />
                                    Delete User
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
      )}
    </div>
  );
};

export default Users;