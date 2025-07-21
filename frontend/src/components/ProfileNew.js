import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { userAPI } from '../api';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activePortfolioTab, setActivePortfolioTab] = useState('All');
  const [selectedWork, setSelectedWork] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await userAPI.getMyProfile();
      console.log('Profile data received:', response.data);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock portfolio data - in real app, this would come from API
  const portfolioWorks = [
    {
      id: 1,
      title: "Heritage Photography Series",
      category: "Photography",
      image: "/assets/portfolio/heritage-1.jpg",
      description: "Capturing the beauty and resilience of South Sudanese culture through portrait photography.",
      tags: ["Portrait", "Culture", "Documentary"]
    },
    {
      id: 2,
      title: "Digital Art Collection",
      category: "Digital Art",
      image: "/assets/portfolio/digital-1.jpg",
      description: "Modern interpretations of traditional South Sudanese patterns and symbols.",
      tags: ["Digital", "Traditional", "Modern"]
    },
    {
      id: 3,
      title: "Brand Identity Design",
      category: "Design",
      image: "/assets/portfolio/brand-1.jpg",
      description: "Creating visual identities that celebrate local businesses and entrepreneurs.",
      tags: ["Branding", "Logo", "Identity"]
    },
    {
      id: 4,
      title: "Cultural Festival Documentation",
      category: "Photography",
      image: "/assets/portfolio/festival-1.jpg",
      description: "Documenting traditional celebrations and cultural events across South Sudan.",
      tags: ["Events", "Culture", "Community"]
    },
    {
      id: 5,
      title: "Modern Logo Designs",
      category: "Design",
      image: "/assets/portfolio/logo-1.jpg",
      description: "Contemporary logo designs for South Sudanese businesses and organizations.",
      tags: ["Logo", "Modern", "Business"]
    },
    {
      id: 6,
      title: "Digital Illustrations",
      category: "Digital Art",
      image: "/assets/portfolio/illustration-1.jpg",
      description: "Digital artwork celebrating South Sudanese stories and traditions.",
      tags: ["Illustration", "Stories", "Digital"]
    }
  ];

  const socialLinks = [
    { platform: 'Instagram', url: '#', icon: '📷' },
    { platform: 'Facebook', url: '#', icon: '📘' },
    { platform: 'Twitter', url: '#', icon: '🐦' },
    { platform: 'LinkedIn', url: '#', icon: '💼' },
    { platform: 'WhatsApp', url: '#', icon: '📱' }
  ];

  const services = [
    { name: "Portrait Photography", price: "From $50", description: "Professional portrait sessions" },
    { name: "Event Photography", price: "From $150", description: "Weddings, celebrations, corporate events" },
    { name: "Brand Design", price: "From $100", description: "Logo and brand identity creation" },
    { name: "Digital Art Commission", price: "From $75", description: "Custom digital artwork" }
  ];

  const achievements = [
    { title: "Featured Creator", year: "2024", description: "VikraHub Creator of the Month" },
    { title: "Cultural Heritage Award", year: "2023", description: "South Sudan Arts Council" },
    { title: "Photography Exhibition", year: "2023", description: "Juba Contemporary Arts Center" }
  ];

  const testimonials = [
    {
      name: "Sarah Akech",
      role: "Business Owner",
      text: "Amazing work! They captured the essence of our brand perfectly.",
      avatar: "/assets/testimonials/sarah.jpg"
    },
    {
      name: "John Marial",
      role: "Event Coordinator", 
      text: "Professional, creative, and delivered beyond our expectations.",
      avatar: "/assets/testimonials/john.jpg"
    }
  ];

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
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
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

  const filteredWorks = activePortfolioTab === 'All' 
    ? portfolioWorks 
    : portfolioWorks.filter(work => work.category === activePortfolioTab);

  return (
    <div className="profile-page">
      {/* Cover Banner */}
      <div className="cover-banner">
        <img 
          src={profile?.cover_image || '/assets/default-cover.jpg'} 
          alt="Cover"
          className="cover-image"
        />
        <div className="cover-overlay"></div>
      </div>

      {/* Profile Header */}
      <div className="profile-header-section">
        <div className="profile-container">
          <div className="profile-header-content">
            <div className="profile-picture-container">
              <img 
                src={profile?.avatar || '/assets/default-avatar.png'} 
                alt={`${profile?.user?.first_name || 'User'}'s profile`}
                className="profile-picture-large"
                onError={(e) => {
                  e.target.src = '/assets/default-avatar.png';
                }}
              />
              <div className="online-indicator"></div>
            </div>
            
            <div className="profile-info-header">
              <h1 className="profile-name">
                {profile?.user?.first_name || ''} {profile?.user?.last_name || ''}
              </h1>
              <p className="profile-username">@{profile?.user?.username || 'unknown'}</p>
              <p className="profile-role">{profile?.title || 'Creative Professional'}</p>
              <p className="profile-location">📍 {profile?.location || 'South Sudan'}</p>
              <p className="profile-tagline">
                {profile?.tagline || "Telling stories through creativity and celebrating our heritage"}
              </p>
            </div>

            <div className="profile-actions-header">
              <button className="btn-primary">Follow</button>
              <button className="btn-secondary">Message</button>
              <button className="btn-outline">Share</button>
              <button 
                className="btn-edit"
                onClick={() => setEditing(!editing)}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-content">
          {/* Quick Info & Socials */}
          <div className="quick-info-section">
            <div className="skills-section">
              <h3>Skills & Expertise</h3>
              <div className="skills-grid">
                {profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && 
                  profile.skills.map((skill, index) => (
                    <span key={index} className="skill-badge">{skill}</span>
                  ))
                }
                {profile?.skills && typeof profile.skills === 'string' && profile.skills.trim() && 
                  profile.skills.split(',').map((skill, index) => (
                    <span key={index} className="skill-badge">{skill.trim()}</span>
                  ))
                }
                {(!profile?.skills || (Array.isArray(profile.skills) && profile.skills.length === 0)) && (
                  <div className="skills-placeholder">
                    <span className="skill-badge">Photography</span>
                    <span className="skill-badge">Digital Art</span>
                    <span className="skill-badge">Creative Direction</span>
                  </div>
                )}
              </div>
            </div>

            <div className="social-links-section">
              <h3>Connect With Me</h3>
              <div className="social-links">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.url} 
                    className="social-link"
                    title={social.platform}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="social-icon">{social.icon}</span>
                    <span className="social-name">{social.platform}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Gallery */}
          <div className="portfolio-section">
            <div className="section-header">
              <h2>Portfolio</h2>
              <div className="portfolio-tabs">
                {['All', 'Photography', 'Design', 'Digital Art'].map(tab => (
                  <button
                    key={tab}
                    className={`tab-btn ${activePortfolioTab === tab ? 'active' : ''}`}
                    onClick={() => setActivePortfolioTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="portfolio-grid">
              {filteredWorks.map(work => (
                <div 
                  key={work.id} 
                  className="portfolio-item"
                  onClick={() => setSelectedWork(work)}
                >
                  <img src={work.image} alt={work.title} />
                  <div className="portfolio-overlay">
                    <h4>{work.title}</h4>
                    <p>{work.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* About/Story Section */}
          <div className="about-section">
            <h2>About Me</h2>
            <div className="about-content">
              <div className="bio-text">
                <p>
                  {profile?.bio || 
                    "I am a passionate creative professional from South Sudan, dedicated to telling our stories through visual art and celebrating the rich heritage of our nation. My work focuses on capturing the beauty, resilience, and spirit of our people."
                  }
                </p>
                <p>
                  Through my creative journey, I aim to bridge traditional South Sudanese culture with contemporary artistic expression, 
                  creating work that resonates both locally and globally. Every project is an opportunity to showcase the incredible 
                  talent and potential that exists within our communities.
                </p>
              </div>
              
              <div className="creative-statement">
                <h3>Creative Vision</h3>
                <blockquote>
                  "Art is the universal language that connects us all. Through my work, I strive to share the stories, 
                  dreams, and aspirations of South Sudanese people with the world."
                </blockquote>
              </div>
            </div>
          </div>

          {/* Achievements & Highlights */}
          <div className="achievements-section">
            <h2>Achievements & Recognition</h2>
            <div className="achievements-grid">
              {achievements.map((achievement, index) => (
                <div key={index} className="achievement-card">
                  <div className="achievement-year">{achievement.year}</div>
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Services Offered */}
          <div className="services-section">
            <h2>Services & Commissions</h2>
            <div className="services-grid">
              {services.map((service, index) => (
                <div key={index} className="service-card">
                  <h4>{service.name}</h4>
                  <p className="service-price">{service.price}</p>
                  <p className="service-description">{service.description}</p>
                  <button className="btn-service">Book Now</button>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="testimonials-section">
            <h2>What People Say</h2>
            <div className="testimonials-grid">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <div className="testimonial-content">
                    <p>"{testimonial.text}"</p>
                  </div>
                  <div className="testimonial-author">
                    <img src={testimonial.avatar} alt={testimonial.name} />
                    <div>
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact/CTA Section */}
          <div className="cta-section">
            <div className="cta-content">
              <h2>Ready to Work Together?</h2>
              <p>Let's create something amazing that celebrates our culture and tells your story.</p>
              <div className="cta-buttons">
                <button className="btn-cta-primary">Start a Project</button>
                <button className="btn-cta-secondary">Download Portfolio</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Modal */}
      {selectedWork && (
        <div className="portfolio-modal" onClick={() => setSelectedWork(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedWork(null)}>×</button>
            <img src={selectedWork.image} alt={selectedWork.title} />
            <div className="modal-info">
              <h3>{selectedWork.title}</h3>
              <p className="modal-category">{selectedWork.category}</p>
              <p className="modal-description">{selectedWork.description}</p>
              <div className="modal-tags">
                {selectedWork.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editing && (
        <div className="edit-modal-overlay">
          <div className="edit-modal-container">
            <h3>Edit Profile</h3>
            <p>Comprehensive profile editing functionality will be implemented here.</p>
            <p>This will include sections for:</p>
            <ul>
              <li>Personal Information & Bio</li>
              <li>Skills & Expertise</li>
              <li>Portfolio Management</li>
              <li>Social Media Links</li>
              <li>Services & Pricing</li>
              <li>Cover Photo & Avatar</li>
            </ul>
            <button onClick={() => setEditing(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
