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
              <a href="/signup" className="btn btn-primary btn-large">Sign Up as a Creator</a>
              <a href="/members" className="btn btn-secondary btn-large">Find Talent</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="services-overview">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">
            Connect, create, and collaborate with South Sudan's most talented creatives
          </p>
          
          <div className="services-grid">
            {/* Creator Portfolios */}
            <div className="service-card">
              <div className="service-icon">🎨</div>
              <h3>Creator Portfolios</h3>
              <p>Showcase your creativity to the world.</p>
              <ul className="service-features">
                <li>Build a free, personalized profile and online portfolio</li>
                <li>Upload and manage your best works—art, photography, design, writing, and more</li>
                <li>Share your unique story and get noticed by a wider audience</li>
              </ul>
            </div>

            {/* Talent Discovery */}
            <div className="service-card">
              <div className="service-icon">👥</div>
              <h3>Talent Discovery for Organizations</h3>
              <p>Find and collaborate with the best creative minds from South Sudan.</p>
              <ul className="service-features">
                <li>Search and filter creatives by skill, location, or style</li>
                <li>Browse verified creator profiles and portfolios</li>
                <li>Connect directly for projects, commissions, or partnerships</li>
              </ul>
            </div>

            {/* Custom Commissions */}
            <div className="service-card">
              <div className="service-icon">💼</div>
              <h3>Custom Commissions</h3>
              <p>Bring your project to life with local talent.</p>
              <ul className="service-features">
                <li>Post your creative project needs (design, photography, branding, illustration, etc.)</li>
                <li>Receive proposals from talented creators</li>
                <li>Collaborate easily and support the local creative economy</li>
              </ul>
            </div>

            {/* Curated Inspiration */}
            <div className="service-card">
              <div className="service-icon">✨</div>
              <h3>Curated Inspiration & Resources</h3>
              <p>Fuel your imagination and grow your skills.</p>
              <ul className="service-features">
                <li>Explore themed galleries and collections by South Sudanese artists</li>
                <li>Access creative guides, tips, and resources</li>
                <li>Stay inspired by stories, features, and highlights from our community</li>
              </ul>
            </div>

            {/* Workshops & Events */}
            <div className="service-card">
              <div className="service-icon">🎓</div>
              <h3>Workshops & Events</h3>
              <p>Grow, learn, and connect—online and offline.</p>
              <ul className="service-features">
                <li>Participate in skill-building workshops and creative training</li>
                <li>Join competitions, challenges, and networking events</li>
                <li>Exclusive opportunities to learn from and collaborate with fellow creatives</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose VikraHub */}
      <section className="why-choose">
        <div className="container">
          <h2 className="section-title">Why Choose VikraHub?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🇸🇸</div>
              <h3>Local Focus</h3>
              <p>We are dedicated to uplifting South Sudanese talent.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Trusted Community</h3>
              <p>Safe, supportive, and inspiring space for all.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Easy Connections</h3>
              <p>Simple tools to connect creators with real opportunities.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Professional Growth</h3>
              <p>Resources and events designed to help you thrive.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Call to Action */}
      <section className="services-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>
              Whether you're a creator looking to share your work, or an organization seeking the best local talent—VikraHub is your creative home.
            </p>
            <div className="cta-buttons">
              <a href="/signup" className="cta-btn primary">Sign Up as a Creator</a>
              <a href="/members" className="cta-btn secondary">Find Talent</a>
              <a href="/contact" className="cta-btn tertiary">Contact Us</a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-content">
            <h2>Need Something Custom?</h2>
            <p>We're happy to discuss special projects, partnerships, and more.</p>
            <div className="contact-info">
              <div className="contact-method">
                <span className="contact-icon">📧</span>
                <a href="mailto:info@vikrahub.com">info@vikrahub.com</a>
              </div>
              <div className="contact-method">
                <span className="contact-icon">📞</span>
                <a href="tel:+211922931515">+211 922 931 515</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Services;
