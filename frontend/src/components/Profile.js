import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { userAPI } from '../api';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await userAPI.getMyProfile();
      console.log('Profile data received:', response.data);
      console.log('Skills data type:', typeof response.data.skills, response.data.skills);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h2>Please Log In</h2>
          <p>You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h2>Profile Not Found</h2>
          <p>Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <img 
            src={profile?.avatar || '/assets/default-avatar.png'} 
            alt={`${profile?.user?.first_name || 'User'}'s profile`}
            onError={(e) => {
              e.target.src = '/assets/default-avatar.png';
            }}
          />
        </div>
        <div className="profile-info">
          <h1>{profile?.user?.first_name || ''} {profile?.user?.last_name || ''}</h1>
          <p className="profile-username">@{profile?.user?.username || 'unknown'}</p>
          <p className="profile-email">{profile?.user?.email || ''}</p>
          {profile?.title && <p className="profile-title">{profile.title}</p>}
          {profile?.location && <p className="profile-location">📍 {profile.location}</p>}
        </div>
        <div className="profile-actions">
          <button 
            className="edit-profile-btn"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {profile?.bio && (
        <div className="profile-section">
          <h3>About</h3>
          <p className="profile-bio">{profile.bio}</p>
        </div>
      )}

      {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
        <div className="profile-section">
          <h3>Skills</h3>
          <div className="skills-list">
            {profile.skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {profile.skills && typeof profile.skills === 'string' && profile.skills.trim() && (
        <div className="profile-section">
          <h3>Skills</h3>
          <div className="skills-list">
            {profile.skills.split(',').map((skill, index) => (
              <span key={index} className="skill-tag">{skill.trim()}</span>
            ))}
          </div>
        </div>
      )}

      <div className="profile-section">
        <h3>Contact Information</h3>
        <div className="contact-info">
          <div className="contact-item">
            <strong>Email:</strong> {profile?.user?.email || 'Not provided'}
          </div>
          {profile?.phone && (
            <div className="contact-item">
              <strong>Phone:</strong> {profile.phone}
            </div>
          )}
          {profile?.website && (
            <div className="contact-item">
              <strong>Website:</strong> 
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                {profile.website}
              </a>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="edit-form-overlay">
          <div className="edit-form-container">
            <h3>Edit Profile</h3>
            <p>Profile editing functionality will be implemented here.</p>
            <button onClick={() => setEditing(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
