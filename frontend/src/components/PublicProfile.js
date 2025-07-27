import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicProfileAPI, assetAPI, userAPI, followAPI } from '../api';
import { useAuth } from './Auth/AuthContext';
import notificationService from '../services/notificationService';
import PublicClientProfile from './PublicClientProfile';
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
        await fetchUserAssets(response.data.user.id);
      } catch (err) {
        setError(err.response?.data?.detail || 'Profile not found');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserAssets = async (userId) => {
      try {
        setAssetsLoading(true);
        console.log(`Fetching assets for user ${userId}...`);
        
        // Try to fetch assets with seller filter parameter first
        let userAssets = [];
        try {
          const response = await assetAPI.getAll({ seller: userId });
          userAssets = response.results || response.data || response || [];
          console.log(`API response for user ${userId}:`, response);
        } catch (paramError) {
          console.log('Parameterized fetch failed, falling back to full fetch and filter...');
          // Fallback: fetch all assets and filter client-side
          const response = await assetAPI.getAll();
          const allAssets = response.results || response.data || response || [];
          
          // Filter assets to only show those created/sold by this specific user
          userAssets = allAssets.filter(asset => {
            // Check both seller.id and user.id patterns
            return (asset.seller && asset.seller.id === userId) || 
                   (asset.user && asset.user.id === userId) ||
                   (asset.seller_id === userId) ||
                   (asset.user_id === userId);
          });
        }
        
        console.log(`Found ${userAssets.length} assets for user ${userId}:`, userAssets);
        setAssets(userAssets);
      } catch (err) {
        console.warn('Failed to fetch user assets:', err);
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
        return '💼';
      case 'creator':
        return '🛍️';
      case 'client':
        return '👤';
      default:
        return '👤';
    }
  };

  const getUserTypeLabel = (userType) => {
    return userType.charAt(0).toUpperCase() + userType.slice(1);
  };

  const getSocialIcon = (platform) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼',
      github: '🐙'
    };
    return icons[platform] || '🔗';
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
                    <span className="btn-icon">💬</span>
                    Message
                  </button>
                )}
                <button className="action-btn share-btn" onClick={handleShare}>
                  <span className="btn-icon">📤</span>
                  Share
                </button>
              </div>
            </div>
            
            <div className="profile-info">
              <h1 className="profile-name">{profile.full_name}</h1>
              <p className="username">@{profile.user.username}</p>
              
              {/* Headline/Tagline */}
              {profile.headline && (
                <p className="profile-headline">{profile.headline}</p>
              )}
              
              <div className="profile-meta">
                <div className="user-type">
                  <span className="user-type-icon">{getUserTypeIcon(profile.user_type)}</span>
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
        {(profile.facebook || profile.instagram || profile.twitter || profile.linkedin || profile.github || profile.website) && (
          <div className="profile-section social-links">
            <h3>Connect With Me</h3>
            <div className="social-buttons">
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="social-link">
                  🌐 Website
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                  {getSocialIcon('linkedin')} LinkedIn
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="social-link">
                  {getSocialIcon('github')} GitHub
                </a>
              )}
              {profile.twitter && (
                <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                  {getSocialIcon('twitter')} Twitter
                </a>
              )}
              {profile.instagram && (
                <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                  {getSocialIcon('instagram')} Instagram
                </a>
              )}
              {profile.facebook && (
                <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                  {getSocialIcon('facebook')} Facebook
                </a>
              )}
            </div>
          </div>
        )}

        <div className="profile-content">
          {/* About/Bio Section */}
          <div className="profile-section">
            <h3>About</h3>
            {profile.bio ? (
              <p className="bio">{profile.bio}</p>
            ) : (
              <p className="no-content">This user hasn't added a bio yet.</p>
            )}
          </div>

          {/* Skills & Expertise - Show for Creator and Freelancer, Maybe for Client */}
          {profile.skills && (profile.user_type === 'creator' || profile.user_type === 'freelancer' || profile.user_type === 'client') && (
            <div className="profile-section">
              <h3>
                {profile.user_type === 'creator' ? 'Skills & Expertise' : 
                 profile.user_type === 'freelancer' ? 'Skills & Expertise' : 
                 'Areas of Interest'}
              </h3>
              <div className="skills-list">
                {profile.skills.split(',').map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Achievements - Show only for Creator, Maybe for Freelancer */}
          {profile.achievements && (profile.user_type === 'creator' || profile.user_type === 'freelancer') && (
            <div className="profile-section">
              <h3>Achievements & Recognition</h3>
              <div className="achievements-content">
                <div className="achievements-text">
                  {profile.achievements.split('\n').map((achievement, index) => (
                    <div key={index} className="achievement-item">
                      <span className="achievement-icon">🏆</span>
                      <p>{achievement.trim()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Services Offered - Show for Creator, Maybe for Freelancer, No for Client */}
          {profile.services_offered && (profile.user_type === 'creator' || profile.user_type === 'freelancer') && (
            <div className="profile-section">
              <h3>
                {profile.user_type === 'creator' ? 'Services & Commissions' : 'Services Offered'}
              </h3>
              <div className="services-content">
                <div className="services-text">
                  {profile.services_offered.split('\n').map((service, index) => (
                    <div key={index} className="service-item">
                      <span className="service-icon">⚡</span>
                      <p>{service.trim()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rates - Show for Freelancer, Maybe for Creator */}
          {profile.user_type === 'freelancer' && (
            <div className="profile-section">
              <h3>Rates & Pricing</h3>
              <div className="rates-content">
                <div className="rates-grid">
                  <div className="rate-item">
                    <div className="rate-icon">💰</div>
                    <div className="rate-info">
                      <h4>Hourly Rate</h4>
                      <p>Contact for rates</p>
                    </div>
                  </div>
                  <div className="rate-item">
                    <div className="rate-icon">📋</div>
                    <div className="rate-info">
                      <h4>Project Rate</h4>
                      <p>Varies by scope</p>
                    </div>
                  </div>
                  <div className="rate-item">
                    <div className="rate-icon">⚡</div>
                    <div className="rate-info">
                      <h4>Rush Jobs</h4>
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

          {/* Experience & Background */}
          <div className="profile-section">
            <h3>Experience & Background</h3>
            <div className="experience-grid">
              {profile.location && (
                <div className="experience-item">
                  <div className="experience-icon">📍</div>
                  <div className="experience-content">
                    <h4>Location</h4>
                    <p>{profile.location}</p>
                  </div>
                </div>
              )}
              
              <div className="experience-item">
                <div className="experience-icon">📅</div>
                <div className="experience-content">
                  <h4>Member Since</h4>
                  <p>{formatDate(profile.member_since)}</p>
                </div>
              </div>
              
              {profile.user_type === 'creator' && (
                <div className="experience-item">
                  <div className="experience-icon">🎨</div>
                  <div className="experience-content">
                    <h4>Creator Type</h4>
                    <p>{getUserTypeLabel(profile.user_type)}</p>
                  </div>
                </div>
              )}
              
              {profile.user_type === 'freelancer' && (
                <div className="experience-item">
                  <div className="experience-icon">💼</div>
                  <div className="experience-content">
                    <h4>Professional</h4>
                    <p>Freelancer</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="profile-section">
            <h3>
              {profile.user_type === 'client' ? 'Past Projects' : 'Portfolio & Work'}
            </h3>
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
                              <img src={profile.portfolio_items[0].image} alt={profile.portfolio_items[0].title} />
                              <div className="featured-work-overlay">
                                <span className="featured-badge">Featured</span>
                              </div>
                            </div>
                          )}
                          <div className="featured-work-content">
                            <h5>{profile.portfolio_items[0].title}</h5>
                            <p>{profile.portfolio_items[0].description}</p>
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
                            <h5>{assets[0].title}</h5>
                            <p>{assets[0].description}</p>
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
                              <img src={item.image} alt={item.title} />
                            </div>
                          )}
                          <div className="portfolio-content">
                            <h4>{item.title}</h4>
                            <p>{item.description}</p>
                            {item.tags_list && item.tags_list.length > 0 && (
                              <div className="portfolio-tags">
                                {item.tags_list.map((tag, index) => (
                                  <span key={index} className="portfolio-tag">
                                    {tag}
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
                            <h4>{asset.title}</h4>
                            <p>{asset.description}</p>
                            <div className="asset-meta">
                              <span className="asset-type-badge">{asset.asset_type}</span>
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
                    <div className="no-content-icon">📁</div>
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

          {/* Client Reviews/Testimonials Section - Yes for Freelancer, Optional for Creator and Client */}
          {(profile.user_type === 'freelancer' || profile.user_type === 'creator' || profile.user_type === 'client') && (
            <div className="profile-section">
              <h3>
                {profile.user_type === 'freelancer' ? 'Client Reviews' : 
                 profile.user_type === 'creator' ? 'Customer Reviews' : 
                 'Project Feedback'}
              </h3>
              <div className="reviews-placeholder">
                <div className="review-item">
                  <div className="review-header">
                    <div className="reviewer-avatar">👤</div>
                    <div className="reviewer-info">
                      <h4>Sample Review</h4>
                      <div className="review-rating">⭐⭐⭐⭐⭐</div>
                    </div>
                  </div>
                  <p>
                    {profile.user_type === 'freelancer' 
                      ? "This is a placeholder for client reviews and testimonials. The review system will be implemented to show real feedback from clients."
                      : profile.user_type === 'creator'
                      ? "This is a placeholder for customer reviews and testimonials. The review system will be implemented to show real feedback from customers."
                      : "This is a placeholder for project feedback and testimonials from team members and collaborators."}
                  </p>
                </div>
              </div>
              <p className="no-content">
                {profile.user_type === 'freelancer' 
                  ? "Client reviews and testimonials will be displayed here once the review system is implemented."
                  : profile.user_type === 'creator'
                  ? "Customer reviews and feedback will be displayed here once the review system is implemented."
                  : "Project feedback and team reviews will be displayed here once the review system is implemented."}
              </p>
            </div>
          )}

          {/* Recent Activity Section */}
          <div className="profile-section">
            <h3>Recent Activity</h3>
            <div className="activity-feed">
              <div className="activity-item">
                <div className="activity-icon">🎨</div>
                <div className="activity-content">
                  <p><strong>Joined VikraHub</strong></p>
                  <span className="activity-date">{formatDate(profile.member_since)}</span>
                </div>
              </div>
              {assets.length > 0 && (
                <div className="activity-item">
                  <div className="activity-icon">📁</div>
                  <div className="activity-content">
                    <p><strong>Added {assets.length} portfolio item{assets.length !== 1 ? 's' : ''}</strong></p>
                    <span className="activity-date">Various dates</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact & Collaboration Section */}
          <div className="profile-section">
            <h3>
              {profile.user_type === 'freelancer' ? 'Hire Me' : 
               profile.user_type === 'creator' ? 'Work With Me' : 
               'Let\'s Collaborate'}
            </h3>
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
                  <span className="method-icon">💬</span>
                  <div className="method-info">
                    <h4>Send Message</h4>
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
                    <h4>
                      {profile.user_type === 'freelancer' ? 'Get Quote' : 
                       profile.user_type === 'creator' ? 'Commission Work' : 
                       'Professional Contact'}
                    </h4>
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
      </div>
    </div>
  );
};

export default PublicProfile;
