import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicProfileAPI, assetAPI, userAPI, followAPI, portfolioAPI } from '../api';
import { useAuth } from './Auth/AuthContext';
import notificationService from '../services/notificationService';
import PublicClientProfile from './PublicClientProfile';
import ErrorBoundary from './ErrorBoundary';
import { handleImageError, createPortfolioImageUrl } from '../utils/portfolioImageUtils';
import SEO from './common/SEO';
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
  const handleTabSwitch = useCallback((tabName) => {
    setActiveTab(tabName);
  }, []);

  // Memoize follow handlers
  const handleFollow = useCallback(async () => {
    if (!isAuthenticated || !profile?.user?.username) return;

    try {
      if (isFollowing) {
        await followAPI.unfollow(profile.user.username);
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        notificationService.showSuccess('Unfollowed successfully');
      } else {
        await followAPI.follow(profile.user.username);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        notificationService.showSuccess('Following successfully');
      }
    } catch (error) {
      notificationService.showError(error.response?.data?.detail || 'Failed to update follow status');
    }
  }, [isAuthenticated, profile?.user?.username, isFollowing]);

  const handleMessage = useCallback(() => {
    if (!isAuthenticated || !profile?.user?.username) return;
    navigate(`/chat?user=${profile.user.username}`);
  }, [isAuthenticated, profile?.user?.username, navigate]);

  // Memoize computed values
  const userTypeInfo = useMemo(() => {
    const getUserTypeIcon = (type) => {
      switch (type) {
        case 'freelancer': return 'fas fa-briefcase';
        case 'creator': return 'fas fa-paintbrush';
        case 'client': return 'fas fa-user-tie';
        default: return 'fas fa-user';
      }
    };

    const getUserTypeLabel = (type) => {
      switch (type) {
        case 'freelancer': return 'Freelancer';
        case 'creator': return 'Creator';
        case 'client': return 'Client';
        default: return 'User';
      }
    };

    return {
      icon: getUserTypeIcon(profile?.user_type),
      label: getUserTypeLabel(profile?.user_type)
    };
  }, [profile?.user_type]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await publicProfileAPI.getByUsername(username);
        setProfile(response.data);
        
        // Debug: Log the complete profile data to see what we're getting
        console.log('🔍 Complete profile data received:', response.data);
        console.log('📁 Portfolio items:', response.data.portfolio_items);
        console.log('📊 Portfolio items length:', response.data.portfolio_items?.length || 0);
        
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
          console.log('🚀 About to call fetchUserPortfolioItems with user ID:', response.data.user.id);
          await fetchUserPortfolioItems(response.data.user.id);
          console.log('✅ Completed fetchUserPortfolioItems call');
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

    const fetchUserPortfolioItems = async (userId) => {
      try {
        console.log(`🎨 Fetching portfolio items for user ID: ${userId}`);
        
        // Check if portfolioAPI is available
        if (!portfolioAPI || !portfolioAPI.getAll) {
          console.error('❌ portfolioAPI.getAll is not available');
          return;
        }
        
        // Fetch all portfolio items and filter by user
        const response = await portfolioAPI.getAll();
        console.log(`📥 Portfolio API response:`, response);
        
        // Extract portfolio items from response
        const allPortfolioItems = response.results || response.data || response || [];
        console.log(`📋 Total portfolio items received: ${allPortfolioItems.length}`);
        
        // Debug: Log first few items to see structure
        if (allPortfolioItems.length > 0) {
          console.log(`🔬 Sample portfolio item structure:`, allPortfolioItems[0]);
        }
        
        // Filter portfolio items to only show those created by this specific user
        const userPortfolioItems = allPortfolioItems.filter(item => {
          // Check if the item has a user and the user ID matches
          // Also handle the case where user field might not be included in older API responses
          const isUserItem = 
            (item.user && item.user.id === userId) ||
            // Fallback: if no user field, show all items for now (backend compatibility)
            (!item.user && allPortfolioItems.length > 0);
          
          console.log(`🔍 Portfolio item ${item.id} ownership check:`, {
            itemId: item.id,
            title: item.title,
            itemUser: item.user,
            targetUserId: userId,
            isOwned: isUserItem,
            hasUserField: !!item.user
          });
          
          return isUserItem;
        });
        
        console.log(`🎯 Filtered ${userPortfolioItems.length} portfolio items for user ${userId}`);
        
        // If no user field is present, show a warning
        if (allPortfolioItems.length > 0 && !allPortfolioItems[0].user) {
          console.warn('⚠️ Portfolio items missing user field - backend may need restart to apply serializer updates');
        }
        
        // Update the profile state with the filtered portfolio items
        setProfile(prevProfile => ({
          ...prevProfile,
          portfolio_items: userPortfolioItems
        }));
        
        if (userPortfolioItems.length > 0) {
          console.log('✅ Updated profile with user-specific portfolio items');
        } else {
          console.log('ℹ️ No portfolio items found for this user');
        }
        
      } catch (err) {
        console.error('❌ Failed to fetch user portfolio items:', err);
        console.error('❌ Error details:', {
          message: err.message,
          response: err.response,
          status: err.response?.status
        });
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
      {/* Dynamic SEO meta tags for social sharing */}
      {profile && (
        <SEO
          title={`${profile.full_name} (@${profile.user?.username})`}
          description={profile.bio || `${profile.full_name} is a ${profile.user_type} on VikraHub. ${profile.headline || 'Connect and collaborate on creative projects.'}`}
          image={profile.avatar || profile.cover_photo || `${window.location.origin}/vikrahub-hero.jpg`}
          url={`${window.location.origin}/profile/${username}`}
          type="profile"
        />
      )}
      
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
            <div className="profile-layout">
              <div className="profile-avatar">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.full_name} />
                ) : (
                  <div className="avatar-placeholder">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="profile-info">
                {/* User's Name */}
                <h1 className="profile-name">
                  {typeof profile.full_name === 'string' ? profile.full_name : 
                   typeof profile.full_name === 'object' && profile.full_name ? (profile.full_name.name || 'Unknown User') : 
                   'Unknown User'}
                </h1>
                
                {/* Bio */}
                {profile.bio?.trim() && (
                  <p className="profile-bio">
                    {typeof profile.bio === 'string' ? profile.bio : 
                     typeof profile.bio === 'object' && profile.bio ? (profile.bio.name || profile.bio.description || '') : 
                     ''}
                  </p>
                )}
                
                {/* Creator Type */}
                <div className="user-type">
                  <span className="user-type-icon"><i className={`${userTypeInfo.icon} icon`}></i></span>
                  <span className="user-type-label">{userTypeInfo.label}</span>
                </div>
                
                {/* Action Buttons */}
                <div className="profile-actions">
                  <div className="action-buttons-row">
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
                  </div>
                  <div className="action-buttons-full">
                    <button className="action-btn share-btn" onClick={handleShare}>
                      <span className="btn-icon"><i className="fas fa-share icon"></i></span>
                      Share
                    </button>
                  </div>
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
                    <span className="stat-number">
                      {(profile?.portfolio_items?.length || 0) + (assets?.length || 0)}
                    </span>
                    <span className="stat-label">Projects</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-content">
          {/* Navigation Tabs */}
          <div className="profile-tabs">
            <button 
              className={`tab-button ${activeTab === 'works' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('works')}
            >
              Works
            </button>
            <button 
              className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('about')}
            >
              About
            </button>
            <button 
              className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('skills')}
            >
              Skills
            </button>
            <button 
              className={`tab-button ${activeTab === 'recognition' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('recognition')}
            >
              Recognition
            </button>
          </div>

          {/* Works Section */}
          <div 
            className={`profile-section works-section ${activeTab === 'works' ? 'active' : ''}`} 
            id="works-section"
            style={{ display: activeTab === 'works' ? 'block' : 'none' }}
          >
            <div className="works-container works-scrollable">
              {assetsLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading {profile.user_type === 'client' ? 'projects' : 'portfolio'}...</p>
                </div>
              ) : (
                <>
                  {/* Debug portfolio items */}
                  {console.log('🎨 Rendering works section with profile:', profile)}
                  {console.log('📁 Portfolio items in render:', profile?.portfolio_items)}
                  {console.log('📊 Portfolio items length in render:', profile?.portfolio_items?.length || 0)}
                  
                  {/* Portfolio Projects Section */}
                  {profile?.portfolio_items && profile.portfolio_items.length > 0 ? (
                    <div className="portfolio-subsection">
                      <h3 className="portfolio-subsection-title">
                        {profile.user_type === 'client' ? '📁 Client Projects' : '🎨 Portfolio Projects'}
                      </h3>
                      <div className="portfolio-grid">
                        {profile.portfolio_items.map((item) => (
                          <div key={`portfolio-${item.id}`} className="portfolio-item portfolio-project">
                            {/* Debug image field */}
                            {console.log(`🖼️ Portfolio item ${item.id} image debug:`, {
                              id: item.id,
                              title: item.title,
                              image: item.image,
                              preview_image: item.preview_image,
                              thumbnail: item.thumbnail,
                              photo: item.photo,
                              picture: item.picture,
                              imageUrl: item.imageUrl,
                              media: item.media,
                              allKeys: Object.keys(item)
                            })}
                            
                            {/* Image section - show either image or placeholder */}
                            <div className="portfolio-image">
                              {item.image ? (
                                <img 
                                  src={createPortfolioImageUrl(item.image, { title: item.title, tags: item.tags })} 
                                  alt={item.title}
                                  onError={(e) => {
                                    console.error(`❌ Failed to load portfolio image for item ${item.id}:`, {
                                      src: e.target.src,
                                      originalImage: item.image,
                                      item: item
                                    });
                                    handleImageError(e);
                                  }}
                                  data-original-src={item.image}
                                />
                              ) : (
                                <div className="portfolio-placeholder">
                                  <img 
                                    src={`https://via.placeholder.com/400x300/6b7280/ffffff?text=${encodeURIComponent(item.title || 'Portfolio Item')}`}
                                    alt={item.title}
                                    className="placeholder-image"
                                    style={{
                                      width: '100%',
                                      height: '200px',
                                      objectFit: 'cover',
                                      borderRadius: '8px'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            
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
                  ) : (
                    <div className="no-content-message" style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      background: '#f9f9f9',
                      borderRadius: '12px',
                      border: '2px dashed #ddd'
                    }}>
                      <div style={{marginBottom: '16px'}}>
                        <i className="fas fa-folder-open" style={{fontSize: '3rem', color: '#ccc'}}></i>
                      </div>
                      <h4 style={{margin: '0 0 8px 0', color: '#666'}}>No Portfolio Items</h4>
                      <p style={{margin: 0, color: '#999', fontSize: '14px'}}>
                        This user hasn't uploaded any portfolio projects yet.
                      </p>
                    </div>
                  )}

                  {/* Marketplace Assets Section - Only show if assets exist */}
                  {assets && assets.length > 0 && (
                    <div className="portfolio-subsection">
                      <h3 className="portfolio-subsection-title">
                        🛒 Marketplace Assets
                      </h3>
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

                  {/* No Content State */}
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

            {/* Connect With Me - Social Links */}
            {(profile.facebook?.trim() || profile.instagram?.trim() || profile.twitter?.trim() || 
              profile.linkedin?.trim() || profile.github?.trim() || profile.website?.trim()) && (
              <div className="about-subsection">
                <h4>Connect With Me</h4>
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

export default React.memo(PublicProfile);
