import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  FileText, 
  Link as LinkIcon, 
  Users, 
  LogOut, 
  Shield, 
  Zap,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard/home', icon: Home, label: 'Home' },
    { to: '/dashboard/files', icon: FileText, label: 'Files' },
    { to: '/dashboard/links', icon: LinkIcon, label: 'Links' },
    ...(user?.role === 'superuser' ? [
      { to: '/dashboard/users', icon: Users, label: 'Users' }
    ] : [])
  ];

  return (
    <div className={`sidebar ${isOpen ? 'show' : ''}`}>
      {/* Header */}
      <div className="p-3 border-bottom" style={{ borderColor: 'var(--gs-glass-border)' }}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <Shield className="text-primary me-2" size={24} />
            <Zap className="text-warning me-2" size={18} />
            <span className="font-handcrafted text-gradient fw-bold">GuardShare</span>
          </div>
          <button
            className="btn btn-link text-muted d-lg-none p-1"
            onClick={onClose}
            style={{ border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow-1 p-3">
        <ul className="nav nav-pills flex-column">
          {navItems.map((item) => (
            <li key={item.to} className="nav-item mb-2">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center px-3 py-2 rounded-3 text-decoration-none transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'hover-bg-glass'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'white' : 'var(--gs-text-primary)'
                })}
                onClick={() => window.innerWidth < 992 && onClose()}
              >
                <item.icon className="me-3" size={18} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-top" style={{ borderColor: 'var(--gs-glass-border)' }}>
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
               style={{ width: '40px', height: '40px' }}>
            <span className="text-white fw-bold">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-grow-1">
            <div className="fw-semibold" style={{ color: 'var(--gs-text-primary)' }}>
              {user?.username}
            </div>
            <small style={{ color: 'var(--gs-text-muted)' }}>
              {user?.role}
            </small>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
        >
          <LogOut className="me-2" size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;