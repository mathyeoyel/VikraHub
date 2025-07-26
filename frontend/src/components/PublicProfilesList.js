import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicProfileAPI } from '../api';
import { useAuth } from './Auth/AuthContext';
import ChatButton from './Chat/ChatButton';
import './PublicProfilesList.css';

const PublicProfilesList = () => {
  const { user, isAuthenticated } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async (query = '', userType = '') => {
    try {
      setLoading(true);
      const params = {};
      if (query) params.q = query;
      if (userType) params.type = userType;
      
      const response = query || userType 
        ? await publicProfileAPI.search(params)
        : await publicProfileAPI.getAll();
      
      setProfiles(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProfiles(searchQuery, userTypeFilter);
  };

  const handleFilterChange = (userType) => {
    setUserTypeFilter(userType);
    fetchProfiles(searchQuery, userType);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  if (loading && profiles.length === 0) {
    return (
      <div className="public-profiles-list">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-profiles-list">
      <div className="container">
        <div className="page-header">
          <h1>Community Members</h1>
          <p>Discover talented individuals in our community</p>
        </div>

        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search by name, username, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                🔍
              </button>
            </div>
          </form>

          <div className="filter-buttons">
            <button 
              className={`filter-btn ${userTypeFilter === '' ? 'active' : ''}`}
              onClick={() => handleFilterChange('')}
            >
              All Members
            </button>
            <button 
              className={`filter-btn ${userTypeFilter === 'freelancer' ? 'active' : ''}`}
              onClick={() => handleFilterChange('freelancer')}
            >
              💼 Freelancers
            </button>
            <button 
              className={`filter-btn ${userTypeFilter === 'creator' ? 'active' : ''}`}
              onClick={() => handleFilterChange('creator')}
            >
              🛍️ Creators
            </button>
            <button 
              className={`filter-btn ${userTypeFilter === 'client' ? 'active' : ''}`}
              onClick={() => handleFilterChange('client')}
            >
              👤 Clients
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="profiles-grid">
          {profiles.map((profile) => (
            <div key={profile.id} className="profile-card">
              <Link 
                to={`/profile/${profile.user.username}`}
                className="profile-main-link"
              >
                <div className="profile-avatar">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.full_name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="profile-content">
                  <h3>{profile.full_name}</h3>
                  <p className="username">@{profile.user.username}</p>
                  
                  <div className="user-type">
                    <span className="user-type-icon">{getUserTypeIcon(profile.user_type)}</span>
                    <span className="user-type-label">{getUserTypeLabel(profile.user_type)}</span>
                  </div>

                  {profile.bio && (
                    <p className="bio-preview">
                      {profile.bio.length > 100 
                        ? `${profile.bio.substring(0, 100)}...` 
                        : profile.bio
                      }
                    </p>
                  )}

                  {profile.skills && (
                    <div className="skills-preview">
                      {profile.skills.split(',').slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill.trim()}
                        </span>
                      ))}
                      {profile.skills.split(',').length > 3 && (
                        <span className="more-skills">
                          +{profile.skills.split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <p className="member-since">
                    Member since {formatDate(profile.member_since)}
                  </p>
                </div>
              </Link>
              
              {/* Action buttons outside the Link */}
              <div className="profile-actions">
                {isAuthenticated && user?.username !== profile.user.username && (
                  <ChatButton 
                    recipientUsername={profile.user.username}
                    recipientName={profile.full_name}
                    size="small"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && !loading && (
          <div className="no-profiles">
            <h3>No profiles found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfilesList;
