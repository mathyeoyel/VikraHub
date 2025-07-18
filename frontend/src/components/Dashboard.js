import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { userAPI, notificationAPI, blogAPI, portfolioAPI } from '../api';
import EditProfile from './EditProfile';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    totalPurchases: 0,
    portfolioItems: 0,
    blogPosts: 0
  });
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, notificationsRes, blogRes, portfolioRes] = await Promise.all([
        userAPI.getMyProfile(),
        notificationAPI.getAll(),
        blogAPI.getMyPosts(),
        portfolioAPI.getAll()
      ]);

      setProfile(profileRes.data);
      setNotifications(notificationsRes.data?.slice(0, 5) || []);
      setRecentActivity([
        ...blogRes.data?.slice(0, 3).map(post => ({
          type: 'blog',
          title: `Published: ${post.title}`,
          date: post.created_at,
          icon: '📝'
        })) || [],
        ...portfolioRes.data?.slice(0, 3).map(item => ({
          type: 'portfolio',
          title: `Added to portfolio: ${item.title}`,
          date: item.created_at,
          icon: '🎨'
        })) || []
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5));

      setStats({
        totalProjects: 0, // Will be updated when project endpoints are available
        completedProjects: 0,
        totalEarnings: 0,
        totalPurchases: 0,
        portfolioItems: portfolioRes.data?.length || 0,
        blogPosts: blogRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    const fields = ['bio', 'skills', 'website', 'avatar'];
    const completedFields = fields.filter(field => profile[field] && profile[field].trim() !== '');
    return Math.round((completedFields.length / fields.length) * 100);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    // Optionally refresh dashboard data
    fetchDashboardData();
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
    else if (hour >= 18) greeting = 'Good evening';
    
    return `${greeting}, ${user?.first_name || user?.username}!`;
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="container-fluid">
        {/* Welcome Message */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">{getWelcomeMessage()}</h1>
            <p className="welcome-subtitle">
              {profile?.user_type === 'freelancer' ? 'Ready to take on new projects?' : 
               profile?.user_type === 'client' ? 'Find the perfect freelancer for your next project' : 
               'Explore our creative marketplace'}
            </p>
          </div>
          <div className="welcome-avatar">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Profile" className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">
                {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Profile Summary */}
          <div className="dashboard-card profile-summary">
            <div className="card-header">
              <h3>Profile Summary</h3>
              <div>
                <button className="btn-edit" onClick={() => setShowEditProfile(true)}>
                  Edit Profile
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="profile-completion">
                <div className="completion-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="10" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#4CAF50" 
                      strokeWidth="10"
                      strokeDasharray={`${getProfileCompletionPercentage() * 2.83} 283`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="completion-text">
                    <span className="percentage">{getProfileCompletionPercentage()}%</span>
                    <span className="label">Complete</span>
                  </div>
                </div>
                <div className="completion-details">
                  <h4>Profile Completion</h4>
                  <p>Complete your profile to get better opportunities!</p>
                  {getProfileCompletionPercentage() < 100 && (
                    <ul className="completion-tips">
                      {!profile?.bio && <li>Add a bio</li>}
                      {!profile?.skills && <li>Add your skills</li>}
                      {!profile?.website && <li>Add your website</li>}
                      {!profile?.avatar && <li>Upload a profile picture</li>}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics/Analytics */}
          <div className="dashboard-card statistics">
            <div className="card-header">
              <h3>Your Statistics</h3>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-icon">💼</div>
                  <div className="stat-details">
                    <span className="stat-number">{stats.totalProjects}</span>
                    <span className="stat-label">Total Projects</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">✅</div>
                  <div className="stat-details">
                    <span className="stat-number">{stats.completedProjects}</span>
                    <span className="stat-label">Completed</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">🎨</div>
                  <div className="stat-details">
                    <span className="stat-number">{stats.portfolioItems}</span>
                    <span className="stat-label">Portfolio Items</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">📝</div>
                  <div className="stat-details">
                    <span className="stat-number">{stats.blogPosts}</span>
                    <span className="stat-label">Blog Posts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications & Alerts */}
          <div className="dashboard-card notifications">
            <div className="card-header">
              <h3>Notifications</h3>
              <span className="notification-count">
                {notifications.filter(n => !n.is_read).length} new
              </span>
            </div>
            <div className="card-content">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                      onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                    >
                      <div className="notification-content">
                        <p>{notification.message}</p>
                        <span className="notification-time">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {!notification.is_read && <div className="unread-dot"></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card recent-activity">
            <div className="card-header">
              <h3>Recent Activity</h3>
            </div>
            <div className="card-content">
              {recentActivity.length === 0 ? (
                <div className="empty-state">
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">{activity.icon}</div>
                      <div className="activity-content">
                        <p>{activity.title}</p>
                        <span className="activity-time">
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card quick-actions">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="card-content">
              <div className="actions-grid">
                {profile?.user_type === 'freelancer' && (
                  <>
                    <button className="action-btn" onClick={() => window.location.href = '/projects'}>
                      <span className="action-icon">🔍</span>
                      <span>Browse Projects</span>
                    </button>
                    <button className="action-btn" onClick={() => window.location.href = '/portfolio/new'}>
                      <span className="action-icon">➕</span>
                      <span>Add Portfolio</span>
                    </button>
                  </>
                )}
                {profile?.user_type === 'client' && (
                  <>
                    <button className="action-btn" onClick={() => window.location.href = '/post-project'}>
                      <span className="action-icon">📋</span>
                      <span>Post Project</span>
                    </button>
                    <button className="action-btn" onClick={() => window.location.href = '/freelancers'}>
                      <span className="action-icon">👥</span>
                      <span>Find Freelancers</span>
                    </button>
                  </>
                )}
                <button className="action-btn" onClick={() => window.location.href = '/marketplace'}>
                  <span className="action-icon">🛍️</span>
                  <span>Marketplace</span>
                </button>
                <button className="action-btn" onClick={() => window.location.href = '/blog/new'}>
                  <span className="action-icon">✏️</span>
                  <span>Write Blog</span>
                </button>
              </div>
            </div>
          </div>

          {/* Messages/Inbox Preview */}
          <div className="dashboard-card messages">
            <div className="card-header">
              <h3>Messages</h3>
              <button className="btn-view-all" onClick={() => window.location.href = '/messages'}>
                View All
              </button>
            </div>
            <div className="card-content">
              <div className="empty-state">
                <p>No messages yet</p>
                <small>Start a conversation with other users</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile
          onClose={() => setShowEditProfile(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default Dashboard;
