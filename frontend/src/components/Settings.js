import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { userAPI } from '../api';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile Settings
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    avatar: null,
    location: '',
    phone: '',
    website: ''
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Account Preferences
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    marketing_emails: false,
    sms_notifications: false,
    privacy_profile: 'public', // public, private, contacts
    show_email: false,
    show_phone: false,
    two_factor_enabled: false
  });

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.userprofile?.bio || '',
        avatar: user.userprofile?.avatar || null,
        location: user.userprofile?.location || '',
        phone: user.userprofile?.phone || '',
        website: user.userprofile?.website || ''
      });
      
      setPreferences({
        email_notifications: user.userprofile?.email_notifications ?? true,
        marketing_emails: user.userprofile?.marketing_emails ?? false,
        sms_notifications: user.userprofile?.sms_notifications ?? false,
        privacy_profile: user.userprofile?.privacy_profile || 'public',
        show_email: user.userprofile?.show_email ?? false,
        show_phone: user.userprofile?.show_phone ?? false,
        two_factor_enabled: user.userprofile?.two_factor_enabled ?? false
      });
    }
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      
      // Add user fields
      formData.append('first_name', profileData.first_name);
      formData.append('last_name', profileData.last_name);
      formData.append('email', profileData.email);
      
      // Add profile fields
      formData.append('bio', profileData.bio);
      formData.append('location', profileData.location);
      formData.append('phone', profileData.phone);
      formData.append('website', profileData.website);
      
      // Add avatar if selected
      if (profileData.avatar && typeof profileData.avatar !== 'string') {
        formData.append('avatar', profileData.avatar);
      }

      const response = await userAPI.updateProfile(formData);
      
      if (response.data) {
        await updateUser(); // Refresh user data in context
        showMessage('success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage('error', 'New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      showMessage('error', 'Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      await userAPI.changePassword({
        old_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      showMessage('success', 'Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      showMessage('error', error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userAPI.updatePreferences(preferences);
      await updateUser(); // Refresh user data
      showMessage('success', 'Preferences updated successfully!');
    } catch (error) {
      console.error('Preferences update error:', error);
      showMessage('error', error.response?.data?.detail || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      const doubleConfirm = window.confirm(
        'This will permanently delete all your data. Type "DELETE" to confirm.'
      );
      
      if (doubleConfirm) {
        try {
          setLoading(true);
          await userAPI.deleteAccount();
          showMessage('success', 'Account deleted successfully');
          // Logout and redirect will be handled by the API response
        } catch (error) {
          console.error('Account deletion error:', error);
          showMessage('error', error.response?.data?.detail || 'Failed to delete account');
          setLoading(false);
        }
      }
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('error', 'Image size must be less than 5MB');
        return;
      }
      setProfileData({ ...profileData, avatar: file });
    }
  };

  return (
    <div className="settings-page">
      <div className="container">
        <div className="settings-header">
          <h1>Account Settings</h1>
          <p>Manage your account preferences and security settings</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-container">
          {/* Settings Navigation */}
          <nav className="settings-nav">
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span>
              Profile Information
            </button>
            <button
              className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <span className="nav-icon">🔒</span>
              Password & Security
            </button>
            <button
              className={`nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <span className="nav-icon">⚙️</span>
              Preferences
            </button>
            <button
              className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <span className="nav-icon">🗑️</span>
              Account Management
            </button>
          </nav>

          {/* Settings Content */}
          <div className="settings-content">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="settings-section">
                <h2>Profile Information</h2>
                <p>Update your personal information and profile details</p>
                
                <form onSubmit={handleProfileSubmit} className="settings-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="first_name">First Name</label>
                      <input
                        type="text"
                        id="first_name"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="last_name">Last Name</label>
                      <input
                        type="text"
                        id="last_name"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell others about yourself..."
                      rows={4}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="location">Location</label>
                      <input
                        type="text"
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+211 XXX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="website">Website</label>
                    <input
                      type="url"
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="avatar">Profile Picture</label>
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    <small>Maximum file size: 5MB. Supported formats: JPG, PNG, GIF</small>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            )}

            {/* Password & Security Tab */}
            {activeTab === 'password' && (
              <div className="settings-section">
                <h2>Password & Security</h2>
                <p>Keep your account secure with a strong password</p>
                
                <form onSubmit={handlePasswordSubmit} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="current_password">Current Password</label>
                    <input
                      type="password"
                      id="current_password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="new_password">New Password</label>
                    <input
                      type="password"
                      id="new_password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <small>Password must be at least 8 characters long</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm_password">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>

                <div className="security-options">
                  <h3>Additional Security</h3>
                  <div className="security-item">
                    <div className="security-info">
                      <h4>Two-Factor Authentication</h4>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <button 
                      className={`btn ${preferences.two_factor_enabled ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => showMessage('info', 'Two-factor authentication coming soon!')}
                    >
                      {preferences.two_factor_enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="settings-section">
                <h2>Preferences</h2>
                <p>Customize your VikraHub experience</p>
                
                <form onSubmit={handlePreferencesSubmit} className="settings-form">
                  <div className="preference-group">
                    <h3>Notifications</h3>
                    
                    <div className="checkbox-group">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={preferences.email_notifications}
                          onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                        />
                        <span>Email notifications</span>
                        <small>Receive updates about your account and activities</small>
                      </label>

                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={preferences.marketing_emails}
                          onChange={(e) => setPreferences({ ...preferences, marketing_emails: e.target.checked })}
                        />
                        <span>Marketing emails</span>
                        <small>Receive updates about new features and promotions</small>
                      </label>

                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={preferences.sms_notifications}
                          onChange={(e) => setPreferences({ ...preferences, sms_notifications: e.target.checked })}
                        />
                        <span>SMS notifications</span>
                        <small>Receive important updates via text message</small>
                      </label>
                    </div>
                  </div>

                  <div className="preference-group">
                    <h3>Privacy</h3>
                    
                    <div className="form-group">
                      <label htmlFor="privacy_profile">Profile Visibility</label>
                      <select
                        id="privacy_profile"
                        value={preferences.privacy_profile}
                        onChange={(e) => setPreferences({ ...preferences, privacy_profile: e.target.value })}
                      >
                        <option value="public">Public - Anyone can view your profile</option>
                        <option value="private">Private - Only you can view your profile</option>
                        <option value="contacts">Contacts - Only your connections can view</option>
                      </select>
                    </div>

                    <div className="checkbox-group">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={preferences.show_email}
                          onChange={(e) => setPreferences({ ...preferences, show_email: e.target.checked })}
                        />
                        <span>Show email address on profile</span>
                      </label>

                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={preferences.show_phone}
                          onChange={(e) => setPreferences({ ...preferences, show_phone: e.target.checked })}
                        />
                        <span>Show phone number on profile</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </form>
              </div>
            )}

            {/* Account Management Tab */}
            {activeTab === 'account' && (
              <div className="settings-section">
                <h2>Account Management</h2>
                <p>Manage your account status and data</p>
                
                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete Account</h4>
                      <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                    </div>
                    <button 
                      className="btn btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={loading}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>

                <div className="account-info">
                  <h3>Account Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Username:</label>
                      <span>{user?.username}</span>
                    </div>
                    <div className="info-item">
                      <label>Account Type:</label>
                      <span>{user?.user_type || 'Standard'}</span>
                    </div>
                    <div className="info-item">
                      <label>Member Since:</label>
                      <span>{new Date(user?.date_joined).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <label>Last Login:</label>
                      <span>{user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
