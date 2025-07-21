import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './Auth/AuthContext';
import { userAPI, notificationAPI, blogAPI, portfolioAPI, assetAPI } from '../api';
import EditProfile from './EditProfile';
import AssetUpload from './Marketplace/AssetUpload';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    totalPurchases: 0,
    portfolioItems: 0,
    blogPosts: 0,
    uploadedAssets: 0
  });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [updateNotification, setUpdateNotification] = useState(null);
  
  // Refs for managing intervals and websockets
  const refreshIntervalRef = useRef(null);
  const websocketRef = useRef(null);
  const isActiveRef = useRef(true);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchDashboardData = useCallback(async (showLoader = false) => {
    if (!user || !isActiveRef.current) return;
    
    try {
      if (showLoader) setLoading(true);
      
      console.log('Fetching dashboard data for user:', user.username);
      
      const [profileRes, notificationsRes, blogRes, portfolioRes, assetsRes] = await Promise.all([
        userAPI.getMyProfile(),
        notificationAPI.getAll().catch(err => {
          console.warn('Failed to fetch notifications:', err);
          return { data: [] };
        }),
        blogAPI.getMyPosts().catch(err => {
          console.warn('Failed to fetch blog posts:', err);
          return { data: [] };
        }),
        portfolioAPI.getAll().catch(err => {
          console.warn('Failed to fetch portfolio:', err);
          return { data: [] };
        }),
        assetAPI.getMyAssets().catch(err => {
          console.warn('Failed to fetch assets:', err);
          return { data: [] };
        })
      ]);

      // Only update state if component is still active
      if (isActiveRef.current) {
        const profileData = profileRes.data;
        setProfile(profileData);
        
        // Enhanced debug logging
        console.log('Complete Profile data received:', {
          profileData,
          avatar: profileData?.avatar,
          avatar_small: profileData?.avatar_small,
          avatar_medium: profileData?.avatar_medium,
          avatar_large: profileData?.avatar_large,
          user: profileData?.user,
          first_name: profileData?.first_name,
          last_name: profileData?.last_name,
          email: profileData?.email
        });
        
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
          })) || [],
          ...assetsRes.data?.slice(0, 3).map(asset => ({
            type: 'asset',
            title: `Uploaded asset: ${asset.title}`,
            date: asset.created_at,
            icon: '🎨'
          })) || []
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5));

        setStats({
          totalProjects: 0,
          completedProjects: 0,
          totalEarnings: 0,
          totalPurchases: 0,
          portfolioItems: portfolioRes.data?.length || 0,
          blogPosts: blogRes.data?.length || 0,
          uploadedAssets: assetsRes.data?.length || 0
        });

        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Show user-friendly error message for network issues
      if (!navigator.onLine) {
        console.warn('User is offline, will retry when back online');
      } else if (error.response?.status === 401) {
        console.warn('User authentication expired, please login again');
      } else if (error.response?.status >= 500) {
        console.warn('Server error, will retry automatically');
      }
    } finally {
      if (showLoader && isActiveRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  // Setup WebSocket connection for real-time updates
  const setupWebSocket = useCallback(() => {
    if (!user || websocketRef.current) return;

    try {
      // Replace with your actual WebSocket URL
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/profile/';
      const ws = new WebSocket(`${wsUrl}${user.id}/`);
      
      ws.onopen = () => {
        console.log('WebSocket connected for real-time profile updates');
        websocketRef.current = ws;
      };

      ws.onmessage = (event) => {
        if (!isActiveRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          console.log('Received real-time update:', data);

          switch (data.type) {
            case 'profile_updated':
              setProfile(prev => ({ ...prev, ...data.profile }));
              showUpdateNotification('Profile updated');
              break;
            case 'new_notification':
              setNotifications(prev => [data.notification, ...prev.slice(0, 4)]);
              showUpdateNotification('New notification received');
              break;
            case 'portfolio_updated':
              fetchDashboardData(false); // Refresh all data
              showUpdateNotification('Portfolio updated');
              break;
            case 'asset_uploaded':
              fetchDashboardData(false); // Refresh all data
              showUpdateNotification('New asset uploaded');
              break;
            case 'stats_updated':
              setStats(prev => ({ ...prev, ...data.stats }));
              showUpdateNotification('Stats updated');
              break;
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
          
          setLastUpdated(new Date());
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        websocketRef.current = null;
        
        // Attempt to reconnect after 5 seconds if component is still active
        if (isActiveRef.current) {
          setTimeout(setupWebSocket, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  }, [user, fetchDashboardData]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Refresh data when coming back online
      fetchDashboardData(false);
      setupWebSocket();
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Close WebSocket when offline
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchDashboardData, setupWebSocket]);

  // Periodic refresh function
  const startPeriodicRefresh = useCallback(() => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval for periodic refresh (every 30 seconds)
    refreshIntervalRef.current = setInterval(() => {
      if (isActiveRef.current && navigator.onLine) {
        fetchDashboardData(false);
      }
    }, 30000); // 30 seconds
  }, [fetchDashboardData]);

  // Handle page visibility changes (pause updates when tab is not active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      
      if (document.hidden) {
        // Pause real-time updates when tab is not visible
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      } else {
        // Resume updates when tab becomes visible
        fetchDashboardData(false);
        startPeriodicRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchDashboardData, startPeriodicRefresh]);

  // Handle visibility changes
  useEffect(() => {
    if (user) {
      fetchDashboardData(true);
      setupWebSocket();
      startPeriodicRefresh();
    }

    // Cleanup function
    return () => {
      isActiveRef.current = false;
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [user, fetchDashboardData, setupWebSocket, startPeriodicRefresh]);

  // Set initial tab based on route
  useEffect(() => {
    if (location.pathname === '/upload-asset') {
      setActiveTab('upload');
    } else if (location.pathname === '/dashboard') {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    const fields = ['bio', 'skills', 'website', 'avatar'];
    const completedFields = fields.filter(field => profile[field] && profile[field].trim() !== '');
    return Math.round((completedFields.length / fields.length) * 100);
  };

  const handleProfileUpdate = (updatedProfile) => {
    console.log('Profile updated:', updatedProfile);
    setProfile(updatedProfile);
    // Also refresh to get any server-side processed data
    setTimeout(() => {
      refreshProfileData();
    }, 1000);
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

  const handleAssetCreated = () => {
    // Refresh dashboard data when new asset is uploaded
    fetchDashboardData(false);
    // Switch back to overview tab
    setActiveTab('overview');
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    fetchDashboardData(true);
  };

  // Profile-specific refresh function
  const refreshProfileData = async () => {
    if (!user) return;
    
    try {
      console.log('Refreshing profile data specifically...');
      const profileRes = await userAPI.getMyProfile();
      setProfile(profileRes.data);
      console.log('Profile refreshed:', profileRes.data);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  // Show temporary notification for updates
  const showUpdateNotification = (message) => {
    setUpdateNotification(message);
    setTimeout(() => setUpdateNotification(null), 3000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'upload', label: 'Upload Asset', icon: '📤' },
    { id: 'profile', label: 'Edit Profile', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  if (loading) {
    return (
      <div className="user-profile">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="container">
        {/* Update Notification */}
        {updateNotification && (
          <div className="update-notification">
            <span className="notification-icon">✨</span>
            {updateNotification}
          </div>
        )}

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-info">
            <div className="avatar-container">
              {(profile?.avatar || profile?.avatar_medium || profile?.avatar_small) ? (
                <img 
                  src={profile?.avatar_medium || profile?.avatar || profile?.avatar_small} 
                  alt={user?.username || profile?.first_name || 'User'} 
                  className="profile-avatar"
                  onError={(e) => {
                    console.log('Primary avatar failed to load, trying fallback...');
                    const fallbacks = [
                      profile?.avatar_small,
                      profile?.avatar_large,
                      profile?.avatar
                    ].filter(Boolean);
                    
                    if (fallbacks.length > 0 && e.target.src !== fallbacks[0]) {
                      e.target.src = fallbacks[0];
                    } else {
                      console.log('All avatar sources failed, showing default avatar');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                  onLoad={() => {
                    console.log('Avatar loaded successfully:', profile?.avatar_medium || profile?.avatar || profile?.avatar_small);
                  }}
                />
              ) : null}
              <div 
                className="default-avatar"
                style={{ 
                  display: (profile?.avatar || profile?.avatar_medium || profile?.avatar_small) ? 'none' : 'flex' 
                }}
              >
                {profile?.first_name?.[0] || user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </div>
            </div>
            <div className="user-details">
              <h1>
                {(profile?.first_name && profile?.last_name) ? 
                  `${profile.first_name} ${profile.last_name}` :
                  (user?.first_name && user?.last_name) ? 
                    `${user.first_name} ${user.last_name}` : 
                    (profile?.first_name || user?.first_name) ?
                      (profile?.first_name || user?.first_name) :
                      user?.username}
              </h1>
              <p className="user-email">{profile?.email || user?.email}</p>
              <div className="user-stats">
                <span className="stat-item">
                  <strong>{stats.portfolioItems}</strong> Portfolio Items
                </span>
                <span className="stat-item">
                  <strong>{stats.blogPosts}</strong> Blog Posts
                </span>
                <span className="stat-item">
                  <strong>{stats.uploadedAssets}</strong> Uploaded Assets
                </span>
              </div>
            </div>
          </div>
          <div className="welcome-message">
            <h2>{getWelcomeMessage()}</h2>
            <p>Manage your profile, upload assets, and track your activity</p>
            
            {/* Real-time status indicator */}
            <div className="status-bar">
              <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                {isOnline ? 'Connected' : 'Offline'}
              </div>
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <button 
                className="refresh-btn"
                onClick={handleManualRefresh}
                disabled={loading}
                title="Refresh data"
              >
                {loading ? '↻' : '🔄'}
              </button>
              <button 
                className="profile-refresh-btn"
                onClick={refreshProfileData}
                title="Refresh profile data"
                style={{
                  marginLeft: '0.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  opacity: 0.7
                }}
              >
                👤
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
              {tab.id === 'notifications' && notifications.filter(n => !n.is_read).length > 0 && (
                <span className="notification-badge">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Quick Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🎨</div>
                  <div className="stat-info">
                    <h3>{stats.portfolioItems}</h3>
                    <p>Portfolio Items</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-info">
                    <h3>{stats.blogPosts}</h3>
                    <p>Blog Posts</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏪</div>
                  <div className="stat-info">
                    <h3>{stats.uploadedAssets}</h3>
                    <p>Uploaded Assets</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <h3>${stats.totalEarnings}</h3>
                    <p>Total Earnings</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-info">
                    <h3>{getProfileCompletionPercentage()}%</h3>
                    <p>Profile Complete</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <h3>Recent Activity</h3>
                {recentActivity.length > 0 ? (
                  <div className="activity-list">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <span className="activity-icon">{activity.icon}</span>
                        <div className="activity-details">
                          <p>{activity.title}</p>
                          <span className="activity-date">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-activity">No recent activity</p>
                )}
              </div>

              {/* Profile Completion */}
              {getProfileCompletionPercentage() < 100 && (
                <div className="profile-completion">
                  <h3>Complete Your Profile</h3>
                  <div className="completion-bar">
                    <div 
                      className="completion-fill" 
                      style={{ width: `${getProfileCompletionPercentage()}%` }}
                    ></div>
                  </div>
                  <p>{getProfileCompletionPercentage()}% complete</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('profile')}
                  >
                    Complete Profile
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="upload-tab">
              <h3>Upload New Asset</h3>
              <AssetUpload onAssetCreated={handleAssetCreated} />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-tab">
              <h3>Edit Profile</h3>
              <EditProfile 
                profile={profile} 
                onProfileUpdate={handleProfileUpdate}
              />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="notifications-tab">
              <h3>Notifications</h3>
              {notifications.length > 0 ? (
                <div className="notifications-list">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-date">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {!notification.is_read && <div className="unread-indicator"></div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-notifications">No notifications</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
