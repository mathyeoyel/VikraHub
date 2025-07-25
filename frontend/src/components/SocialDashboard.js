// frontend/src/components/SocialDashboard.js
import React, { useState } from 'react';
import { useAuth } from './Auth/AuthContext';
import ActivityFeed from './ActivityFeed';
import FollowStats from './FollowStats';
import FollowNotifications from './FollowNotifications';
import SearchBar from './SearchBar';
import Messages from './Messages';
import './SocialDashboard.css';

const SocialDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');

  const tabs = [
    { id: 'feed', label: 'Activity Feed', icon: '📰' },
    { id: 'discover', label: 'Discover', icon: '🔍' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'followers', label: 'Network', icon: '👥' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <div className="tab-content">
            <ActivityFeed />
            <div className="sidebar-widgets">
              <FollowStats />
              <FollowNotifications />
            </div>
          </div>
        );
      case 'discover':
        return (
          <div className="tab-content">
            <div className="discover-section">
              <h3>Discover New People</h3>
              <SearchBar placeholder="Search for users to connect with..." />
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="tab-content">
            <Messages />
          </div>
        );
      case 'followers':
        return (
          <div className="tab-content">
            <div className="network-section">
              <FollowStats detailed={true} />
              <FollowNotifications />
            </div>
          </div>
        );
      default:
        return <ActivityFeed />;
    }
  };

  return (
    <div className="social-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h2>Welcome back, {user?.username || 'User'}! 👋</h2>
          <p>Stay connected with your network</p>
        </div>
      </div>

      <div className="dashboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>

      {/* Quick Actions Floating Button */}
      <div className="quick-actions">
        <button className="quick-action-btn" title="New Message">
          💬
        </button>
        <button className="quick-action-btn" title="Find People">
          👤+
        </button>
      </div>
    </div>
  );
};

export default SocialDashboard;
