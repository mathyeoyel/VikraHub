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
    location: '',
    website: '',
    twitter: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    github: '',
    skills: '',
    headline: '',
    achievements: '',
    services_offered: '',
    years_experience: 0,
    experience_level: 'beginner',
    avatar: '',  // Will store Cloudinary URL instead of File object
    cover_photo: '',  // Will store Cloudinary URL for cover photo
    
    // Client-specific fields
    client_type: 'individual',
    company_name: '',
    company_size: 'solo',
    industry: '',
    business_address: '',
    contact_person: '',
    phone_number: '',
    typical_budget_range: '',
    project_types: '',
    preferred_communication: '',
    business_registration: '',
    tax_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

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
        location: profileData.location || '',
        website: profileData.website || '',
        twitter: profileData.twitter || '',
        instagram: profileData.instagram || '',
        facebook: profileData.facebook || '',
        linkedin: profileData.linkedin || '',
        github: profileData.github || '',
        skills: profileData.skills || '',
        headline: profileData.headline || '',
        achievements: profileData.achievements || '',
        services_offered: profileData.services_offered || '',
        years_experience: profileData.freelancer_profile?.years_experience || profileData.creator_profile?.experience_level === 'expert' ? 10 : 
                         profileData.creator_profile?.experience_level === 'advanced' ? 8 : 
                         profileData.creator_profile?.experience_level === 'intermediate' ? 4 : 0,
        experience_level: profileData.creator_profile?.experience_level || profileData.freelancer_profile?.experience_level || 'beginner',
        avatar: profileData.avatar || '',  // Cloudinary URL
        cover_photo: profileData.cover_photo || '',  // Cloudinary URL
        
        // Client-specific fields from client_profile
        client_type: profileData.client_profile?.client_type || 'individual',
        company_name: profileData.client_profile?.company_name || '',
        company_size: profileData.client_profile?.company_size || 'solo',
        industry: profileData.client_profile?.industry || '',
        business_address: profileData.client_profile?.business_address || '',
        contact_person: profileData.client_profile?.contact_person || '',
        phone_number: profileData.client_profile?.phone_number || '',
        typical_budget_range: profileData.client_profile?.typical_budget_range || '',
        project_types: profileData.client_profile?.project_types || '',
        preferred_communication: profileData.client_profile?.preferred_communication || '',
        business_registration: profileData.client_profile?.business_registration || '',
        tax_id: profileData.client_profile?.tax_id || ''
      });
      
      if (profileData.avatar) {
        setAvatarPreview(profileData.avatar);
      }
      
      if (profileData.cover_photo) {
        setCoverPreview(profileData.cover_photo);
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

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setError('');
        setSuccess('');
        
        // Show uploading state
        setCoverPreview(URL.createObjectURL(file));
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(file, {
          folder: 'cover_photos',
          tags: ['cover_photo', 'profile']
        });
        
        // Update form data with Cloudinary URL
        setFormData(prev => ({
          ...prev,
          cover_photo: uploadResult.secure_url
        }));
        
        // Update preview with Cloudinary URL
        setCoverPreview(uploadResult.secure_url);
        
        setSuccess('Cover photo uploaded successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        setError(`Cover photo upload failed: ${error.message}`);
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

          {/* Cover Photo Section */}
          <div className="form-section">
            <h3>Cover Photo</h3>
            <div className="cover-photo-section">
              <div className="cover-photo-preview">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover photo preview" />
                ) : (
                  <div className="cover-photo-placeholder">
                    <span>Upload a cover photo to personalize your profile</span>
                  </div>
                )}
              </div>
              <div className="cover-photo-upload">
                <label htmlFor="cover-photo-input" className="upload-btn">
                  Change Cover Photo
                </label>
                <input
                  id="cover-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPhotoChange}
                  style={{ display: 'none' }}
                />
                <small>JPG, PNG, or GIF (Max 5MB) - Recommended: 1920x400px</small>
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
              <label htmlFor="user_type">Account Type</label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleInputChange}
              >
                <option value="creator">Creator</option>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* About Section */}
          <div className="form-section">
            <h3>About</h3>
            <div className="form-group">
              <label htmlFor="headline">Professional Headline</label>
              <input
                type="text"
                id="headline"
                name="headline"
                value={formData.headline}
                onChange={handleInputChange}
                placeholder="e.g., Creative Director | Photographer | Designer"
              />
            </div>

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
                placeholder="e.g., Photography, Graphic Design, UI/UX (comma-separated)"
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

            <div className="form-row">
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
              <div className="form-group">
                <label htmlFor="linkedin">LinkedIn</label>
                <input
                  type="text"
                  id="linkedin"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="linkedin.com/in/username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="github">GitHub</label>
              <input
                type="text"
                id="github"
                name="github"
                value={formData.github}
                onChange={handleInputChange}
                placeholder="github.com/username"
              />
            </div>
          </div>

          {/* Client-specific Business Information */}
          {formData.user_type === 'client' && (
            <div className="form-section" data-client-section="true">
              <h3>🏢 Business Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="client_type">Client Type</label>
                  <select
                    id="client_type"
                    name="client_type"
                    value={formData.client_type}
                    onChange={handleInputChange}
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Business/Company</option>
                    <option value="nonprofit">Non-Profit Organization</option>
                    <option value="government">Government Agency</option>
                    <option value="media">Media Organization</option>
                    <option value="agency">Creative Agency</option>
                    <option value="startup">Startup</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="company_size">Company Size</label>
                  <select
                    id="company_size"
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleInputChange}
                  >
                    <option value="solo">Solo/Individual</option>
                    <option value="small">Small (2-10 employees)</option>
                    <option value="medium">Medium (11-50 employees)</option>
                    <option value="large">Large (51-200 employees)</option>
                    <option value="enterprise">Enterprise (200+ employees)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company_name">Company/Organization Name</label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="Your company or organization name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="industry">Industry</label>
                  <input
                    type="text"
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g., Technology, Healthcare, Education"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="business_address">Business Address</label>
                <textarea
                  id="business_address"
                  name="business_address"
                  value={formData.business_address}
                  onChange={handleInputChange}
                  placeholder="Complete business address"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact_person">Primary Contact Person</label>
                  <input
                    type="text"
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    placeholder="Name of primary contact"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone_number">Phone Number</label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Client Project Preferences */}
          {formData.user_type === 'client' && (
            <div className="form-section" data-client-section="true">
              <h3>🎯 Project Preferences</h3>
              
              <div className="form-group">
                <label htmlFor="typical_budget_range">Typical Budget Range</label>
                <input
                  type="text"
                  id="typical_budget_range"
                  name="typical_budget_range"
                  value={formData.typical_budget_range}
                  onChange={handleInputChange}
                  placeholder="e.g., $500 - $2,000, $5,000+, Negotiable"
                />
                <small>Help freelancers understand your typical project budget expectations</small>
              </div>

              <div className="form-group">
                <label htmlFor="project_types">Types of Projects You Commission</label>
                <textarea
                  id="project_types"
                  name="project_types"
                  value={formData.project_types}
                  onChange={handleInputChange}
                  placeholder="Describe the types of creative projects you typically commission..."
                  rows={3}
                />
                <small>Examples: Logo design, web development, content writing, photography, etc.</small>
              </div>

              <div className="form-group">
                <label htmlFor="preferred_communication">Preferred Communication Methods</label>
                <input
                  type="text"
                  id="preferred_communication"
                  name="preferred_communication"
                  value={formData.preferred_communication}
                  onChange={handleInputChange}
                  placeholder="e.g., Email, Slack, Video calls, Phone"
                />
                <small>Let freelancers know how you prefer to communicate during projects</small>
              </div>
            </div>
          )}

          {/* Client Business Registration (Optional) */}
          {formData.user_type === 'client' && formData.client_type !== 'individual' && (
            <div className="form-section" data-client-section="true">
              <h3>📋 Business Registration (Optional)</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="business_registration">Business Registration Number</label>
                  <input
                    type="text"
                    id="business_registration"
                    name="business_registration"
                    value={formData.business_registration}
                    onChange={handleInputChange}
                    placeholder="Business registration or license number"
                  />
                  <small>Optional - for business verification purposes</small>
                </div>
                <div className="form-group">
                  <label htmlFor="tax_id">Tax ID / EIN</label>
                  <input
                    type="text"
                    id="tax_id"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                    placeholder="Tax identification number"
                  />
                  <small>Optional - for tax documentation and verification</small>
                </div>
              </div>
            </div>
          )}

          {/* Achievements & Recognition */}
          <div className="form-section">
            <h3>Achievements & Recognition</h3>
            <div className="form-group">
              <label htmlFor="achievements">Awards, Recognition & Notable Achievements</label>
              <textarea
                id="achievements"
                name="achievements"
                value={formData.achievements}
                onChange={handleInputChange}
                placeholder="Share your awards, recognitions, certifications, or notable achievements..."
                rows={4}
              />
              <small>Highlight any awards, certifications, features, or professional recognition you've received</small>
            </div>
          </div>

          {/* Services & Commissions - Only for Creator and Freelancer */}
          {(formData.user_type === 'creator' || formData.user_type === 'freelancer') && (
          <div className="form-section">
            <h3>Services & Commissions</h3>
            <div className="form-group">
              <label htmlFor="services_offered">Services & Commissions Offered</label>
              <textarea
                id="services_offered"
                name="services_offered"
                value={formData.services_offered}
                onChange={handleInputChange}
                placeholder="Describe the services and commissions you offer, including pricing and process details..."
                rows={4}
              />
              <small>Detail what services you provide, types of commissions you accept, pricing ranges, or any special offerings</small>
            </div>

            {/* Experience Fields */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="years_experience">Years of Experience</label>
                <input
                  type="number"
                  id="years_experience"
                  name="years_experience"
                  value={formData.years_experience}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  placeholder="0"
                />
                <small>Total years of professional experience in your field</small>
              </div>

              <div className="form-group">
                <label htmlFor="experience_level">Experience Level</label>
                <select
                  id="experience_level"
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleInputChange}
                >
                  <option value="beginner">Beginner (0-2 years)</option>
                  <option value="intermediate">Intermediate (3-5 years)</option>
                  <option value="advanced">Advanced (6-10 years)</option>
                  <option value="expert">Expert (10+ years)</option>
                </select>
                <small>Your overall skill and experience level</small>
              </div>
            </div>
          </div>
          )}

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
