import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { userAPI, assetAPI } from '../api';
import { handleImageError, createPortfolioImageUrl } from '../utils/portfolioImageUtils';
import EditProfile from './EditProfile';
import ClientProfile from './ClientProfile';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [assets, setAssets] = useState([]);
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
      // Fetch both profile and assets data
      const [profileResponse, assetsResponse] = await Promise.all([
        userAPI.getMyProfile(),
        assetAPI.getMyAssets().catch(err => {
          console.warn('Failed to fetch assets:', err);
          return { data: [], results: [] };
        })
      ]);
      
      console.log('Profile data received:', profileResponse.data);
      setProfile(profileResponse.data);
      
      // Normalize assets response (handle both arrays and paginated objects)
      const normalizedAssets = Array.isArray(assetsResponse) 
        ? assetsResponse 
        : assetsResponse?.results || assetsResponse?.data || [];
      
      console.log('Assets data received:', normalizedAssets);
      setAssets(normalizedAssets);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    setEditing(false);
    // Show a success message or notification
    console.log('Profile updated successfully:', updatedProfile);
  };

  // Get portfolio works from profile data and combine with uploaded assets
  const portfolioItems = profile?.portfolio_items || [];
  
  // Convert assets to portfolio format for consistent display
  const assetPortfolioItems = assets.map(asset => ({
    id: `asset-${asset.id}`,
    title: asset.title,
    category: typeof asset.category === 'object' && asset.category ? asset.category.name : 
              typeof asset.category === 'string' ? asset.category : 'Creative Assets',
    image: asset.preview_image || asset.file_url || asset.thumbnail_url,
    description: asset.description,
    url: asset.file_url,
    tags_list: asset.tags ? asset.tags.split(',').map(tag => tag.trim()) : [],
    type: 'asset' // Mark as asset for identification
  }));
  
  // Combine portfolio items and assets
  const portfolioWorks = [...portfolioItems, ...assetPortfolioItems];

  // Get real social links from profile - only show if they exist
  const socialLinks = [
    ...(profile?.instagram && profile.instagram.trim() ? [{ platform: 'Instagram', url: profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram}`, icon: '📷' }] : []),
    ...(profile?.facebook && profile.facebook.trim() ? [{ platform: 'Facebook', url: profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`, icon: '📘' }] : []),
    ...(profile?.twitter && profile.twitter.trim() ? [{ platform: 'Twitter', url: profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter}`, icon: '🐦' }] : []),
    ...(profile?.linkedin && profile.linkedin.trim() ? [{ platform: 'LinkedIn', url: profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`, icon: '💼' }] : []),
    ...(profile?.github && profile.github.trim() ? [{ platform: 'GitHub', url: profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`, icon: '🐙' }] : []),
    ...(profile?.website && profile.website.trim() ? [{ platform: 'Website', url: profile.website.startsWith('http') ? profile.website : `https://${profile.website}`, icon: '🌐' }] : [])
  ];

  // Services data - Only show if user has actually added services
  const services = (profile?.user_type === 'creator' || profile?.user_type === 'freelancer') && profile?.services_offered && profile.services_offered.trim() 
    ? profile.services_offered.split('\n').filter(line => line.trim()).map((service, index) => {
        // Try to parse if it contains price information
        const parts = service.split(' - ');
        return {
          name: parts[0] || service,
          description: parts[1] || '',
          price: parts[2] || "Contact for pricing"
        };
      })
    : [];

  // Use real achievements from profile - Only show if user has actually added achievements
  const achievements = (profile?.user_type === 'creator' || profile?.user_type === 'freelancer') && profile?.achievements && profile.achievements.trim()
    ? profile.achievements.split('\n').filter(line => line.trim()).map((achievement, index) => {
        const parts = achievement.split(' - ');
        return {
          title: parts[0] || achievement,
          description: parts[1] || '',
          year: parts[2] || new Date().getFullYear().toString()
        };
      })
    : [];

  // Remove hardcoded testimonials - will be fetched from database later
  const testimonials = [];

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

  // Show ClientProfile component for client users
  if (profile?.user_type === 'client') {
    return <ClientProfile />;
  }

  const filteredWorks = activePortfolioTab === 'All' 
    ? portfolioWorks 
    : portfolioWorks.filter(work => work.category === activePortfolioTab);

  return (
    <div className="profile-page">
      {/* Cover Banner */}
      <div className="cover-banner">
        <img 
          src={profile?.cover_photo || '/assets/default-cover-placeholder.svg'} 
          alt="Cover"
          className="cover-image"
          onError={(e) => {
            // Use a CSS-based cover placeholder if the SVG also fails
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIzMDAiIHZpZXdCb3g9IjAgMCAxMjAwIDMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iY292ZXJHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDAyMjMiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNGE1NTY4Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI2NvdmVyR3JhZGllbnQpIi8+CjxnIG9wYWNpdHk9IjAuNiI+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEwMCIgcj0iMyIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTAwMCIgY3k9IjgwIiByPSIyIiBmaWxsPSJ3aGl0ZSIvPgo8Y2lyY2xlIGN4PSI4MDAiIGN5PSIxNTAiIHI9IjIuNSIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iNDAwIiBjeT0iNjAiIHI9IjEuNSIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iNjAwIiBjeT0iMjAwIiByPSIyIiBmaWxsPSJ3aGl0ZSIvPgo8L2c+Cjx0ZXh0IHg9IjYwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjciPkNvdmVyIFBob3RvPC90ZXh0Pgo8L3N2Zz4=';
          }}
        />
        <div className="cover-overlay"></div>
      </div>

      {/* Profile Header */}
      <div className="profile-header-section">
        <div className="profile-container">
          <div className="profile-header-content">
            <div className="profile-picture-container">
              <img 
                src={profile?.avatar || 'https://ui-avatars.com/api/?name=User&background=4a5568&color=fff&size=150'} 
                alt={`${profile?.user?.first_name || 'User'}'s profile`}
                className="profile-picture-large"
                onError={(e) => {
                  e.target.src = 'https://ui-avatars.com/api/?name=User&background=4a5568&color=fff&size=150';
                }}
              />
              <div className="online-indicator"></div>
            </div>
            
            <div className="profile-info-header">
              <h1 className="profile-name">
                {profile?.user?.first_name && profile?.user?.last_name 
                  ? `${profile.user.first_name} ${profile.user.last_name}`
                  : profile?.user?.username || 'User'
                }
              </h1>
              <p className="profile-username">@{profile?.user?.username || 'unknown'}</p>
              <p className="profile-role">
                {profile?.headline || 
                 (profile?.user_type === 'creator' ? 'Creative Professional' :
                  profile?.user_type === 'freelancer' ? 'Freelancer' :
                  profile?.user_type === 'client' ? 'Client' : 'Professional')
                }
              </p>
              {/* Experience Information */}
              {(profile?.user_type === 'creator' || profile?.user_type === 'freelancer') && (
                <p className="profile-experience">
                  {profile?.user_type === 'freelancer' && profile?.freelancer_profile?.years_experience > 0 && (
                    <>💼 {profile.freelancer_profile.years_experience} years experience</>
                  )}
                  {profile?.user_type === 'creator' && profile?.creator_profile?.experience_level && (
                    <>⭐ {profile.creator_profile.experience_level.charAt(0).toUpperCase() + profile.creator_profile.experience_level.slice(1)} Level</>
                  )}
                </p>
              )}
              <p className="profile-location">
                {profile?.location ? `📍 ${profile.location}` : ''}
              </p>
              <p className="profile-tagline">
                {profile?.bio ? 
                  (profile.bio.length > 100 ? profile.bio.substring(0, 100) + '...' : profile.bio) :
                  ""
                }
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
              <h3>
                {profile?.user_type === 'creator' ? 'Skills & Expertise' : 
                 profile?.user_type === 'freelancer' ? 'Skills & Expertise' : 
                 'Areas of Interest'}
              </h3>
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
                {(!profile?.skills || 
                  (Array.isArray(profile.skills) && profile.skills.length === 0) ||
                  (typeof profile.skills === 'string' && !profile.skills.trim())) && (
                  <div className="skills-placeholder">
                    <p>No skills added yet. Edit your profile to add your skills and expertise!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="social-links-section">
              <h3>Connect With Me</h3>
              {socialLinks.length > 0 ? (
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
              ) : (
                <p>No social links added yet. Update your profile to connect with others!</p>
              )}
            </div>
          </div>

          {/* Portfolio Gallery */}
          <div className="portfolio-section">
            <div className="section-header">
              <h2>
                {profile?.user_type === 'client' ? 'Past Projects' : 'Portfolio'}
              </h2>
              {portfolioWorks.length > 0 && (
                <div className="portfolio-tabs">
                  {['All', ...new Set(portfolioWorks.map(work => work.category || 'General'))].map(tab => (
                    <button
                      key={tab}
                      className={`tab-btn ${activePortfolioTab === tab ? 'active' : ''}`}
                      onClick={() => setActivePortfolioTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {portfolioWorks.length > 0 ? (
              <div className="portfolio-grid">
                {filteredWorks.map(work => (
                  <div 
                    key={work.id} 
                    className="portfolio-item"
                    onClick={() => setSelectedWork(work)}
                  >
                    {work.type === 'asset' && (
                      <div className="asset-badge">Creative Asset</div>
                    )}
                    <img 
                      src={createPortfolioImageUrl(work.image) || '/assets/default-asset-placeholder.svg'} 
                      alt={work.title}
                      onError={handleImageError}
                      data-original-src={work.image}
                    />
                    <div className="portfolio-overlay">
                      <h4>{work.title}</h4>
                      <p>{typeof work.category === 'object' && work.category ? work.category.name : 
                          typeof work.category === 'string' ? work.category : 'General'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="portfolio-empty">
                <p>No portfolio items to display yet. Add some work to showcase your skills!</p>
              </div>
            )}
          </div>

          {/* Achievements & Highlights - Show only when user has real achievements */}
          {(profile?.user_type === 'creator' || profile?.user_type === 'freelancer') && achievements.length > 0 && (
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
          )}

          {/* Services Offered - Show only when user has real services */}
          {(profile?.user_type === 'creator' || profile?.user_type === 'freelancer') && services.length > 0 && (
            <div className="services-section">
              <h2>
                {profile?.user_type === 'creator' ? 'Services & Commissions' : 'Services Offered'}
              </h2>
              <div className="services-grid">
                {services.map((service, index) => (
                  <div key={index} className="service-card">
                    <h4>{service.name}</h4>
                    <p className="service-price">{service.price}</p>
                    <p className="service-description">{service.description}</p>
                    <button className="btn-service">
                      {profile?.user_type === 'creator' ? 'Commission' : 'Book Now'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rates & Pricing - Show for Freelancer only when they have rates info */}
          {profile?.user_type === 'freelancer' && (
            profile?.freelancer_profile?.hourly_rate || 
            profile?.freelancer_profile?.project_rate || 
            profile?.typical_budget_range
          ) && (
            <div className="rates-section">
              <h2>Rates & Pricing</h2>
              <div className="rates-grid">
                {profile?.freelancer_profile?.hourly_rate && (
                  <div className="rate-card">
                    <div className="rate-icon"><i className="fas fa-dollar-sign icon"></i></div>
                    <h4>Hourly Rate</h4>
                    <p className="rate-price">${profile.freelancer_profile.hourly_rate}/hr</p>
                    <p>Perfect for ongoing projects and consultations</p>
                  </div>
                )}
                {profile?.freelancer_profile?.project_rate && (
                  <div className="rate-card">
                    <div className="rate-icon"><i className="fas fa-clipboard icon"></i></div>
                    <h4>Project Rate</h4>
                    <p className="rate-price">{profile.freelancer_profile.project_rate}</p>
                    <p>Fixed pricing based on project requirements</p>
                  </div>
                )}
                {profile?.typical_budget_range && (
                  <div className="rate-card">
                    <div className="rate-icon"><i className="fas fa-chart-line icon"></i></div>
                    <h4>Typical Budget</h4>
                    <p className="rate-price">{profile.typical_budget_range}</p>
                    <p>Typical project budget range</p>
                  </div>
                )}
              </div>
              <p className="rates-disclaimer">
                <em>All rates are subject to project complexity and timeline. Contact me for a detailed quote tailored to your specific needs.</em>
              </p>
            </div>
          )}

          {/* Testimonials - Show only when there are real testimonials */}
          {testimonials.length > 0 && (
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
          )}

          {/* Contact/CTA Section */}
          <div className="cta-section">
            <div className="cta-content">
              <h2>
                {profile?.user_type === 'freelancer' ? 'Ready to Hire Me?' : 
                 profile?.user_type === 'creator' ? 'Ready to Work Together?' : 
                 'Let\'s Collaborate!'}
              </h2>
              <p>
                {profile?.user_type === 'freelancer' 
                  ? "Let's discuss your project requirements and bring your vision to life with professional expertise."
                  : profile?.user_type === 'creator'
                  ? "Let's create something amazing that celebrates our culture and tells your story."
                  : "I'm always looking for exciting new projects and collaborations. Let's connect!"}
              </p>
              <div className="cta-buttons">
                <button className="btn-cta-primary">
                  {profile?.user_type === 'freelancer' ? 'Get Quote' : 
                   profile?.user_type === 'creator' ? 'Start a Project' : 
                   'Start Collaboration'}
                </button>
                <button className="btn-cta-secondary">
                  {profile?.user_type === 'client' ? 'View Projects' : 'Download Portfolio'}
                </button>
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
            {selectedWork.image && (
              <img 
                src={createPortfolioImageUrl(selectedWork.image)} 
                alt={selectedWork.title}
                onError={handleImageError}
                data-original-src={selectedWork.image}
              />
            )}
            <div className="modal-info">
              <h3>{selectedWork.title}</h3>
              <p className="modal-category">{typeof selectedWork.category === 'object' && selectedWork.category ? selectedWork.category.name : 
                                             typeof selectedWork.category === 'string' ? selectedWork.category : 'General'}</p>
              <p className="modal-description">{selectedWork.description}</p>
              {selectedWork.url && (
                <a 
                  href={selectedWork.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="modal-link"
                >
                  View Project
                </a>
              )}
              {selectedWork.tags_list && selectedWork.tags_list.length > 0 && (
                <div className="modal-tags">
                  {selectedWork.tags_list.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              {selectedWork.tags && typeof selectedWork.tags === 'string' && (
                <div className="modal-tags">
                  {selectedWork.tags.split(',').map((tag, index) => (
                    <span key={index} className="tag">{tag.trim()}</span>
                  ))}
                </div>
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

export default Profile;
