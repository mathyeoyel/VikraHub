import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { userAPI } from '../api';
import { uploadToCloudinary } from '../utils/cloudinary';
import './EditProfile.css';

const EditProfile = ({ onClose, onProfileUpdate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    user_type: 'client',
    bio: '',
    website: '',
    twitter: '',
    instagram: '',
    facebook: '',
    skills: '',
    avatar: ''  // Will store Cloudinary URL instead of File object
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getMyProfile();
      const profileData = response.data;
      
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        user_type: profileData.user_type || 'client',
        bio: profileData.bio || '',
        website: profileData.website || '',
        twitter: profileData.twitter || '',
        instagram: profileData.instagram || '',
        facebook: profileData.facebook || '',
        skills: profileData.skills || '',
        avatar: profileData.avatar || ''  // Cloudinary URL
      });
      
      if (profileData.avatar) {
        setAvatarPreview(profileData.avatar);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setError('');
        setSuccess('');
        
        // Show uploading state
        setAvatarPreview(URL.createObjectURL(file));
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(file, {
          folder: 'avatars',
          tags: ['avatar', 'profile']
        });
        
        // Update form data with Cloudinary URL
        setFormData(prev => ({
          ...prev,
          avatar: uploadResult.secure_url
        }));
        
        // Update preview with Cloudinary URL
        setAvatarPreview(uploadResult.secure_url);
        
        setSuccess('Image uploaded successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        setError(`Upload failed: ${error.message}`);
        // Reset file input
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for submission - no need for FormData anymore
      const dataToSend = {};
      
      // Only include fields that have been changed or have values
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          dataToSend[key] = formData[key];
        }
      });

      const response = await userAPI.updateProfile(dataToSend);
      setSuccess('Profile updated successfully!');
      
      // Call the callback to refresh parent component
      if (onProfileUpdate) {
        onProfileUpdate(response.data);
      }
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response && error.response.data) {
        // Handle different error response formats
        let errorMessage = '';
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          // Handle field-specific errors
          const errorMessages = Object.entries(error.response.data).map(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${messageArray.join(', ')}`;
          });
          errorMessage = errorMessages.join('; ');
        }
        setError(errorMessage);
      } else if (error.message) {
        setError(`Network error: ${error.message}`);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-overlay">
        <div className="edit-profile-modal">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-overlay">
      <div className="edit-profile-modal">
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Avatar Section */}
          <div className="form-section">
            <h3>Profile Picture</h3>
            <div className="avatar-section">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" />
                ) : (
                  <div className="avatar-placeholder">
                    {formData.first_name ? formData.first_name[0] : user?.username?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div className="avatar-upload">
                <label htmlFor="avatar-input" className="upload-btn">
                  Change Photo
                </label>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <small>JPG, PNG, or GIF (Max 5MB)</small>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="user_type">User Type</label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleInputChange}
              >
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
                <option value="seller">Seller</option>
              </select>
            </div>
          </div>

          {/* About Section */}
          <div className="form-section">
            <h3>About</h3>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="skills">Skills</label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="e.g., JavaScript, React, Node.js (comma-separated)"
              />
              <small>Separate skills with commas</small>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="form-section">
            <h3>Contact & Social</h3>
            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="twitter">Twitter</label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  placeholder="@username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="instagram">Instagram</label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  placeholder="@username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="facebook">Facebook</label>
              <input
                type="text"
                id="facebook"
                name="facebook"
                value={formData.facebook}
                onChange={handleInputChange}
                placeholder="facebook.com/username"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-save">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
