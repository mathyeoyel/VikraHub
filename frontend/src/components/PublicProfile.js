import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicProfileAPI, assetAPI, userAPI, followAPI } from '../api';
import { useAuth } from './Auth/AuthContext';
import notificationService from '../services/notificationService';
import PublicClientProfile from './PublicClientProfile';
import ErrorBoundary from './ErrorBoundary';
import { handleImageError, createPortfolioImageUrl } from '../utils/portfolioImageUtils';
import './PublicProfile.css';

const PublicProfile = () => {
  const { username } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followStatsLoading, setFollowStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('works');

  // Tab switching function
  const handleTabSwitch = (tabName) => {
    setActiveTab(tabName);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await publicProfileAPI.getByUsername(username);
        setProfile(response.data);
        
        // Check if the profile response already contains follow information
        if (response.data.followers_count !== undefined && 
            response.data.following_count !== undefined && 
            response.data.is_following !== undefined) {
          // Use follow data from profile response
          setFollowerCount(response.data.followers_count || 0);
          setFollowingCount(response.data.following_count || 0);
          setIsFollowing(response.data.is_following || false);
          console.log('Using follow data from profile response:', {
            followers: response.data.followers_count,
            following: response.data.following_count,
            isFollowing: response.data.is_following
          });
        } else {
          // Fallback to separate follow stats API call
          console.log('Follow data not in profile response, fetching separately...');
          await fetchFollowStats(username);
        }
        
        // Fetch user's uploaded assets to include in portfolio
        console.log('👤 Profile data:', {
          username: response.data.user?.username,
          userId: response.data.user?.id,
          userType: response.data.user_type,
          profileId: response.data.id
        });
        
        if (response.data.user?.id) {
          await fetchUserAssets(response.data.user.id);
        } else {
          console.warn('⚠️ No user ID found in profile response');
          setAssets([]);
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Profile not found');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserAssets = async (userId) => {
      try {
        setAssetsLoading(true);
        console.log(`🔍 Fetching assets for user ID: ${userId} (${typeof userId})`);
        
        // Convert userId to number if it's a string, since API might expect number
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        console.log(`📊 Converted user ID: ${numericUserId} (${typeof numericUserId})`);
        
        // Always fetch all assets and filter client-side for now to ensure proper filtering
        const response = await assetAPI.getAll();
        console.log(`📥 Raw API response:`, response);
        
        // Extract assets from response
        const allAssets = response.results || response.data || response || [];
        console.log(`📋 Total assets received: ${allAssets.length}`);
        
        // Debug: Log first few assets to see structure
        if (allAssets.length > 0) {
          console.log(`🔬 Sample asset structure:`, allAssets[0]);
        }
        
        // Filter assets to only show those created by this specific user
        const userAssets = allAssets.filter(asset => {
          // Check multiple possible patterns for user identification
          const isUserAsset = 
            (asset.seller && asset.seller.id === numericUserId) || 
            (asset.seller && asset.seller.id === userId) ||
            (asset.user && asset.user.id === numericUserId) ||
            (asset.user && asset.user.id === userId) ||
            (asset.seller_id === numericUserId) ||
            (asset.seller_id === userId) ||
            (asset.user_id === numericUserId) ||
            (asset.user_id === userId) ||
            (asset.created_by && asset.created_by.id === numericUserId) ||
            (asset.created_by && asset.created_by.id === userId);
          
          if (isUserAsset) {
            console.log(`✅ Asset belongs to user ${userId}:`, {
              assetId: asset.id,
              title: asset.title,
              seller: asset.seller,
              user: asset.user,
              seller_id: asset.seller_id,
              user_id: asset.user_id,
              created_by: asset.created_by
            });
          }
          
          return isUserAsset;
        });
        
        console.log(`🎯 Filtered ${userAssets.length} assets for user ${userId} out of ${allAssets.length} total assets`);
        
        if (userAssets.length === 0 && allAssets.length > 0) {
          console.warn(`⚠️ No assets found for user ${userId}. Check if user ID matches asset ownership fields.`);
          // Debug: Show how assets are structured
          allAssets.slice(0, 3).forEach((asset, index) => {
            console.log(`🔍 Asset ${index + 1} ownership info:`, {
              id: asset.id,
              title: asset.title,
              seller: asset.seller,
              user: asset.user,
              seller_id: asset.seller_id,
              user_id: asset.user_id,
              created_by: asset.created_by
            });
          });
        }
        
        setAssets(userAssets);
      } catch (err) {
        console.error('❌ Failed to fetch user assets:', err);
        setAssets([]);
      } finally {
        setAssetsLoading(false);
      }
    };

    const fetchFollowStats = async (username) => {
      try {
        setFollowStatsLoading(true);
        const response = await userAPI.getFollowStats(username);
        setFollowerCount(response.data?.followers_count || 0);
        setFollowingCount(response.data?.following_count || 0);
        setIsFollowing(response.data?.is_following || false);
      } catch (err) {
        console.warn('Failed to fetch follow stats:', err);
        // Set to 0 instead of random numbers when API fails
        setFollowerCount(0);
        setFollowingCount(0);
        setIsFollowing(false);
      } finally {
        setFollowStatsLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'freelancer':
        return 'fas fa-briefcase';
      case 'creator':
        return 'fas fa-shopping-bag';
      case 'client':
        return 'fas fa-user';
      default:
        return 'fas fa-user';
    }
  };

  const getUserTypeLabel = (userType) => {
    return userType.charAt(0).toUpperCase() + userType.slice(1);
  };

  const getSocialIcon = (platform) => {
    const icons = {
      facebook: 'fab fa-facebook',
      instagram: 'fab fa-instagram',
      twitter: 'fab fa-twitter',
      linkedin: 'fab fa-linkedin',
      github: 'fab fa-github'
    };
    return icons[platform] || 'fas fa-link';
  };

  const handleContact = () => {
    // TODO: Implement contact/message functionality
    alert('Contact functionality will be implemented soon!');
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      alert('Please log in to follow users.');
      return;
    }

    if (!username) {
      console.error('No username provided for follow action');
      return;
    }

    // Don't allow users to follow themselves
    if (user && user.username === username) {
      alert("You can't follow yourself!");
      return;
    }

    try {
      console.log(`Attempting to ${isFollowing ? 'unfollow' : 'follow'} user: ${username}`);
      
      if (isFollowing) {
        // Use enhanced unfollow with profile refresh
        const { unfollowResult, updatedProfile } = await followAPI.unfollowWithRefresh(profile.user.id, username);
        console.log('Unfollow response:', unfollowResult);
        
        // Update state from refreshed profile data if available
        if (updatedProfile) {
          setIsFollowing(updatedProfile.is_following || false);
          setFollowerCount(updatedProfile.followers_count || 0);
          setFollowingCount(updatedProfile.following_count || 0);
        } else {
          // Fallback to manual state update
          setIsFollowing(false);
          setFollowerCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Use enhanced follow with profile refresh
        const { followResult, updatedProfile } = await followAPI.followWithRefresh(profile.user.id, username);
        console.log('Follow response:', followResult);
        
        // Update state from refreshed profile data if available
        if (updatedProfile) {
          setIsFollowing(updatedProfile.is_following || false);
          setFollowerCount(updatedProfile.followers_count || 0);
          setFollowingCount(updatedProfile.following_count || 0);
        } else {
          // Fallback to manual state update
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
        }
        
        // Send notification to the followed user
        notificationService.followNotification(
          profile.full_name || username,
          user.first_name && user.last_name ? 
            `${user.first_name} ${user.last_name}` : 
            user.username || 'Someone'
        );
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show a user-friendly error message
      alert(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`);
    }
  };

  const handleMessage = async () => {
    if (!isAuthenticated) {
      alert('Please log in to send messages.');
      return;
    }
    
    try {
      // First, try to find if there's an existing conversation
      console.log(`🔍 Looking for existing conversation with ${username}`);
      
      // Navigate to messages page and let it handle finding or creating conversation
      navigate('/messages', { 
        state: { 
          recipientUsername: username,
          autoCreateConversation: true, // Flag to auto-create if not found
          recipientName: profile.full_name || username
        } 
      });
    } catch (error) {
      console.error('❌ Error handling message action:', error);
      alert('Failed to open messages. Please try again.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.full_name} - VikraHub Profile`,
        text: `Check out ${profile.full_name}'s profile on VikraHub!`,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="public-profile">
        <div className="container">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-profile">
        <div className="container">
          <div className="profile-error">
            <h2>Profile Not Found</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // If the user is a client, use the dedicated PublicClientProfile component
  if (profile && profile.user_type === 'client') {
    return (
      <PublicClientProfile 
        profile={profile} 
        username={username}
        isFollowing={isFollowing}
        setIsFollowing={setIsFollowing}
        followerCount={followerCount}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="public-profile">
        <div className="container">
        {/* Cover Photo Section */}
        <div className="profile-cover">
          <div className="cover-image">
            {profile.cover_photo ? (
              <img src={profile.cover_photo} alt="Cover" className="cover-img" />
            ) : (
              <div className="cover-placeholder">
                <div className="cover-gradient"></div>
              </div>
            )}
          </div>
          
          {/* Profile Header with Avatar */}
          <div className="profile-header">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.full_name} />
                ) : (
                  <div className="avatar-placeholder">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="profile-actions">
                {isAuthenticated && user?.username !== username && (
                  <button className="action-btn follow-btn" onClick={handleFollow}>
                    {isFollowing ? (
                      <>
                        <span className="btn-icon">✓</span>
                        Following
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">+</span>
                        Follow
                      </>
                    )}
                  </button>
                )}
                {isAuthenticated && user?.username !== username && (
                  <button 
                    className="action-btn message-btn"
                    onClick={handleMessage}
                    title={`Send a message to ${profile.full_name || username}`}
                  >
                    <span className="btn-icon"><i className="fas fa-comment icon"></i></span>
                    Message
                  </button>
                )}
                <button className="action-btn share-btn" onClick={handleShare}>
                  <span className="btn-icon"><i className="fas fa-share icon"></i></span>
                  Share
                </button>
              </div>
            </div>
            
            <div className="profile-info">
              <h1 className="profile-name">
                {typeof profile.full_name === 'string' ? profile.full_name : 
                 typeof profile.full_name === 'object' && profile.full_name ? (profile.full_name.name || 'Unknown User') : 
                 'Unknown User'}
              </h1>
              <p className="username">@{profile.user?.username || 'unknown'}</p>
              
              {/* Headline/Tagline */}
              {profile.headline && (
                <p className="profile-headline">
                  {typeof profile.headline === 'string' ? profile.headline : 
                   typeof profile.headline === 'object' && profile.headline ? (profile.headline.name || 'Professional') : 
                   'Professional'}
                </p>
              )}
              
              <div className="profile-meta">
                <div className="user-type">
                  <span className="user-type-icon"><i className={`${getUserTypeIcon(profile.user_type)} icon`}></i></span>
                  <span className="user-type-label">{getUserTypeLabel(profile.user_type)}</span>
                </div>
                <p className="member-since">
                  Member since {formatDate(profile.member_since)}
                </p>
              </div>
              
              {/* Stats Row */}
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">
                    {followStatsLoading ? '...' : followerCount}
                  </span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {followStatsLoading ? '...' : followingCount}
                  </span>
                  <span className="stat-label">Following</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{assets.length}</span>
                  <span className="stat-label">Projects</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        {(profile.facebook?.trim() || profile.instagram?.trim() || profile.twitter?.trim() || 
          profile.linkedin?.trim() || profile.github?.trim() || profile.website?.trim()) && (
          <div className="profile-section social-links">
            <h3>Connect With Me</h3>
            <div className="social-buttons">
              {profile.website?.trim() && (
                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                   target="_blank" rel="noopener noreferrer" className="social-link">
                  🌐 Website
                </a>
              )}
              {profile.linkedin?.trim() && (
                <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`} 
                   target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className={`${getSocialIcon('linkedin')} icon`}></i> LinkedIn
                </a>
              )}
              {profile.github?.trim() && (
                <a href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`} 
                   target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className={`${getSocialIcon('github')} icon`}></i> GitHub
                </a>
              )}
              {profile.twitter?.trim() && (
                <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter}`} 
                   target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className={`${getSocialIcon('twitter')} icon`}></i> Twitter
                </a>
              )}
              {profile.instagram?.trim() && (
                <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram}`} 
                   target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className={`${getSocialIcon('instagram')} icon`}></i> Instagram
                </a>
              )}
              {profile.facebook?.trim() && (
                <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} 
                   target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className={`${getSocialIcon('facebook')} icon`}></i> Facebook
                </a>
              )}
            </div>
          </div>
        )}

        <div className="profile-content">
          {/* Navigation Tabs */}
          <div className="profile-tabs">
            <div 
              className={`tab-item ${activeTab === 'works' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('works')}
            >
              Works
            </div>
            <div 
              className={`tab-item ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('about')}
            >
              About
            </div>
            <div 
              className={`tab-item ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('skills')}
            >
              Skills
            </div>
            <div 
              className={`tab-item ${activeTab === 'recognition' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('recognition')}
            >
              Recognition
            </div>
          </div>

          {/* Works Section */}
          <div 
            className={`profile-section works-section ${activeTab === 'works' ? 'active' : ''}`} 
            id="works-section"
            style={{ display: activeTab === 'works' ? 'block' : 'none' }}
          >
            <h3>
              {profile.user_type === 'client' ? 'Past Projects' : 'Portfolio & Work'}
            </h3>
            <div className="works-container works-scrollable">
              {assetsLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading {profile.user_type === 'client' ? 'projects' : 'portfolio'}...</p>
                </div>
              ) : (
                <>
                  {/* Featured Work Section */}
                  {(profile.portfolio_items?.length > 0 || assets.length > 0) && (
                    <div className="featured-work-section">
                      <h4 className="featured-work-title">
                        ✨ {profile.user_type === 'client' ? 'Featured Projects' : 'Featured Work'}
                      </h4>
                      <div className="featured-work-grid">
                        {/* Show first portfolio item if exists */}
                        {profile.portfolio_items?.[0] && (
                          <div className="featured-work-item">
                            {profile.portfolio_items[0].image && (
                              <div className="featured-work-image">
                                <img 
                                  src={createPortfolioImageUrl(profile.portfolio_items[0].image)} 
                                  alt={profile.portfolio_items[0].title}
                                  onError={handleImageError}
                                  data-original-src={profile.portfolio_items[0].image}
                                />
                                <div className="featured-work-overlay">
                                  <span className="featured-badge">Featured</span>
                                </div>
                              </div>
                            )}
                            <div className="featured-work-content">
                              <h5>
                                {typeof profile.portfolio_items[0].title === 'string' ? profile.portfolio_items[0].title : 
                                 typeof profile.portfolio_items[0].title === 'object' && profile.portfolio_items[0].title ? (profile.portfolio_items[0].title.name || 'Featured Work') : 
                                 'Featured Work'}
                              </h5>
                              <p>
                                {typeof profile.portfolio_items[0].description === 'string' ? profile.portfolio_items[0].description : 
                                 typeof profile.portfolio_items[0].description === 'object' && profile.portfolio_items[0].description ? (profile.portfolio_items[0].description.name || 'Description available') : 
                                 'Description available'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Show first asset if exists and no portfolio item */}
                        {!profile.portfolio_items?.[0] && assets[0] && (
                          <div className="featured-work-item">
                            <div className="featured-work-image">
                              {assets[0].preview_image ? (
                                <img src={assets[0].preview_image} alt={assets[0].title} />
                              ) : (
                                <div className="asset-placeholder">
                                  <i className="fas fa-cube"></i>
                                </div>
                              )}
                              <div className="featured-work-overlay">
                                <span className="featured-badge">Latest</span>
                              </div>
                            </div>
                            <div className="featured-work-content">
                              <h5>
                                {typeof assets[0].title === 'string' ? assets[0].title : 
                                 typeof assets[0].title === 'object' && assets[0].title ? (assets[0].title.name || 'Latest Asset') : 
                                 'Latest Asset'}
                              </h5>
                              <p>
                                {typeof assets[0].description === 'string' ? assets[0].description : 
                                 typeof assets[0].description === 'object' && assets[0].description ? (assets[0].description.name || 'Asset description') : 
                                 'Asset description'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manual Portfolio Items */}
                  {profile.portfolio_items && profile.portfolio_items.length > 0 && (
                    <div className="portfolio-subsection">
                      <h4 className="portfolio-subsection-title">
                        {profile.user_type === 'client' ? 'Project History' : 'Projects'}
                      </h4>
                      <div className="portfolio-grid">
                        {profile.portfolio_items.map((item) => (
                          <div key={`portfolio-${item.id}`} className="portfolio-item">
                            {item.image && (
                              <div className="portfolio-image">
                                <img 
                                  src={createPortfolioImageUrl(item.image)} 
                                  alt={item.title}
                                  onError={handleImageError}
                                  data-original-src={item.image}
                                />
                              </div>
                            )}
                            <div className="portfolio-content">
                              <h4>
                                {typeof item.title === 'string' ? item.title : 
                                 typeof item.title === 'object' && item.title ? (item.title.name || 'Project') : 
                                 'Project'}
                              </h4>
                              <p>
                                {typeof item.description === 'string' ? item.description : 
                                 typeof item.description === 'object' && item.description ? (item.description.name || 'Project description') : 
                                 'Project description'}
                              </p>
                              {item.tags_list && item.tags_list.length > 0 && (
                                <div className="portfolio-tags">
                                  {item.tags_list.map((tag, index) => (
                                    <span key={index} className="portfolio-tag">
                                      {typeof tag === 'string' ? tag : (tag?.name || tag?.title || String(tag))}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.url && (
                                <a 
                                  href={item.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="portfolio-link"
                                >
                                  View Project →
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marketplace Assets */}
                  {assets && assets.length > 0 && (
                    <div className="portfolio-subsection">
                      <h4 className="portfolio-subsection-title">Marketplace Assets</h4>
                      <div className="portfolio-grid">
                        {assets.map((asset) => (
                          <div key={`asset-${asset.id}`} className="portfolio-item asset-item">
                            <div className="portfolio-image">
                              {asset.preview_image ? (
                                <img 
                                  src={asset.preview_image} 
                                  alt={asset.title}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="asset-placeholder"
                                style={{display: asset.preview_image ? 'none' : 'flex'}}
                              >
                                <i className="fas fa-cube"></i>
                              </div>
                            </div>
                            <div className="portfolio-content">
                              <h4>{typeof asset.title === 'string' ? asset.title : 
                                   typeof asset.title === 'object' && asset.title ? (asset.title.name || 'Untitled Asset') : 
                                   'Untitled Asset'}</h4>
                              <p>{typeof asset.description === 'string' ? asset.description : 
                                 typeof asset.description === 'object' && asset.description ? (asset.description.name || 'No description available') : 
                                 'No description available'}</p>
                              <div className="asset-meta">
                                <span className="asset-type-badge">
                                  {typeof asset.category === 'object' && asset.category ? asset.category.name :
                                   typeof asset.category === 'string' ? asset.category :
                                   typeof asset.asset_type === 'string' ? asset.asset_type : 
                                   typeof asset.asset_type === 'object' ? (asset.asset_type.name || 'Unknown') : 
                                   'Unknown'}
                                </span>
                                {asset.price && (
                                  <span className="asset-price">${asset.price}</span>
                                )}
                              </div>
                              <div className="asset-stats">
                                {asset.download_count > 0 && (
                                  <span className="stat">
                                    <i className="fas fa-download"></i>
                                    {asset.download_count}
                                  </span>
                                )}
                                <span className="stat">
                                  <i className="fas fa-calendar"></i>
                                  {new Date(asset.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Portfolio Content */}
                  {(!profile.portfolio_items || profile.portfolio_items.length === 0) && 
                   (!assets || assets.length === 0) && (
                    <div className="no-content-state">
                      <div className="no-content-icon"><i className="fas fa-folder-open icon"></i></div>
                      <h4>
                        {profile.user_type === 'client' ? 'No Projects Listed' : 'No Portfolio Items'}
                      </h4>
                      <p>
                        {profile.user_type === 'client' 
                          ? "This client hasn't listed any past projects yet." 
                          : "This creator hasn't uploaded any portfolio items yet."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* About Section */}
          <div 
            className={`profile-section about-section ${activeTab === 'about' ? 'active' : ''}`} 
            id="about-section" 
            style={{ display: activeTab === 'about' ? 'block' : 'none' }}
          >
            <h3>About</h3>
            
            {/* Bio */}
            <div className="about-subsection">
              <h4>Bio</h4>
              {profile.bio?.trim() ? (
                <p className="bio">
                  {typeof profile.bio === 'string' ? profile.bio : 
                   typeof profile.bio === 'object' && profile.bio ? (profile.bio.name || profile.bio.description || 'Bio available') : 
                   'Bio available'}
                </p>
              ) : (
                <p className="no-content">This user hasn't added a bio yet.</p>
              )}
            </div>

            {/* Experience & Background */}
            <div className="about-subsection">
              <h4>Experience & Background</h4>
              <div className="experience-grid">
                {profile.location && (
                  <div className="experience-item">
                    <div className="experience-icon">📍</div>
                    <div className="experience-content">
                      <h5>Location</h5>
                      <p>
                        {typeof profile.location === 'string' ? profile.location : 
                         typeof profile.location === 'object' && profile.location ? (profile.location.name || 'Location provided') : 
                         'Location provided'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="experience-item">
                  <div className="experience-icon">📅</div>
                  <div className="experience-content">
                    <h5>Member Since</h5>
                    <p>{formatDate(profile.member_since)}</p>
                  </div>
                </div>
                
                {profile.user_type === 'creator' && (
                  <div className="experience-item">
                    <div className="experience-icon"><i className="fas fa-palette icon"></i></div>
                    <div className="experience-content">
                      <h5>Creator Type</h5>
                      <p>{getUserTypeLabel(profile.user_type)}</p>
                    </div>
                  </div>
                )}
                
                {profile.user_type === 'freelancer' && (
                  <div className="experience-item">
                    <div className="experience-icon"><i className="fas fa-briefcase icon"></i></div>
                    <div className="experience-content">
                      <h5>Professional</h5>
                      <p>Freelancer</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Services Offered */}
            {profile.services_offered?.trim() && (profile.user_type === 'creator' || profile.user_type === 'freelancer') && (
              <div className="about-subsection">
                <h4>
                  {profile.user_type === 'creator' ? 'Services & Commissions' : 'Services Offered'}
                </h4>
                <div className="services-content">
                  <div className="services-text">
                    {Array.isArray(profile.services_offered)
                      ? profile.services_offered.map((service, index) => (
                          <div key={index} className="service-item">
                            <span className="service-icon"><i className="fas fa-bolt icon"></i></span>
                            <p>{typeof service === 'string' ? service : 
                                typeof service === 'object' && service ? (service.name || service.title || 'Service available') : 
                                'Service available'}</p>
                          </div>
                        ))
                      : typeof profile.services_offered === 'string'
                      ? profile.services_offered.split('\n').map((service, index) => (
                          <div key={index} className="service-item">
                            <span className="service-icon"><i className="fas fa-bolt icon"></i></span>
                            <p>{service.trim()}</p>
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              </div>
            )}

            {/* Work With Me */}
            <div className="about-subsection">
              <h4>
                {profile.user_type === 'freelancer' ? 'Hire Me' : 
                 profile.user_type === 'creator' ? 'Work With Me' : 
                 'Let\'s Collaborate'}
              </h4>
              <div className="collaboration-section">
                <p>
                  {profile.user_type === 'freelancer' 
                    ? `Looking for a skilled freelancer? Get in touch with ${profile.full_name.split(' ')[0]} for your next project!`
                    : profile.user_type === 'creator'
                    ? `Interested in collaborating or commissioning work from ${profile.full_name.split(' ')[0]}? Let's create something amazing together!`
                    : `Want to collaborate on a project or discuss opportunities with ${profile.full_name.split(' ')[0]}? Reach out!`}
                </p>
                <div className="contact-methods">
                  <button className="contact-method-btn primary" onClick={handleMessage}>
                    <span className="method-icon"><i className="fas fa-comment icon"></i></span>
                    <div className="method-info">
                      <h5>Send Message</h5>
                      <p>
                        {profile.user_type === 'freelancer' ? 'Discuss your project' : 
                         profile.user_type === 'creator' ? 'Start a conversation' : 
                         'Connect directly'}
                      </p>
                    </div>
                  </button>
                  <button className="contact-method-btn secondary" onClick={handleContact}>
                    <span className="method-icon">📧</span>
                    <div className="method-info">
                      <h5>
                        {profile.user_type === 'freelancer' ? 'Get Quote' : 
                         profile.user_type === 'creator' ? 'Commission Work' : 
                         'Professional Contact'}
                      </h5>
                      <p>
                        {profile.user_type === 'freelancer' ? 'Request project quote' : 
                         profile.user_type === 'creator' ? 'Discuss commission' : 
                         'Business inquiry'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div 
            className={`profile-section skills-section ${activeTab === 'skills' ? 'active' : ''}`} 
            id="skills-section" 
            style={{ display: activeTab === 'skills' ? 'block' : 'none' }}
          >
            <h3>
              {profile.user_type === 'creator' ? 'Skills & Expertise' : 
               profile.user_type === 'freelancer' ? 'Skills & Expertise' : 
               'Areas of Interest'}
            </h3>
            {((Array.isArray(profile.skills) && profile.skills.length > 0) || 
              (typeof profile.skills === 'string' && profile.skills.trim())) ? (
              <div className="skills-list">
                {profile.skills.split(',').map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <div className="no-content-state">
                <div className="no-content-icon"><i className="fas fa-lightbulb icon"></i></div>
                <h4>No Skills Listed</h4>
                <p>This user hasn't added any skills yet.</p>
              </div>
            )}

            {/* Rates - Show for Freelancer */}
            {profile.user_type === 'freelancer' && (
              <div className="skills-subsection">
                <h4>Rates & Pricing</h4>
                <div className="rates-content">
                  <div className="rates-grid">
                    <div className="rate-item">
                      <div className="rate-icon"><i className="fas fa-dollar-sign icon"></i></div>
                      <div className="rate-info">
                        <h5>Hourly Rate</h5>
                        <p>Contact for rates</p>
                      </div>
                    </div>
                    <div className="rate-item">
                      <div className="rate-icon"><i className="fas fa-clipboard icon"></i></div>
                      <div className="rate-info">
                        <h5>Project Rate</h5>
                        <p>Varies by scope</p>
                      </div>
                    </div>
                    <div className="rate-item">
                      <div className="rate-icon"><i className="fas fa-bolt icon"></i></div>
                      <div className="rate-info">
                        <h5>Rush Jobs</h5>
                        <p>+50% surcharge</p>
                      </div>
                    </div>
                  </div>
                  <p className="rates-note">
                    <em>Rates may vary based on project complexity and timeline. Contact for detailed quotes.</em>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recognition Section */}
          <div 
            className={`profile-section recognition-section ${activeTab === 'recognition' ? 'active' : ''}`} 
            id="recognition-section" 
            style={{ display: activeTab === 'recognition' ? 'block' : 'none' }}
          >
            <h3>Achievements & Recognition</h3>
            {profile.achievements?.trim() && (profile.user_type === 'creator' || profile.user_type === 'freelancer') ? (
              <div className="achievements-content">
                <div className="achievements-text">
                  {Array.isArray(profile.achievements)
                    ? profile.achievements.map((achievement, index) => (
                        <div key={index} className="achievement-item">
                          <span className="achievement-icon"><i className="fas fa-trophy icon"></i></span>
                          <p>{typeof achievement === 'string' ? achievement : 
                              typeof achievement === 'object' && achievement ? (achievement.name || achievement.title || 'Achievement earned') : 
                              'Achievement earned'}</p>
                        </div>
                      ))
                    : typeof profile.achievements === 'string'
                    ? profile.achievements.split('\n').map((achievement, index) => (
                        <div key={index} className="achievement-item">
                          <span className="achievement-icon"><i className="fas fa-trophy icon"></i></span>
                          <p>{achievement.trim()}</p>
                        </div>
                      ))
                    : null}
                </div>
              </div>
            ) : (
              <div className="no-content-state">
                <div className="no-content-icon"><i className="fas fa-trophy icon"></i></div>
                <h4>No Achievements Listed</h4>
                <p>
                  {profile.user_type === 'freelancer' 
                    ? "This freelancer hasn't listed any achievements yet."
                    : profile.user_type === 'creator'
                    ? "This creator hasn't listed any achievements yet."
                    : "This user hasn't listed any achievements yet."}
                </p>
              </div>
            )}

            {/* Recent Activity */}
            <div className="recognition-subsection">
              <h4>Recent Activity</h4>
              <div className="activity-feed">
                <div className="activity-item">
                  <div className="activity-icon"><i className="fas fa-palette icon"></i></div>
                  <div className="activity-content">
                    <p><strong>Joined VikraHub</strong></p>
                    <span className="activity-date">{formatDate(profile.member_since)}</span>
                  </div>
                </div>
                {assets.length > 0 && (
                  <div className="activity-item">
                    <div className="activity-icon"><i className="fas fa-folder-open icon"></i></div>
                    <div className="activity-content">
                      <p><strong>Added {assets.length} portfolio item{assets.length !== 1 ? 's' : ''}</strong></p>
                      <span className="activity-date">Various dates</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default PublicProfile;
