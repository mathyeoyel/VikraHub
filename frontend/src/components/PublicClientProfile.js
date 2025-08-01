import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicProfileAPI, userAPI, followAPI } from '../api';
import { useAuth } from './Auth/AuthContext';
import notificationService from '../services/notificationService';
import './PublicClientProfile.css';

const PublicClientProfile = ({ 
  profile: initialProfile = null,
  username: propUsername = null,
  isFollowing: propIsFollowing = false,
  setIsFollowing: propSetIsFollowing = null,
  followerCount: propFollowerCount = 0,
  followingCount: propFollowingCount = 0 
}) => {
  const { username: paramUsername } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Use props if available, otherwise use local state
  const username = propUsername || paramUsername;
  const [profile, setProfile] = useState(initialProfile);
  const [clientProfile, setClientProfile] = useState(null);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [followStatsLoading, setFollowStatsLoading] = useState(false);
  
  // Use props for follow state if passed, otherwise local state
  const [localIsFollowing, setLocalIsFollowing] = useState(propIsFollowing);
  const [localFollowerCount, setLocalFollowerCount] = useState(propFollowerCount);
  const [localFollowingCount, setLocalFollowingCount] = useState(propFollowingCount);
  
  const isFollowing = propSetIsFollowing ? propIsFollowing : localIsFollowing;
  const followerCount = propSetIsFollowing ? propFollowerCount : localFollowerCount;
  const followingCount = propSetIsFollowing ? propFollowingCount : localFollowingCount;
  
  const setIsFollowing = propSetIsFollowing || setLocalIsFollowing;
  const setFollowerCount = propSetIsFollowing ? (() => {}) : setLocalFollowerCount;
  const setFollowingCount = propSetIsFollowing ? (() => {}) : setLocalFollowingCount;

  useEffect(() => {
    // Skip fetching if we already have profile data from props
    if (initialProfile) {
      setProfile(initialProfile);
      if (initialProfile.client_profile) {
        setClientProfile(initialProfile.client_profile);
      }
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await publicProfileAPI.getByUsername(username);
        setProfile(response.data);
        
        // Set client-specific data if available
        if (response.data.client_profile) {
          setClientProfile(response.data.client_profile);
        }
        
        // Check if the profile response already contains follow information
        if (response.data.followers_count !== undefined && 
            response.data.is_following !== undefined) {
          // Use follow data from profile response
          setLocalFollowerCount(response.data.followers_count || 0);
          setLocalIsFollowing(response.data.is_following || false);
          console.log('Using follow data from client profile response:', {
            followers: response.data.followers_count,
            isFollowing: response.data.is_following
          });
        } else {
          // Fallback to separate follow stats API call
          console.log('Follow data not in client profile response, fetching separately...');
          await fetchFollowStats(username);
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Client profile not found');
      } finally {
        setLoading(false);
      }
    };

    const fetchFollowStats = async (username) => {
      try {
        setFollowStatsLoading(true);
        const response = await userAPI.getFollowStats(username);
        setLocalFollowerCount(response.data?.followers_count || 0);
        setLocalIsFollowing(response.data?.is_following || false);
      } catch (err) {
        console.warn('Failed to fetch follow stats:', err);
        // Keep default values on error
        setLocalFollowerCount(0);
        setLocalIsFollowing(false);
      } finally {
        setFollowStatsLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, initialProfile]);

  // Sample projects data (in real app, this would come from backend)
  const sampleProjects = [
    {
      id: 1,
      title: "Brand Identity Design",
      description: "Complete brand identity for tech startup",
      budget: "$1,500 - $3,000",
      status: "Completed",
      datePosted: "2024-01-15",
      applications: 12,
      selectedFreelancer: "Maduot Chongo"
    },
    {
      id: 2,
      title: "Website Photography",
      description: "Professional photography for company website",
      budget: "$500 - $1,000",
      status: "In Progress",
      datePosted: "2024-02-01",
      applications: 8,
      selectedFreelancer: "Akon Peter"
    },
    {
      id: 3,
      title: "Content Writing Project",
      description: "Blog posts about South Sudan culture",
      budget: "$300 - $800",
      status: "Open",
      datePosted: "2024-02-10",
      applications: 15,
      selectedFreelancer: null
    }
  ];

  // Sample testimonials from freelancers
  const sampleTestimonials = [
    {
      name: "Maduot Chongo",
      role: "Graphic Designer",
      project: "Brand Identity Design",
      text: "Excellent client! Clear communication, prompt payments, and great project definition.",
      rating: 5,
      avatar: "/assets/testimonials/maduot.jpg"
    },
    {
      name: "Akon Peter",
      role: "Photographer",
      project: "Website Photography",
      text: "Very professional and organized. Flexible with scheduling and provided great direction.",
      rating: 5,
      avatar: "/assets/testimonials/akon.jpg"
    }
  ];

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
          if (propSetIsFollowing) {
            // Update parent component's follower count if using parent state
            const currentCount = propFollowerCount;
            // Note: We can't directly update parent's followerCount from here
            // The parent component should handle this via its own follow handlers
          } else {
            setFollowerCount(updatedProfile.followers_count || 0);
          }
        } else {
          // Fallback to manual state update
          setIsFollowing(false);
          if (!propSetIsFollowing) {
            setFollowerCount(prev => Math.max(0, prev - 1));
          }
        }
      } else {
        // Use enhanced follow with profile refresh
        const { followResult, updatedProfile } = await followAPI.followWithRefresh(profile.user.id, username);
        console.log('Follow response:', followResult);
        
        // Update state from refreshed profile data if available
        if (updatedProfile) {
          setIsFollowing(updatedProfile.is_following || false);
          if (propSetIsFollowing) {
            // Update parent component's follower count if using parent state
            const currentCount = propFollowerCount;
            // Note: We can't directly update parent's followerCount from here
            // The parent component should handle this via its own follow handlers
          } else {
            setFollowerCount(updatedProfile.followers_count || 0);
          }
        } else {
          // Fallback to manual state update
          setIsFollowing(true);
          if (!propSetIsFollowing) {
            setFollowerCount(prev => prev + 1);
          }
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
          recipientName: profile?.full_name || profile?.company_name || username
        } 
      });
    } catch (error) {
      console.error('❌ Error handling message action:', error);
      alert('Failed to open messages. Please try again.');
    }
  };

  const handleProposal = () => {
    alert('Proposal submission feature coming soon!');
  };

  if (loading) {
    return (
      <div className="public-client-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="public-client-container">
        <div className="profile-error">
          <h2>Profile Not Found</h2>
          <p>{error || 'Unable to load client profile information.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-client-page">
      {/* Header Section */}
      <div className="public-client-header">
        <div className="header-background">
          <img 
            src={profile?.cover_photo || '/assets/client-cover-default.jpg'} 
            alt="Cover"
            className="header-bg-image"
          />
          <div className="header-overlay"></div>
        </div>
        
        <div className="header-content">
          <div className="client-info-section">
            {/* Company Logo or Personal Photo */}
            <div className="client-logo-container">
              <img 
                src={profile?.avatar || '/assets/default-company-logo.png'} 
                alt={clientProfile?.company_name || `${profile?.full_name || 'Client'}'s profile`}
                className="client-logo-public"
                onError={(e) => {
                  e.target.src = '/assets/default-company-logo.png';
                }}
              />
              {clientProfile?.is_verified && (
                <div className="verified-badge-public">
                  <span className="verified-icon">✓</span>
                  <span className="verified-text">Verified</span>
                </div>
              )}
            </div>

            {/* Client Information */}
            <div className="client-details">
              <h1 className="client-name-public">
                {clientProfile?.company_name || profile?.full_name || profile?.user?.username || 'Client'}
              </h1>
              
              {/* Industry/Type */}
              <p className="client-type-public">
                {clientProfile?.industry || 
                 (clientProfile?.client_type_display || 'Professional Client')}
              </p>

              {/* Location */}
              <p className="client-location-public">
                📍 {profile?.location || clientProfile?.business_address || 'Location not specified'}
              </p>

              {/* Company Size (if business) */}
              {clientProfile?.company_size && clientProfile?.client_type === 'business' && (
                <p className="company-size-public">
                  🏢 {clientProfile.company_size.charAt(0).toUpperCase() + clientProfile.company_size.slice(1)} Company
                </p>
              )}

              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-item">
                  <span className="stat-number">{clientProfile?.projects_posted || 0}</span>
                  <span className="stat-label">Projects</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{Math.round(clientProfile?.completion_rate || 0)}%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {followStatsLoading ? '...' : followerCount}
                  </span>
                  <span className="stat-label">Followers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="client-actions-public">
            <button className="btn-primary-public" onClick={handleProposal}>
              Send Proposal
            </button>
            {isAuthenticated && user?.username !== username && (
              <button 
                className="btn-secondary-public"
                onClick={handleMessage}
                title={`Send a message to ${profile?.full_name || username}`}
              >
                💬 Message
              </button>
            )}
            {isAuthenticated && user?.username !== username && (
              <button 
                className={`btn-follow-public ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="public-client-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects ({sampleProjects.length})
        </button>
        <button 
          className={`nav-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({sampleTestimonials.length})
        </button>
      </div>

      {/* Content Sections */}
      <div className="public-client-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="content-grid">
              {/* About Section */}
              <div className="content-section">
                <h2>About {clientProfile?.company_name || 'Client'}</h2>
                {profile?.bio ? (
                  <p className="about-text">{profile.bio}</p>
                ) : (
                  <p className="no-content">This client hasn't added information about their organization yet.</p>
                )}
              </div>

              {/* Project Preferences */}
              {(clientProfile?.project_types || clientProfile?.typical_budget_range) && (
                <div className="content-section">
                  <h2>Project Preferences</h2>
                  <div className="preferences-list">
                    {clientProfile?.project_types && (
                      <div className="preference-item">
                        <strong>🎯 Project Types:</strong>
                        <p>{clientProfile.project_types}</p>
                      </div>
                    )}
                    {clientProfile?.typical_budget_range && (
                      <div className="preference-item">
                        <strong>💰 Budget Range:</strong>
                        <p>{clientProfile.typical_budget_range}</p>
                      </div>
                    )}
                    {clientProfile?.preferred_communication && (
                      <div className="preference-item">
                        <strong>💬 Communication:</strong>
                        <p>{clientProfile.preferred_communication}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Business Information */}
              <div className="content-section">
                <h2>Business Information</h2>
                <div className="business-info">
                  {clientProfile?.client_type && (
                    <div className="info-item">
                      <strong>Type:</strong> {clientProfile.client_type_display}
                    </div>
                  )}
                  {clientProfile?.industry && (
                    <div className="info-item">
                      <strong>Industry:</strong> {clientProfile.industry}
                    </div>
                  )}
                  {clientProfile?.company_size && (
                    <div className="info-item">
                      <strong>Size:</strong> {clientProfile.company_size.charAt(0).toUpperCase() + clientProfile.company_size.slice(1)}
                    </div>
                  )}
                  <div className="info-item">
                    <strong>Member Since:</strong> {new Date(profile.member_since).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {(profile?.website || profile?.linkedin || profile?.instagram || profile?.facebook) && (
                <div className="content-section">
                  <h2>Connect</h2>
                  <div className="social-links-public">
                    {profile?.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="social-link-public">
                        🌐 Website
                      </a>
                    )}
                    {profile?.linkedin && (
                      <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="social-link-public">
                        💼 LinkedIn
                      </a>
                    )}
                    {profile?.instagram && (
                      <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="social-link-public">
                        📷 Instagram
                      </a>
                    )}
                    {profile?.facebook && (
                      <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="social-link-public">
                        📘 Facebook
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="projects-content">
            <div className="content-section">
              <h2>Recent Projects</h2>
              <div className="projects-grid-public">
                {sampleProjects.map((project) => (
                  <div key={project.id} className="project-card-public">
                    <div className="project-header-public">
                      <h3>{project.title}</h3>
                      <span className={`status-badge-public ${project.status.toLowerCase().replace(' ', '-')}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p className="project-description-public">{project.description}</p>
                    
                    <div className="project-meta-public">
                      <div className="meta-item">
                        <strong>Budget:</strong> {project.budget}
                      </div>
                      <div className="meta-item">
                        <strong>Posted:</strong> {new Date(project.datePosted).toLocaleDateString()}
                      </div>
                      <div className="meta-item">
                        <strong>Applications:</strong> {project.applications}
                      </div>
                      {project.selectedFreelancer && (
                        <div className="meta-item">
                          <strong>Working with:</strong> {project.selectedFreelancer}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {sampleProjects.length === 0 && (
                <div className="no-content-state">
                  <div className="no-content-icon">📋</div>
                  <h3>No Public Projects</h3>
                  <p>This client hasn't made any projects public yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="reviews-content">
            <div className="content-section">
              <h2>Freelancer Reviews</h2>
              <p className="reviews-intro">What freelancers say about working with this client:</p>
              
              <div className="testimonials-grid-public">
                {sampleTestimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-card-public">
                    <div className="testimonial-header-public">
                      <img src={testimonial.avatar} alt={testimonial.name} className="testimonial-avatar-public" />
                      <div className="testimonial-info-public">
                        <h4>{testimonial.name}</h4>
                        <p className="testimonial-role-public">{testimonial.role}</p>
                        <div className="testimonial-rating-public">
                          {'⭐'.repeat(testimonial.rating)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="testimonial-content-public">
                      <p>"{testimonial.text}"</p>
                      <div className="testimonial-project-public">
                        Project: <strong>{testimonial.project}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {sampleTestimonials.length === 0 && (
                <div className="no-content-state">
                  <div className="no-content-icon">⭐</div>
                  <h3>No Reviews Yet</h3>
                  <p>This client hasn't received any public reviews yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Call to Action Section */}
      <div className="cta-section-public">
        <div className="cta-content-public">
          <h2>Work With {clientProfile?.company_name || profile?.full_name || 'This Client'}</h2>
          <p>
            Interested in collaborating? Send a proposal or message to start the conversation.
          </p>
          <div className="cta-buttons-public">
            <button className="btn-cta-primary" onClick={handleProposal}>
              Send Proposal
            </button>
            <button className="btn-cta-secondary" onClick={handleMessage}>
              Start Conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicClientProfile;
