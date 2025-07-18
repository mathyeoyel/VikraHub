import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { api } from '../../api';
import AdminUserManagement from './AdminUserManagement';
import AdminAssetManagement from './AdminAssetManagement';
import AdminProjectManagement from './AdminProjectManagement';
import AdminAnalytics from './AdminAnalytics';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, [isAuthenticated, user]);

  const checkAdminAccess = async () => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to access this page');
      setIsLoading(false);
      return;
    }

    if (!user.is_staff && !user.is_superuser) {
      setError('You do not have permission to access the admin dashboard');
      setIsLoading(false);
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'assets', label: 'Assets', icon: '🎨' },
    { id: 'projects', label: 'Projects', icon: '📋' },
  ];

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="admin-error">
        <div className="admin-error-content">
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button onClick={() => window.history.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AdminAnalytics />;
      case 'users':
        return <AdminUserManagement />;
      case 'assets':
        return <AdminAssetManagement />;
      case 'projects':
        return <AdminProjectManagement />;
      default:
        return <AdminAnalytics />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>VikraHub Admin Dashboard</h1>
        <div className="admin-user-info">
          <span>Welcome, {user.username}</span>
          <div className="admin-badge">
            {user.is_superuser ? 'Super Admin' : 'Admin'}
          </div>
        </div>
      </div>

      <div className="admin-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="admin-tab-icon">{tab.icon}</span>
            <span className="admin-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
