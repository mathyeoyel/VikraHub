// frontend/src/components/UserSuggestions.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { followAPI, userAPI } from '../api';
import FollowButton from './FollowButton';
import './UserSuggestions.css';

const UserSuggestions = ({ limit = 5 }) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      // Try to get follow suggestions from API
      const response = await followAPI.getSuggestions();
      setSuggestions(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
      try {
        // Fallback: get some users from public profiles
        const profilesResponse = await userAPI.getPublicProfiles();
        const profiles = profilesResponse.data.results || profilesResponse.data || [];
        // Filter out current user and limit to 5
        const filteredProfiles = profiles
          .filter(profile => profile.user?.id !== user?.id)
          .slice(0, limit)
          .map(profile => ({
            id: profile.user?.id,
            username: profile.user?.username,
            first_name: profile.user?.first_name,
            last_name: profile.user?.last_name,
            bio: profile.bio,
            profile_picture: profile.profile_picture,
            followers_count: 0, // We don't have this data
            following_count: 0
          }));
        setSuggestions(filteredProfiles);
      } catch (fallbackError) {
        console.error('Error fetching fallback suggestions:', fallbackError);
        // Last resort: show demo users
        setSuggestions([
          {
            id: 999,
            username: 'demo_user',
            first_name: 'Demo',
            last_name: 'User',
            bio: 'Demo user for testing follow functionality',
            profile_picture: null,
            followers_count: 0,
            following_count: 0
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollowSuccess = (targetUserId) => {
    setSuggestions(prev => prev.filter(user => user.id !== targetUserId));
  };

  if (loading) {
    return (
      <div className="user-suggestions loading">
        <h3>People you might know</h3>
        <div className="loading-text">Finding people for you...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="user-suggestions empty">
        <h3>People you might know</h3>
        <p>No new suggestions right now. Check back later!</p>
      </div>
    );
  }

  return (
    <div className="user-suggestions">
      <h3>People you might know</h3>
      <div className="suggestions-list">
        {suggestions.map(suggestedUser => (
          <div key={suggestedUser.id} className="suggestion-card">
            <div className="user-avatar">
              {suggestedUser.profile_picture ? (
                <img 
                  src={suggestedUser.profile_picture} 
                  alt={suggestedUser.username}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  {(suggestedUser.first_name?.[0] || suggestedUser.username[0]).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="user-info">
              <div className="user-name">
                <h4>{suggestedUser.first_name && suggestedUser.last_name 
                  ? `${suggestedUser.first_name} ${suggestedUser.last_name}`
                  : suggestedUser.username
                }</h4>
                <span className="username">@{suggestedUser.username}</span>
              </div>
              
              {suggestedUser.bio && (
                <p className="user-bio">{suggestedUser.bio}</p>
              )}
              
              <div className="user-stats">
                <span className="stat">
                  <strong>{suggestedUser.followers_count || 0}</strong> followers
                </span>
                <span className="stat">
                  <strong>{suggestedUser.following_count || 0}</strong> following
                </span>
              </div>
            </div>
            
            <div className="follow-action">
              <FollowButton 
                targetUserId={suggestedUser.id}
                onFollowSuccess={() => handleFollowSuccess(suggestedUser.id)}
                compact={true}
              />
            </div>
          </div>
        ))}
      </div>
      
      <button 
        className="refresh-suggestions"
        onClick={fetchSuggestions}
        disabled={loading}
      >
        🔄 Refresh suggestions
      </button>
    </div>
  );
};

export default UserSuggestions;
