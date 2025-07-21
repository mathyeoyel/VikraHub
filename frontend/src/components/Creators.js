import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Creators.css';

const Creators = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample creators data - in a real app, this would come from an API
  const creators = [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
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
      id: 4,
      name: "Buay Moses",
      title: "Entrepreneur",
      location: "Juba",
      category: "Business",
      image: "/assets/creator-placeholder.jpg",
      bio: "Building innovative businesses that drive economic growth and create opportunities in South Sudan.",
      specialties: ["Business Development", "Startup Strategy", "Innovation"],
      yearsExperience: 5,
      featured: false
    },
    {
      id: 5,
      name: "John Marit",
      title: "Developer",
      location: "Juba",
      category: "Technology",
      image: "/assets/creator-placeholder.jpg",
      bio: "Developing cutting-edge software solutions that solve real-world problems in our community.",
      specialties: ["Software Development", "Mobile Apps", "System Architecture"],
      yearsExperience: 4,
      featured: false
    },
    {
      id: 6,
      name: "Ayen",
      title: "Digital Creator",
      location: "Juba",
      category: "Digital Art",
      image: "/assets/creator-placeholder.jpg",
      bio: "Creating compelling digital content that tells our stories and connects with audiences worldwide.",
      specialties: ["Content Creation", "Social Media", "Digital Marketing"],
      yearsExperience: 3,
      featured: false
    },
    {
      id: 7,
      name: "Grace Paskal",
      title: "Tech Enthusiast",
      location: "Juba",
      category: "Technology",
      image: "/assets/creator-placeholder.jpg",
      bio: "Passionate about leveraging technology to empower communities and drive positive change.",
      specialties: ["Tech Innovation", "Community Outreach", "Digital Literacy"],
      yearsExperience: 3,
      featured: false
    },
    {
      id: 8,
      name: "James Mayen",
      title: "Tech Enthusiast",
      location: "Wau",
      category: "Technology",
      image: "/assets/creator-placeholder.jpg",
      bio: "Exploring emerging technologies and their potential to transform our digital landscape.",
      specialties: ["Emerging Tech", "Research", "Tech Education"],
      yearsExperience: 2,
      featured: false
    },
    {
      id: 9,
      name: "Barnabas Malek",
      title: "Web Designer",
      location: "Juba",
      category: "Design",
      image: "/assets/creator-placeholder.jpg",
      bio: "Designing beautiful and functional websites that showcase the best of South Sudanese creativity.",
      specialties: ["Web Design", "UI Design", "Responsive Design"],
      yearsExperience: 4,
      featured: false
    },
    {
      id: 10,
      name: "Pal James",
      title: "Brand Specialist",
      location: "Juba",
      category: "Design",
      image: "/assets/creator-placeholder.jpg",
      bio: "Building strong brand identities that resonate with audiences and drive business success.",
      specialties: ["Brand Strategy", "Visual Identity", "Brand Management"],
      yearsExperience: 5,
      featured: false
    },
    {
      id: 11,
      name: "Thomas Obotte",
      title: "Cyber Analyst",
      location: "Juba",
      category: "Technology",
      image: "/assets/creator-placeholder.jpg",
      bio: "Protecting digital infrastructure and ensuring cybersecurity for a safer online environment.",
      specialties: ["Cybersecurity", "Threat Analysis", "Digital Forensics"],
      yearsExperience: 6,
      featured: false
    },
    {
      id: 12,
      name: "Wai Mike",
      title: "Digital Artist",
      location: "Malakal",
      category: "Digital Art",
      image: "/assets/creator-placeholder.jpg",
      bio: "Creating stunning digital artworks that blend traditional South Sudanese culture with modern techniques.",
      specialties: ["Digital Illustration", "Concept Art", "Visual Effects"],
      yearsExperience: 4,
      featured: false
    }
  ];

  const categories = ['All', 'Photography', 'Design', 'Technology', 'Business', 'Digital Art'];

  // Filter creators based on category and search term
  const filteredCreators = creators.filter(creator => {
    const matchesCategory = selectedCategory === 'All' || creator.category === selectedCategory;
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredCreators = creators.filter(creator => creator.featured);

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
                <span className="stat-number">{creators.length}+</span>
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
          <h2>Featured Creators</h2>
          <p className="section-subtitle">Spotlight on exceptional talent making waves in their fields</p>
          <div className="featured-grid">
            {featuredCreators.map(creator => (
              <div key={creator.id} className="featured-creator-card">
                <div className="creator-image">
                  <img src={creator.image} alt={creator.name} />
                  <div className="creator-overlay">
                    <Link to={`/profile/${creator.name.toLowerCase().replace(' ', '-')}`} className="view-profile-btn">
                      View Profile
                    </Link>
                  </div>
                </div>
                <div className="creator-info">
                  <h3>{creator.name}</h3>
                  <p className="creator-title">{creator.title}</p>
                  <p className="creator-location">📍 {creator.location}</p>
                  <p className="creator-bio">"{creator.bio}"</p>
                  <div className="creator-specialties">
                    {creator.specialties.slice(0, 2).map((specialty, index) => (
                      <span key={index} className="specialty-tag">{specialty}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
                    <Link to={`/profile/${creator.name.toLowerCase().replace(' ', '-')}`} className="view-profile-link">
                      View Profile
                    </Link>
                    <button className="contact-btn">Contact</button>
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
