import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assetAPI } from '../api';
import './Explore.css';

const Explore = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch creators data from backend
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        // Try to get featured creators first, fall back to all creators if needed
        let response;
        try {
          response = await assetAPI.getFeaturedCreators();
          console.log('Featured creators received for Explore:', response.data);
        } catch (featuredError) {
          console.log('No featured creators endpoint, fetching all creators:', featuredError);
          response = await assetAPI.getCreators();
        }
        
        const creatorsData = response.data.results || response.data;
        setCreators(creatorsData);
      } catch (err) {
        console.error('Error fetching creators for Explore:', err);
        setCreators([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  // Map backend CreatorProfile data to frontend format (same as Creators.js)
  const mapCreatorData = (creatorProfile) => {
    const user = creatorProfile.user;
    const userProfile = user.userprofile || {};
    
    return {
      id: user.id,
      username: user.username,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      title: creatorProfile.creator_type_display || 'Creative Professional',
      location: getLocationFromBio(userProfile.bio) || 'South Sudan',
      category: mapCreatorTypeToCategory(creatorProfile.creator_type),
      image: getProfileImage(userProfile.avatar, user.first_name, user.last_name),
      bio: creatorProfile.art_statement || userProfile.bio || 'Passionate creative professional.',
      skills: getSkillsArray(creatorProfile.skills),
      featured: creatorProfile.featured || false,
      isOnline: user.last_login && isRecentlyActive(user.last_login),
      portfolioCount: creatorProfile.total_assets || 0,
      isVerified: userProfile.verified || false
    };
  };

  // Helper functions (same as Creators.js)
  const mapCreatorTypeToCategory = (creatorType) => {
    const typeMap = {
      'photographer': 'Photography',
      'designer': 'Design',
      'artist': 'Art',
      'digital_artist': 'Digital Art',
      'traditional_artist': 'Art',
      'writer': 'Writing',
      'musician': 'Music',
      'filmmaker': 'Video',
      'other': 'Creative'
    };
    return typeMap[creatorType] || 'Creative';
  };

  const getLocationFromBio = (bio) => {
    if (!bio) return null;
    const locations = ['Juba', 'Gudele', 'Munuki', 'Wau', 'Malakal', 'South Sudan'];
    for (const location of locations) {
      if (bio.includes(location)) {
        return location;
      }
    }
    return null;
  };

  const getProfileImage = (avatar, firstName, lastName) => {
    if (avatar && avatar.includes('cloudinary')) {
      return avatar;
    }
    const name = `${firstName || ''} ${lastName || ''}`.trim();
    if (name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=300&background=ffa000&color=ffffff&font-size=0.33&rounded=true`;
    }
    return '/assets/default-avatar.jpg';
  };

  const getSkillsArray = (skills) => {
    if (!skills) return ['Creative Services'];
    return skills.split(',').map(skill => skill.trim()).slice(0, 3);
  };

  const isRecentlyActive = (lastLogin) => {
    if (!lastLogin) return false;
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffInHours = (now - loginDate) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };

  // Use only real data from backend
  const displayCreators = creators.length > 0 ? creators.map(mapCreatorData) : [];

  // Featured creators: if we got data from getFeaturedCreators, use all of it (max 3)
  // Otherwise, show featured creators from general data, or first 3 if none are marked as featured
  const featuredCreators = displayCreators.length > 0 
    ? displayCreators.slice(0, 3) // Take first 3 (they're already featured if from getFeaturedCreators)
    : [];

  const featuredWorks = [
    {
      id: 1,
      title: 'Modern Dashboard UI',
      creator: 'Sarah Johnson',
      category: 'UI/UX',
      image: '🎨',
      likes: 145
    },
    {
      id: 2,
      title: 'E-commerce Platform',
      creator: 'Mike Chen',
      category: 'Development',
      image: '💻',
      likes: 89
    },
    {
      id: 3,
      title: 'Brand Identity System',
      creator: 'Elena Rodriguez',
      category: 'Branding',
      image: '🏷️',
      likes: 203
    }
  ];

  return (
    <div className="explore-container">
      <div className="explore-hero">
        <h1>Discover Amazing Creators</h1>
        <p>Explore the vibrant VikraHub community and find inspiration from talented creators worldwide.</p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary">
            Join VikraHub
          </Link>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-secondary"
          >
            Sign In
          </button>
        </div>
      </div>

      <div className="explore-content">
        {/* Featured Creators Section */}
        <section className="featured-creators">
          <h2>Featured Creators</h2>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading amazing creators...</p>
            </div>
          ) : featuredCreators.length > 0 ? (
            <div className="creators-grid">
              {featuredCreators.map(creator => (
                <div key={creator.id} className="creator-card">
                  <div className="creator-avatar">
                    <img src={creator.image} alt={creator.name} />
                    {creator.isOnline && <div className="online-indicator"></div>}
                  </div>
                  <h3>{creator.name}</h3>
                  <p className="creator-specialty">{creator.title}</p>
                  <p className="creator-location">{creator.location}</p>
                  <div className="creator-stats">
                    <span>{creator.portfolioCount} works</span>
                    {creator.isVerified && <span className="verified-badge">✓ Verified</span>}
                  </div>
                  <div className="creator-portfolio">
                    {creator.skills.map((skill, index) => (
                      <span key={index} className="portfolio-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <Link to="/signup" className="btn btn-outline">
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-creators">
              <p>No featured creators available at the moment.</p>
              <Link to="/signup" className="btn btn-primary">Join as a Creator</Link>
            </div>
          )}
        </section>

        <section className="featured-works">
          <h2>Featured Works</h2>
          <div className="works-grid">
            {featuredWorks.map(work => (
              <div key={work.id} className="work-card">
                <div className="work-image">{work.image}</div>
                <div className="work-info">
                  <h3>{work.title}</h3>
                  <p>by {work.creator}</p>
                  <div className="work-meta">
                    <span className="work-category">{work.category}</span>
                    <span className="work-likes"><i className="fas fa-heart icon"></i> {work.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="community-features">
          <h2>Why Join VikraHub?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-palette icon"></i></div>
              <h3>Showcase Your Work</h3>
              <p>Create a stunning portfolio to display your creative projects and attract potential clients.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-handshake icon"></i></div>
              <h3>Collaborate</h3>
              <p>Connect with other creators and work together on exciting projects and creative challenges.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-briefcase icon"></i></div>
              <h3>Find Opportunities</h3>
              <p>Discover freelance work, full-time positions, and project opportunities from clients worldwide.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-book icon"></i></div>
              <h3>Learn & Grow</h3>
              <p>Access tutorials, resources, and feedback from the community to improve your skills.</p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Join the Community?</h2>
            <p>Start your creative journey with VikraHub today and connect with thousands of talented creators.</p>
            <Link to="/signup" className="btn btn-primary btn-large">
              Get Started for Free
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Explore;
