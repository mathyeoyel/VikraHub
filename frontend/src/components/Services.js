import React from 'react';
import './Services.css';

const Services = () => {
  return (
    <div className="services">
      {/* Hero Section */}
      <section className="services-hero">
        <div className="container">
          <div className="services-hero-content">
            <h1>Your Creative Home in South Sudan</h1>
            <p className="hero-subtitle">
              Whether you're a creator looking to share your work, or an organization seeking the best local talent—VikraHub is your creative home.
            </p>
            <div className="hero-buttons">
              <a href="#get-started" className="btn btn-primary btn-large">Sign Up as a Creator</a>
              <a href="#find-talent" className="btn btn-secondary btn-large">Find Talent</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="services-overview">
        <div className="container">
          <h2 className="section-title">What We Offer</h2>
          <p className="section-subtitle">
            Connect, create, and collaborate with South Sudan's most talented creatives
          </p>
          
          <div className="services-grid">
            {/* Creator Portfolios */}
            <div className="service-card featured">
              <div className="featured-badge">Most Popular</div>
              <div className="service-icon">🎨</div>
              <h3>Creator Portfolios</h3>
              <p>Showcase your creativity to the world.</p>
              <ul className="service-features">
                <li>Build a free, personalized profile and online portfolio</li>
                <li>Upload and manage your best works—art, photography, design, writing, and more</li>
                <li>Share your unique story and get noticed by a wider audience</li>
              </ul>
              <div className="service-pricing">
                <span className="price">Free</span>
              </div>
              <a href="#signup" className="service-btn">Create Portfolio</a>
            </div>

            {/* Talent Discovery */}
            <div className="service-card">
              <div className="service-icon">👥</div>
              <h3>Find Creators</h3>
              <p>Browse and connect with South Sudan's talented creatives.</p>
              <ul className="service-features">
                <li>Browse creator profiles and portfolios</li>
                <li>Filter by skills, location, and creative style</li>
                <li>Connect directly with artists for collaborations</li>
              </ul>
              <div className="service-pricing">
                <span className="price">Free to browse</span>
              </div>
              <a href="/members" className="service-btn">Explore Creators</a>
            </div>

            {/* Project Commissions */}
            <div className="service-card">
              <div className="service-icon">🎨</div>
              <h3>Project Commissions</h3>
              <p>Commission custom creative work from local talent.</p>
              <ul className="service-features">
                <li>Post creative project needs (art, photography, design)</li>
                <li>Connect directly with interested creators</li>
                <li>Support the local creative economy</li>
              </ul>
              <div className="service-pricing">
                <span className="price">Coming Soon</span>
              </div>
              <a href="/contact" className="service-btn">Learn More</a>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="services-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>
              Join South Sudan's creative community today. Whether you're an artist or looking for creative talent, VikraHub is your platform.
            </p>
            <div className="cta-buttons">
              <a href="/signup" className="cta-btn primary">Create Your Portfolio</a>
              <a href="/members" className="cta-btn secondary">Browse Creators</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
