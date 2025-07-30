import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Explore.css';

const Explore = () => {
  const navigate = useNavigate();

  const featuredCreators = [
    {
      id: 1,
      name: 'Sarah Johnson',
      avatar: '👩‍🎨',
      specialty: 'UI/UX Design',
      portfolio: ['Design System', 'Mobile App', 'Website Redesign'],
      followers: '2.5K'
    },
    {
      id: 2,
      name: 'Mike Chen',
      avatar: '👨‍💻',
      specialty: 'Frontend Development',
      portfolio: ['React Dashboard', 'E-commerce Site', 'Portfolio Website'],
      followers: '1.8K'
    },
    {
      id: 3,
      name: 'Elena Rodriguez',
      avatar: '👩‍🎤',
      specialty: 'Brand Design',
      portfolio: ['Logo Collection', 'Brand Identity', 'Marketing Materials'],
      followers: '3.2K'
    }
  ];

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
        <section className="featured-creators">
          <h2>Featured Creators</h2>
          <div className="creators-grid">
            {featuredCreators.map(creator => (
              <div key={creator.id} className="creator-card">
                <div className="creator-avatar">{creator.avatar}</div>
                <h3>{creator.name}</h3>
                <p className="creator-specialty">{creator.specialty}</p>
                <div className="creator-stats">
                  <span>{creator.followers} followers</span>
                </div>
                <div className="creator-portfolio">
                  {creator.portfolio.map((work, index) => (
                    <span key={index} className="portfolio-tag">
                      {work}
                    </span>
                  ))}
                </div>
                <Link to="/signup" className="btn btn-outline">
                  View Profile
                </Link>
              </div>
            ))}
          </div>
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
                    <span className="work-likes">❤️ {work.likes}</span>
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
              <div className="feature-icon">🎨</div>
              <h3>Showcase Your Work</h3>
              <p>Create a stunning portfolio to display your creative projects and attract potential clients.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Collaborate</h3>
              <p>Connect with other creators and work together on exciting projects and creative challenges.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Find Opportunities</h3>
              <p>Discover freelance work, full-time positions, and project opportunities from clients worldwide.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
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
