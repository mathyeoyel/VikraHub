import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicProfileAPI, assetAPI } from '../api';
import './PublicProfile.css';

const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await publicProfileAPI.getByUsername(username);
        setProfile(response.data);
        
        // Initialize follower/following counts (placeholder values)
        setFollowerCount(Math.floor(Math.random() * 100) + 10); // Random for demo
        setFollowingCount(Math.floor(Math.random() * 50) + 5);   // Random for demo
        
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
        // Fetch all assets and filter by the specific user
        const response = await assetAPI.getAll();
        const allAssets = response.data.results || response.data || [];
        
        // Filter assets to only show those created/sold by this specific user
        // The backend uses 'seller' field for the asset creator, seller is an object with id
        const userAssets = allAssets.filter(asset => asset.seller && asset.seller.id === userId);
        
        console.log(`Found ${userAssets.length} assets for user ${userId}`);
        setAssets(userAssets);
      } catch (err) {
        console.warn('Failed to fetch user assets:', err);
        setAssets([]);
      } finally {
        setAssetsLoading(false);
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
    try {
      // TODO: Implement follow/unfollow API calls
      setIsFollowing(!isFollowing);
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
      
      // Show temporary feedback
      const action = isFollowing ? 'Unfollowed' : 'Following';
      alert(`${action} ${profile.full_name}!`);
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      alert('Unable to complete action. Please try again.');
    }
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    alert('Messaging functionality will be implemented soon!');
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
                <button className="action-btn message-btn" onClick={handleMessage}>
                  <span className="btn-icon">💬</span>
                  Message
                </button>
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
                  <span className="stat-number">{followerCount}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{followingCount}</span>
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

          {/* Skills & Expertise */}
          {profile.skills && (
            <div className="profile-section">
              <h3>Skills & Expertise</h3>
              <div className="skills-list">
                {profile.skills.split(',').map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill.trim()}
                  </span>
                ))}
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
            <h3>Portfolio & Work</h3>
            {assetsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading portfolio...</p>
              </div>
            ) : (
              <>
                {/* Featured Work Section */}
                {(profile.portfolio_items?.length > 0 || assets.length > 0) && (
                  <div className="featured-work-section">
                    <h4 className="featured-work-title">✨ Featured Work</h4>
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
                    <h4 className="portfolio-subsection-title">Projects</h4>
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
                    <h4>No Portfolio Items</h4>
                    <p>This creator hasn't uploaded any portfolio items yet.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Client Reviews/Testimonials Section */}
          <div className="profile-section">
            <h3>Reviews & Testimonials</h3>
            <div className="reviews-placeholder">
              <div className="review-item">
                <div className="review-header">
                  <div className="reviewer-avatar">👤</div>
                  <div className="reviewer-info">
                    <h4>Sample Review</h4>
                    <div className="review-rating">⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <p>"This is a placeholder for client reviews and testimonials. The review system will be implemented to show real feedback from clients and collaborators."</p>
              </div>
            </div>
            <p className="no-content">Reviews and testimonials will be displayed here once the review system is implemented.</p>
          </div>

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
            <h3>Let's Work Together</h3>
            <div className="collaboration-section">
              <p>Interested in collaborating or hiring {profile.full_name.split(' ')[0]}? Get in touch!</p>
              <div className="contact-methods">
                <button className="contact-method-btn primary" onClick={handleMessage}>
                  <span className="method-icon">💬</span>
                  <div className="method-info">
                    <h4>Send Message</h4>
                    <p>Start a conversation</p>
                  </div>
                </button>
                <button className="contact-method-btn secondary" onClick={handleContact}>
                  <span className="method-icon">📧</span>
                  <div className="method-info">
                    <h4>Contact Directly</h4>
                    <p>Professional inquiry</p>
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
