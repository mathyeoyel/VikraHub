import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicProfileAPI } from '../api';
import './PublicProfile.css';

const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await publicProfileAPI.getByUsername(username);
        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Profile not found');
      } finally {
        setLoading(false);
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
      case 'seller':
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
            {profile.portfolio_items && profile.portfolio_items.length > 0 ? (
              <div className="portfolio-grid">
                {profile.portfolio_items.map((item) => (
                  <div key={item.id} className="portfolio-item">
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
            ) : (
              <p className="no-content">No portfolio items to display yet.</p>
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
