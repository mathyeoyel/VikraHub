import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home">
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <div className="hero-text">
                <h1>Welcome to <span className="highlight">VikraHub</span></h1>
                <p className="hero-subtitle">
                  We create exceptional digital experiences that drive business growth 
                  and transform ideas into reality.
                </p>
                <div className="hero-buttons">
                  <button className="hero-btn hero-btn-primary">Get Started</button>
                  <button className="hero-btn hero-btn-secondary">Learn More</button>
                </div>
              </div>
              <div className="hero-image">
                <img 
                  src="/vikrahub-hero.jpg" 
                  alt="VikraHub - Inspiring Every Creative Thought" 
                  className="hero-main-image"
                />
                <div className="hero-graphic">
                  <div className="floating-card card-1">💻</div>
                  <div className="floating-card card-2">🚀</div>
                  <div className="floating-card card-3">⚡</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="container">
            <h2 className="section-title">Why Choose VikraHub?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Strategic Approach</h3>
                <p>We develop comprehensive strategies tailored to your business goals and market needs.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Fast Delivery</h3>
                <p>Quick turnaround times without compromising on quality or attention to detail.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔧</div>
                <h3>Expert Team</h3>
                <p>Skilled professionals with years of experience in cutting-edge technologies.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Proven Results</h3>
                <p>Track record of successful projects and satisfied clients across various industries.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">150+</div>
                <div className="stat-label">Projects Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Happy Clients</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5+</div>
                <div className="stat-label">Years Experience</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support Available</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Start Your Project?</h2>
              <p>Let's discuss how we can help bring your vision to life.</p>
              <button className="btn btn-primary btn-large">Contact Us Today</button>
            </div>
          </div>
        </section>
      </div>
  );
}

export default Home;