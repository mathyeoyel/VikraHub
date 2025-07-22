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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await publicProfileAPI.getByUsername(username);
        setProfile(response.data);
        
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
        {/* Profile Header */}
        <div className="profile-header">
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
            
            {/* Contact Button */}
            <button className="contact-btn" onClick={handleContact}>
              💬 Contact Me
            </button>
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

          {/* Skills & Services */}
          {profile.skills && (
            <div className="profile-section">
              <h3>Skills & Services</h3>
              <div className="skills-list">
                {profile.skills.split(',').map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Section */}
          <div className="profile-section">
            <h3>Portfolio</h3>
            {assetsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading portfolio...</p>
              </div>
            ) : (
              <>
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
                  <p className="no-content">No portfolio items to display yet.</p>
                )}
              </>
            )}
          </div>

          {/* Client Reviews/Testimonials Section */}
          <div className="profile-section">
            <h3>Client Reviews & Testimonials</h3>
            <p className="no-content">Reviews and testimonials will be displayed here once implemented.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
