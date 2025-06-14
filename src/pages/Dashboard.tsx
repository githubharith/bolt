import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import Home from '../components/dashboard/Home';
import Files from '../components/dashboard/Files';
import Links from '../components/dashboard/Links';
import Users from '../components/dashboard/Users';
import ProfileModal from '../components/dashboard/ProfileModal';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openProfileModal = () => {
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Sidebar overlay for mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={closeSidebar}
      />

      {/* Main content area */}
      <div className="main-content">
        {/* Top bar */}
        <TopBar 
          onToggleSidebar={toggleSidebar}
          onOpenProfile={openProfileModal}
        />

        {/* Page content */}
        <div className="container-fluid py-4 flex-grow-1">
          <Routes>
            <Route path="/" element={<Navigate to="home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="files" element={<Files />} />
            <Route path="links" element={<Links />} />
            {user?.role === 'superuser' && (
              <Route path="users" element={<Users />} />
            )}
            <Route path="*" element={<Navigate to="home" replace />} />
          </Routes>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen}
        onClose={closeProfileModal}
      />
    </div>
  );
};

export default Dashboard;