import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { userAPI } from '../api';
import EditProfile from './EditProfile';
import './ClientProfile.css';

const ClientProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await userAPI.getMyProfile();
      console.log('Client profile data received:', response.data);
      setProfile(response.data);
      
      // Set client-specific data if available
      if (response.data.client_profile) {
        setClientProfile(response.data.client_profile);
      }
    } catch (error) {
      console.error('Failed to fetch client profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    setEditing(false);
    console.log('Client profile updated successfully:', updatedProfile);
  };

  // Sample project data (replace with real data from backend)
  const postedProjects = [
    {
      id: 1,
      title: "Brand Identity Design",
      description: "Looking for a creative designer to develop a complete brand identity for our tech startup.",
      budget: "$1,500 - $3,000",
      status: "Completed",
      datePosted: "2024-01-15",
      applications: 12,
      selectedFreelancer: "Maduot Chongo"
    },
    {
      id: 2,
      title: "Website Photography",
      description: "Need professional photography for our company website and marketing materials.",
      budget: "$500 - $1,000",
      status: "In Progress",
      datePosted: "2024-02-01",
      applications: 8,
      selectedFreelancer: "Akon Peter"
    },
    {
      id: 3,
      title: "Content Writing Project",
      description: "Seeking a writer for blog posts and website content about South Sudan culture.",
      budget: "$300 - $800",
      status: "Open",
      datePosted: "2024-02-10",
      applications: 15,
      selectedFreelancer: null
    }
  ];

  // Sample testimonials from freelancers
  const testimonials = [
    {
      name: "Maduot Chongo",
      role: "Graphic Designer",
      project: "Brand Identity Design",
      text: "Great client! Clear communication and prompt payments. The project was well-defined and they were open to creative suggestions.",
      rating: 5,
      avatar: "/assets/testimonials/maduot.jpg"
    },
    {
      name: "Akon Peter",
      role: "Photographer",
      project: "Website Photography",
      text: "Professional and organized client. They provided excellent direction and were flexible with scheduling.",
      rating: 5,
      avatar: "/assets/testimonials/akon.jpg"
    }
  ];

  if (!user) {
    return (
      <div className="client-profile-container">
        <div className="profile-error">
          <h2>Please Log In</h2>
          <p>You need to be logged in to view your client profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="client-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="client-profile-container">
        <div className="profile-error">
          <h2>Profile Not Found</h2>
          <p>Unable to load client profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-profile-page">
      {/* Header Section */}
      <div className="client-header-section">
        <div className="client-header-background">
          <img 
            src={profile?.cover_photo || '/assets/client-cover-default.jpg'} 
            alt="Cover"
            className="header-background-image"
          />
          <div className="header-overlay"></div>
        </div>
        
        <div className="client-header-content">
          <div className="client-logo-section">
            {/* Company Logo or Personal Photo */}
            <div className="logo-container">
              <img 
                src={profile?.avatar || '/assets/default-company-logo.png'} 
                alt={clientProfile?.company_name || `${profile?.user?.first_name || 'Client'}'s profile`}
                className="client-logo"
                onError={(e) => {
                  e.target.src = '/assets/default-company-logo.png';
                }}
              />
              {clientProfile?.is_verified && (
                <div className="verified-badge">
                  <span className="verified-icon">✓</span>
                  <span className="verified-text">Verified Client</span>
                </div>
              )}
            </div>

            {/* Name/Organization Name */}
            <div className="client-info">
              <h1 className="client-name">
                {clientProfile?.company_name || 
                 (profile?.user?.first_name && profile?.user?.last_name 
                   ? `${profile.user.first_name} ${profile.user.last_name}`
                   : profile?.user?.username || 'Client')}
              </h1>
              
              {/* Industry/Type */}
              <p className="client-type">
                {clientProfile?.industry || 
                 (clientProfile?.client_type ? 
                   clientProfile.client_type.charAt(0).toUpperCase() + clientProfile.client_type.slice(1) : 
                   'Professional Client')}
              </p>

              {/* Location */}
              <p className="client-location">
                📍 {profile?.location || clientProfile?.business_address || 'Location not specified'}
              </p>

              {/* Company Size (if business) */}
              {clientProfile?.company_size && clientProfile?.client_type === 'business' && (
                <p className="company-size">
                  🏢 {clientProfile.company_size.charAt(0).toUpperCase() + clientProfile.company_size.slice(1)} Company
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="client-actions">
            <button className="btn-primary">Send Proposal</button>
            <button className="btn-secondary">Message</button>
            <button 
              className="btn-edit"
              onClick={() => setEditing(!editing)}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="client-nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects ({postedProjects.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({testimonials.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Contact
        </button>
      </div>

      {/* Content Sections */}
      <div className="client-content-container">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="client-overview">
            {/* Bio/About Section */}
            <div className="client-section">
              <h2>About {clientProfile?.company_name || 'Us'}</h2>
              <div className="about-content">
                {profile?.bio ? (
                  <p className="client-bio">{profile.bio}</p>
                ) : (
                  <p className="no-bio">
                    This client hasn't added company information yet. 
                    Update your profile to share more about your organization and project needs.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="client-section">
              <h2>Project Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{clientProfile?.projects_posted || 0}</div>
                  <div className="stat-label">Projects Posted</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{clientProfile?.projects_completed || 0}</div>
                  <div className="stat-label">Projects Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {clientProfile?.completion_rate ? `${Math.round(clientProfile.completion_rate)}%` : '0%'}
                  </div>
                  <div className="stat-label">Success Rate</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    ${clientProfile?.total_spent ? clientProfile.total_spent.toLocaleString() : '0'}
                  </div>
                  <div className="stat-label">Total Investment</div>
                </div>
              </div>
            </div>

            {/* Project Preferences */}
            {(clientProfile?.project_types || clientProfile?.typical_budget_range) && (
              <div className="client-section">
                <h2>Project Preferences</h2>
                <div className="preferences-grid">
                  {clientProfile?.project_types && (
                    <div className="preference-item">
                      <h4>🎯 Typical Projects</h4>
                      <p>{clientProfile.project_types}</p>
                    </div>
                  )}
                  {clientProfile?.typical_budget_range && (
                    <div className="preference-item">
                      <h4>💰 Budget Range</h4>
                      <p>{clientProfile.typical_budget_range}</p>
                    </div>
                  )}
                  {clientProfile?.preferred_communication && (
                    <div className="preference-item">
                      <h4>💬 Communication</h4>
                      <p>{clientProfile.preferred_communication}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Links */}
            {(profile?.website || profile?.linkedin || profile?.instagram || profile?.facebook) && (
              <div className="client-section">
                <h2>Connect With Us</h2>
                <div className="social-links">
                  {profile?.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="social-link">
                      🌐 Website
                    </a>
                  )}
                  {profile?.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                      💼 LinkedIn
                    </a>
                  )}
                  {profile?.instagram && (
                    <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                      📷 Instagram
                    </a>
                  )}
                  {profile?.facebook && (
                    <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                      📘 Facebook
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="client-projects">
            <div className="client-section">
              <h2>Current & Past Projects</h2>
              <div className="projects-grid">
                {postedProjects.map((project) => (
                  <div key={project.id} className="project-card">
                    <div className="project-header">
                      <h3>{project.title}</h3>
                      <span className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p className="project-description">{project.description}</p>
                    
                    <div className="project-details">
                      <div className="project-budget">
                        <span className="detail-label">Budget:</span>
                        <span className="detail-value">{project.budget}</span>
                      </div>
                      <div className="project-date">
                        <span className="detail-label">Posted:</span>
                        <span className="detail-value">{new Date(project.datePosted).toLocaleDateString()}</span>
                      </div>
                      <div className="project-applications">
                        <span className="detail-label">Applications:</span>
                        <span className="detail-value">{project.applications}</span>
                      </div>
                      {project.selectedFreelancer && (
                        <div className="project-freelancer">
                          <span className="detail-label">Freelancer:</span>
                          <span className="detail-value">{project.selectedFreelancer}</span>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="btn-view-project"
                      onClick={() => setSelectedProject(project)}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
              
              {postedProjects.length === 0 && (
                <div className="no-projects">
                  <div className="no-content-icon">📋</div>
                  <h3>No Projects Yet</h3>
                  <p>Start by posting your first project to find talented freelancers.</p>
                  <button className="btn-post-project">Post Your First Project</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="client-reviews">
            <div className="client-section">
              <h2>Freelancer Reviews</h2>
              <p className="reviews-intro">What freelancers say about working with us:</p>
              
              <div className="testimonials-grid">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-card">
                    <div className="testimonial-header">
                      <img src={testimonial.avatar} alt={testimonial.name} className="testimonial-avatar" />
                      <div className="testimonial-info">
                        <h4>{testimonial.name}</h4>
                        <p className="testimonial-role">{testimonial.role}</p>
                        <div className="testimonial-rating">
                          {'⭐'.repeat(testimonial.rating)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="testimonial-content">
                      <p>"{testimonial.text}"</p>
                      <div className="testimonial-project">
                        Project: <strong>{testimonial.project}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {testimonials.length === 0 && (
                <div className="no-reviews">
                  <div className="no-content-icon">⭐</div>
                  <h3>No Reviews Yet</h3>
                  <p>Complete projects with freelancers to start receiving reviews.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="client-contact">
            <div className="client-section">
              <h2>Get In Touch</h2>
              
              <div className="contact-grid">
                <div className="contact-info">
                  <h3>Contact Information</h3>
                  
                  {clientProfile?.contact_person && (
                    <div className="contact-item">
                      <span className="contact-icon">👤</span>
                      <div>
                        <strong>Contact Person</strong>
                        <p>{clientProfile.contact_person}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <div>
                      <strong>Email</strong>
                      <p>{profile?.user?.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  {clientProfile?.phone_number && (
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <div>
                        <strong>Phone</strong>
                        <p>{clientProfile.phone_number}</p>
                      </div>
                    </div>
                  )}
                  
                  {clientProfile?.business_address && (
                    <div className="contact-item">
                      <span className="contact-icon">📍</span>
                      <div>
                        <strong>Address</strong>
                        <p>{clientProfile.business_address}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="contact-actions">
                  <h3>Work With Us</h3>
                  <p>Ready to collaborate on your next project?</p>
                  
                  <div className="contact-buttons">
                    <button className="btn-contact-primary">Send Proposal</button>
                    <button className="btn-contact-secondary">Start a Message</button>
                    <button className="btn-contact-tertiary">View Open Projects</button>
                  </div>
                  
                  <div className="response-info">
                    <p>
                      <span className="response-icon">⚡</span>
                      Usually responds within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project Modal */}
      {selectedProject && (
        <div className="project-modal" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProject(null)}>×</button>
            <h3>{selectedProject.title}</h3>
            <span className={`status-badge ${selectedProject.status.toLowerCase().replace(' ', '-')}`}>
              {selectedProject.status}
            </span>
            
            <div className="modal-project-details">
              <p><strong>Description:</strong> {selectedProject.description}</p>
              <p><strong>Budget:</strong> {selectedProject.budget}</p>
              <p><strong>Posted:</strong> {new Date(selectedProject.datePosted).toLocaleDateString()}</p>
              <p><strong>Applications:</strong> {selectedProject.applications}</p>
              {selectedProject.selectedFreelancer && (
                <p><strong>Selected Freelancer:</strong> {selectedProject.selectedFreelancer}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editing && (
        <EditProfile 
          onClose={() => setEditing(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default ClientProfile;
