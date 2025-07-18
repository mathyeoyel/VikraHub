import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Freelance.css';

const Freelance = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return <div className="loading">Loading freelance platform...</div>;
  }

  return (
    <div className="freelance-platform">
      <div className="container">
        <div className="hero-section">
          <h1>Freelance Platform</h1>
          <p>Connect with skilled professionals and find your next project</p>
        </div>

        <div className="platform-features">
          <div className="feature-section">
            <h2>For Clients</h2>
            <div className="feature-grid">
              <div className="feature-card">
                <h3>Post Projects</h3>
                <p>Create detailed project descriptions and requirements</p>
                <Link to="/dashboard" className="feature-link">Get Started</Link>
              </div>
              <div className="feature-card">
                <h3>Find Talent</h3>
                <p>Browse skilled freelancers and their portfolios</p>
                <Link to="/members" className="feature-link">Browse Freelancers</Link>
              </div>
              <div className="feature-card">
                <h3>Manage Projects</h3>
                <p>Track progress and communicate with your team</p>
                <Link to="/dashboard" className="feature-link">Dashboard</Link>
              </div>
            </div>
          </div>

          <div className="feature-section">
            <h2>For Freelancers</h2>
            <div className="feature-grid">
              <div className="feature-card">
                <h3>Find Projects</h3>
                <p>Discover projects that match your skills</p>
                <Link to="/dashboard" className="feature-link">Browse Projects</Link>
              </div>
              <div className="feature-card">
                <h3>Showcase Work</h3>
                <p>Build your portfolio and attract clients</p>
                <Link to="/dashboard" className="feature-link">Create Portfolio</Link>
              </div>
              <div className="feature-card">
                <h3>Grow Your Business</h3>
                <p>Build lasting client relationships</p>
                <Link to="/dashboard" className="feature-link">Get Started</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Start?</h2>
          <p>Join thousands of professionals on VikraHub</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">Join as Freelancer</Link>
            <Link to="/login" className="btn btn-secondary">Hire Talent</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Freelance;
