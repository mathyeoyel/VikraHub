import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assetAPI } from '../api';
import ChatButton from './Chat/ChatButton';
import './Creators.css';

const Creators = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch creators data from backend
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const response = await assetAPI.getCreators();
        const creatorsData = response.data.results || response.data;
        console.log('Creator profiles received:', creatorsData);
        setCreators(creatorsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching creators:', err);
        setError('Failed to load creators. Please try again later.');
        // Use fallback data if API fails
        setCreators([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  // Map backend CreatorProfile data to frontend format
  const mapCreatorData = (creatorProfile) => {
    const user = creatorProfile.user;
    const userProfile = user.userprofile || {};
    
    return {
      id: user.id, // Use user ID instead of creator profile ID for messaging
      username: user.username,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      title: creatorProfile.creator_type_display || 'Creative Professional',
      location: getLocationFromBio(userProfile.bio) || 'South Sudan',
      category: mapCreatorTypeToCategory(creatorProfile.creator_type),
      image: getProfileImage(userProfile.avatar, user.first_name, user.last_name),
      bio: creatorProfile.art_statement || userProfile.bio || 'Passionate creative professional.',
      specialties: getSkillsArray(userProfile.skills),
      yearsExperience: creatorProfile.years_active || 0,
      featured: creatorProfile.is_featured || false,
      verified: creatorProfile.is_verified || false,
      hourlyRate: creatorProfile.price_range || 'Contact for pricing',
      rating: 0, // TODO: Calculate from reviews
      availability: creatorProfile.available_for_commissions ? 'Available' : 'Unavailable',
      portfolioUrl: creatorProfile.portfolio_url || userProfile.website,
      experienceLevel: creatorProfile.experience_level_display,
      artisticStyle: creatorProfile.artistic_style,
      commissionsOpen: creatorProfile.available_for_commissions,
      commissionTypes: creatorProfile.commission_types,
      followersCount: creatorProfile.followers_count || 0,
      // Additional profile information
      headline: userProfile.headline,
      website: userProfile.website,
      social: {
        twitter: userProfile.twitter,
        instagram: userProfile.instagram,
        facebook: userProfile.facebook,
        linkedin: userProfile.linkedin,
        github: userProfile.github
      }
    };
  };

  // Map creator type to display category
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

  // Extract location from bio text (since location field doesn't exist in model)
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

  // Generate profile image (use avatar if available, otherwise generate placeholder)
  const getProfileImage = (avatar, firstName, lastName) => {
    // Try to use the Cloudinary avatar first
    if (avatar && avatar.includes('cloudinary')) {
      return avatar;
    }
    
    // Fallback to UI Avatars API for professional-looking avatars
    const name = `${firstName || ''} ${lastName || ''}`.trim();
    if (name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=300&background=ffa000&color=ffffff&font-size=0.33&rounded=true`;
    }
    
    // Final fallback to a default avatar
    return '/assets/default-avatar.jpg';
  };

  // Convert skills string to array
  const getSkillsArray = (skills) => {
    if (!skills) return ['Creative Services'];
    return skills.split(',').map(skill => skill.trim()).slice(0, 3);
  };

  // Sample fallback data (to show during loading or if no real data)
  const fallbackCreators = [
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Akon Peter",
      title: "Photographer",
      location: "Juba",
      category: "Photography",
      image: require('../assets/Akon-peter.jpg'),
      bio: "Through my lens, I tell stories of resilience and the vibrant spirit of my community.",
      specialties: ["Portrait Photography", "Street Photography", "Event Photography"],
      yearsExperience: 5,
      featured: true
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Maduot Chongo",
      title: "Designer",
      location: "Gudele",
      category: "Design",
      image: require('../assets/Maduot_chongo.jpg'),
      bio: "Art is my universal language—I use creativity to share our stories with the world.",
      specialties: ["Graphic Design", "Brand Identity", "Digital Art"],
      yearsExperience: 4,
      featured: true
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Awut Paul",
      title: "Programmer",
      location: "Munuki",
      category: "Technology",
      image: require('../assets/Awut_paul.jpg'),
      bio: "I blend technology and culture, building digital solutions that reflect and celebrate our heritage.",
      specialties: ["Web Development", "Mobile Apps", "UI/UX Design"],
      yearsExperience: 6,
      featured: true
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Buay Moses",
      title: "Entrepreneur",
      location: "Juba",
      category: "Business",
      image: require('../assets/buay_moses.jpg'),
      bio: "Building innovative businesses that drive economic growth and create opportunities in South Sudan.",
      specialties: ["Business Development", "Startup Strategy", "Innovation"],
      yearsExperience: 5,
      featured: false
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "John Marit",
      title: "Developer",
      location: "Juba",
      category: "Technology",
      image: require('../assets/john-marit.jpg'),
      bio: "Developing cutting-edge software solutions that solve real-world problems in our community.",
      specialties: ["Software Development", "Mobile Apps", "System Architecture"],
      yearsExperience: 4,
      featured: false
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Ayen",
      title: "Digital Creator",
      location: "Juba",
      category: "Digital Art",
      image: require('../assets/ayen.jpg'),
      bio: "Creating compelling digital content that tells our stories and connects with audiences worldwide.",
      specialties: ["Content Creation", "Social Media", "Digital Marketing"],
      yearsExperience: 3,
      featured: false
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Grace Paskal",
      title: "Tech Enthusiast",
      location: "Juba",
      category: "Technology",
      image: require('../assets/grace_pascal.jpg'),
      bio: "Passionate about leveraging technology to empower communities and drive positive change.",
      specialties: ["Tech Innovation", "Community Outreach", "Digital Literacy"],
      yearsExperience: 3,
      featured: false
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "James Mayen",
      title: "Tech Enthusiast",
      location: "Wau",
      category: "Technology",
      image: require('../assets/james_mayen.jpg'),
      bio: "Exploring emerging technologies and their potential to transform our digital landscape.",
      specialties: ["Emerging Tech", "Research", "Tech Education"],
      yearsExperience: 2,
      featured: false
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Barnabas Malek",
      title: "Web Designer",
      location: "Juba",
      category: "Design",
      image: require('../assets/barnaba_malek.png'),
      bio: "Designing beautiful and functional websites that showcase the best of South Sudanese creativity.",
      specialties: ["Web Design", "UI Design", "Responsive Design"],
      yearsExperience: 4,
      featured: false
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Pal James",
      title: "Brand Specialist",
      location: "Juba",
      category: "Design",
      image: require('../assets/pal_james.png'),
      bio: "Building strong brand identities that resonate with audiences and drive business success.",
      specialties: ["Brand Strategy", "Visual Identity", "Brand Management"],
      yearsExperience: 5,
      featured: false
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Thomas Obotte",
      title: "Cyber Analyst",
      location: "Juba",
      category: "Technology",
      image: require('../assets/thomas_obote.jpg'),
      bio: "Protecting digital infrastructure and ensuring cybersecurity for a safer online environment.",
      specialties: ["Cybersecurity", "Threat Analysis", "Digital Forensics"],
      yearsExperience: 6,
      featured: false
    },
    {
      id: null, // No real user ID for fallback data
      username: null, // No real username for fallback data
      name: "Wai Mike",
      title: "Digital Artist",
      location: "Malakal",
      category: "Digital Art",
      image: require('../assets/wai_mike.jpg'),
      bio: "Creating stunning digital artworks that blend traditional South Sudanese culture with modern techniques.",
      specialties: ["Digital Illustration", "Concept Art", "Visual Effects"],
      yearsExperience: 4,
      featured: false
    }
  ];

  const categories = ['All', 'Photography', 'Design', 'Art', 'Digital Art', 'Writing', 'Music', 'Video', 'Creative'];

  // Use real data if available, combine with enhanced fallback data
  const realCreators = creators.length > 0 ? creators.map(mapCreatorData) : [];
  const enhancedFallbackCreators = fallbackCreators.map((creator, index) => ({
    ...creator,
    // Add mock user data for demonstration purposes - in production, only use real data
    id: 1000 + index, // Mock user IDs starting from 1000
    username: creator.name.toLowerCase().replace(/\s+/g, '_'), // Generate username from name
    isMockData: true // Flag to identify this as sample data
  }));
  
  // Combine real and fallback data for demonstration
  const displayCreators = [...realCreators, ...enhancedFallbackCreators];

  // Filter creators based on category and search term
  const filteredCreators = displayCreators.filter(creator => {
    const matchesCategory = selectedCategory === 'All' || creator.category === selectedCategory;
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Featured creators: first 3 creators from the database/display list
  const featuredCreators = displayCreators.slice(0, 3);

  // Loading state
  if (loading) {
    return (
      <div className="creators-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading amazing creators...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="creators-page">
        <div className="container">
          <div className="error-state">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="creators-page">
      {/* Hero Section */}
      <section className="creators-hero">
        <div className="container">
          <div className="creators-hero-content">
            <h1>Meet Our Creators</h1>
            <p>Discover the talented artists, designers, photographers, and innovators from South Sudan who are shaping the creative landscape.</p>
            <div className="creators-stats">
              <div className="stat">
                <span className="stat-number">{displayCreators.length}+</span>
                <span className="stat-label">Creators</span>
              </div>
              <div className="stat">
                <span className="stat-number">{categories.length - 1}</span>
                <span className="stat-label">Categories</span>
              </div>
              <div className="stat">
                <span className="stat-number">10+</span>
                <span className="stat-label">Cities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Creators Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Creators</h2>
            <p className="section-subtitle">Spotlight on exceptional South Sudanese talent</p>
          </div>
          <div className="featured-creators-grid">
            {featuredCreators.map(creator => (
              <div key={creator.id} className="featured-creator-card">
                <div className="creator-avatar-featured">
                  <img 
                    src={creator.image} 
                    alt={creator.name}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${creator.name}&background=000223&color=ffffff&size=200`;
                    }}
                  />
                </div>
                <div className="creator-info-featured">
                  <h3>{creator.name}</h3>
                  <p className="creator-title-featured">{creator.title} | {creator.location}</p>
                  <p className="creator-bio-featured">"{creator.bio}"</p>
                  <div className="creator-specialties-featured">
                    {creator.specialties.slice(0, 2).map((specialty, index) => (
                      <span key={index} className="specialty-tag-featured">{specialty}</span>
                    ))}
                  </div>
                  <div className="featured-creator-actions">
                    <Link to={`/profile/${creator.username}`} className="btn-secondary">
                      View Profile
                    </Link>
                    {creator.id && creator.username && !creator.isMockData ? (
                      <ChatButton 
                        recipientId={creator.id}
                        recipientUsername={creator.username}
                        recipientName={creator.name}
                        size="medium"
                      />
                    ) : creator.isMockData ? (
                      <button 
                        className="btn-primary" 
                        onClick={() => alert('This is a sample profile. Real messaging will be available with actual user profiles.')}
                      >
                        Message (Demo)
                      </button>
                    ) : (
                      <button className="btn-primary disabled" disabled>
                        Chat Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="featured-cta">
            <p>Discover more talented creators in our directory below</p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="creators-directory">
        <div className="container">
          <div className="directory-header">
            <h2>Creator Directory</h2>
            <p>Find the perfect creative professional for your project</p>
          </div>

          {/* Search and Filter Controls */}
          <div className="search-filter-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by name, skill, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button className="search-btn">🔍</button>
            </div>

            <div className="category-filters">
              {categories.map(category => (
                <button
                  key={category}
                  className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Creators Grid */}
          <div className="creators-grid">
            {filteredCreators.map(creator => (
              <div key={creator.id} className="creator-card">
                <div className="creator-avatar">
                  <img src={creator.image} alt={creator.name} />
                </div>
                <div className="creator-details">
                  <h3>{creator.name}</h3>
                  <p className="creator-role">{creator.title}</p>
                  <p className="creator-location">📍 {creator.location}</p>
                  <p className="creator-experience">{creator.yearsExperience} years experience</p>
                  <div className="creator-skills">
                    {creator.specialties.slice(0, 3).map((specialty, index) => (
                      <span key={index} className="skill-tag">{specialty}</span>
                    ))}
                  </div>
                  <div className="creator-actions">
                    <Link to={`/profile/${creator.username}`} className="view-profile-link">
                      View Profile
                    </Link>
                    {creator.id && creator.username && !creator.isMockData ? (
                      <ChatButton 
                        recipientId={creator.id}
                        recipientUsername={creator.username}
                        recipientName={creator.name}
                        size="small"
                        buttonText="Message"
                        className="message-btn"
                      />
                    ) : creator.isMockData ? (
                      <button 
                        className="message-btn" 
                        onClick={() => alert('This is a sample profile. Real messaging will be available with actual user profiles.')}
                      >
                        Message (Demo)
                      </button>
                    ) : (
                      <button className="btn-small disabled" disabled>
                        Chat Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCreators.length === 0 && (
            <div className="no-results">
              <h3>No creators found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="creators-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Join Our Creative Community</h2>
            <p>Are you a creative professional from South Sudan? Join VikraHub and showcase your talent to the world.</p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-btn primary">Join as Creator</Link>
              <Link to="/services" className="cta-btn secondary">Hire a Creator</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Creators;
