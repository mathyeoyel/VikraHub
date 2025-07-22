import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="container">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="hero-content">
            <h1 className="page-title">About VikraHub</h1>
            <p className="hero-subtitle">
              Empowering South Sudanese creatives to shine on a global stage
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="story-section">
          <div className="content-wrapper">
            <h2 className="section-title">Our Story</h2>
            <div className="story-content">
              <p>
                VikraHub was born from a simple but powerful vision: to give South Sudanese creatives 
                a home where their talent is seen, celebrated, and connected to real opportunity.
              </p>
              <p>
                In a world overflowing with talent, too many creators from South Sudan go unnoticed. 
                VikraHub is here to change that narrative. We believe that the creative spirit of 
                South Sudan deserves a global stage, and that every creator—whether an artist, 
                designer, photographer, or storyteller—should have the tools and visibility to thrive.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="content-wrapper">
            <h2 className="section-title">Our Mission</h2>
            <p className="mission-text">
              To discover, connect, and empower South Sudanese creatives by providing them with 
              a platform to showcase their work, tell their stories, and access opportunities—locally 
              and globally.
            </p>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="services-section">
          <div className="content-wrapper">
            <h2 className="section-title">What We Do</h2>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">🎨</div>
                <h3>Showcase Talent</h3>
                <p>
                  Creators can build professional online portfolios and share their best work with the world.
                </p>
              </div>
              <div className="service-card">
                <div className="service-icon">🤝</div>
                <h3>Foster Community</h3>
                <p>
                  We bring together artists, designers, photographers, writers, and innovators into a 
                  supportive, uplifting network.
                </p>
              </div>
              <div className="service-card">
                <div className="service-icon">🔗</div>
                <h3>Connect Opportunities</h3>
                <p>
                  Organizations and clients can easily find and hire authentic South Sudanese talent 
                  for their projects.
                </p>
              </div>
              <div className="service-card">
                <div className="service-icon">📈</div>
                <h3>Inspire Growth</h3>
                <p>
                  Through curated collections, workshops, and stories, we spark inspiration and foster 
                  learning within our creative community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="values-section">
          <div className="content-wrapper">
            <h2 className="section-title">Our Values</h2>
            <div className="values-grid">
              <div className="value-item">
                <h3>🎭 Creativity</h3>
                <p>We celebrate originality and believe every idea has the power to inspire.</p>
              </div>
              <div className="value-item">
                <h3>👥 Community</h3>
                <p>Together, we lift each other up and build a stronger creative network.</p>
              </div>
              <div className="value-item">
                <h3>💪 Empowerment</h3>
                <p>We provide tools, visibility, and resources to help every creator reach their full potential.</p>
              </div>
              <div className="value-item">
                <h3>✨ Authenticity</h3>
                <p>We honor the unique cultures, traditions, and voices of South Sudan.</p>
              </div>
              <div className="value-item">
                <h3>🚀 Opportunity</h3>
                <p>We strive to connect talent with real, meaningful projects and collaborations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        <section className="audience-section">
          <div className="content-wrapper">
            <h2 className="section-title">Who Is VikraHub For?</h2>
            <div className="audience-grid">
              <div className="audience-card">
                <h3>🎨 Creators</h3>
                <p>
                  Whether you're a professional or just starting out, VikraHub helps you build your 
                  creative presence, connect with peers, and find new opportunities.
                </p>
              </div>
              <div className="audience-card">
                <h3>🏢 Organizations & Clients</h3>
                <p>
                  Discover and collaborate with the best South Sudanese creatives for your projects, 
                  campaigns, or events.
                </p>
              </div>
              <div className="audience-card">
                <h3>❤️ Creative Enthusiasts</h3>
                <p>
                  Explore a world of inspiring art, stories, and innovation from the heart of South Sudan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="cta-section">
          <div className="content-wrapper">
            <h2 className="section-title">Join the Movement</h2>
            <div className="cta-content">
              <p>
                VikraHub isn't just a platform—it's a movement to uplift and celebrate South Sudanese 
                creativity. We invite you to join us:
              </p>
              <ul className="cta-list">
                <li>Share your work</li>
                <li>Connect with others</li>
                <li>Get inspired</li>
                <li>Help rewrite the creative story of South Sudan</li>
              </ul>
              <div className="cta-buttons">
                <a href="/login" className="btn btn-primary">Get Started</a>
                <a href="/creators" className="btn btn-secondary">Explore Creators</a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <div className="content-wrapper">
            <h2 className="section-title">Contact Us</h2>
            <div className="contact-info">
              <div className="contact-item">
                <strong>Email:</strong> <a href="mailto:info@vikrahub.com">info@vikrahub.com</a>
              </div>
              <div className="contact-item">
                <strong>Tel:</strong> <a href="tel:+211922931515">+211 922 931 515</a>
              </div>
              <div className="contact-item">
                <strong>Follow us:</strong>
                <div className="social-links">
                  <a href="https://facebook.com/vikrahub" target="_blank" rel="noopener noreferrer">Facebook</a>
                  <a href="https://instagram.com/vikrahub" target="_blank" rel="noopener noreferrer">Instagram</a>
                  <a href="https://linkedin.com/company/vikrahub" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  <a href="https://twitter.com/vikrahub" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closing Statement */}
        <section className="closing-section">
          <div className="content-wrapper">
            <div className="closing-content">
              <p className="closing-text">
                At VikraHub, we believe every creator has a story worth telling. We're here to help 
                you tell yours—and to make sure the world is listening.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
