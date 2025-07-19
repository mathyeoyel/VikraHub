import React from 'react';
import { Link } from 'react-router-dom';
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
                  <Link to="/marketplace" className="hero-btn hero-btn-primary">Get Started</Link>
                  <Link to="/services" className="hero-btn hero-btn-secondary">Learn More</Link>
                </div>
              </div>
              <div className="hero-image">
                <img 
                  src="/vikrahub-hero.jpg" 
                  alt="VikraHub - Digital Solutions" 
                  className="hero-main-image"
                  onError={(e) => {
                    console.error('Hero image failed to load, falling back to placeholder');
                    e.target.src = '/hero-placeholder.jpg';
                  }}
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

        {/* Services Overview Section */}
        <section className="services-overview">
          <div className="container">
            <h2 className="section-title">Our Digital Solutions</h2>
            <p className="section-subtitle">Comprehensive services to power your digital transformation</p>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">🌐</div>
                <h3>Web Development</h3>
                <p>Custom websites and web applications built with modern technologies for optimal performance.</p>
                <ul className="service-features">
                  <li>React & Next.js</li>
                  <li>Django & Node.js</li>
                  <li>Responsive Design</li>
                </ul>
              </div>
              <div className="service-card">
                <div className="service-icon">📱</div>
                <h3>Mobile Apps</h3>
                <p>Native and cross-platform mobile applications that deliver exceptional user experiences.</p>
                <ul className="service-features">
                  <li>iOS & Android</li>
                  <li>React Native</li>
                  <li>App Store Publishing</li>
                </ul>
              </div>
              <div className="service-card">
                <div className="service-icon">🎨</div>
                <h3>UI/UX Design</h3>
                <p>Beautiful, intuitive designs that engage users and drive conversions.</p>
                <ul className="service-features">
                  <li>User Research</li>
                  <li>Prototyping</li>
                  <li>Brand Identity</li>
                </ul>
              </div>
              <div className="service-card">
                <div className="service-icon">🛒</div>
                <h3>E-commerce</h3>
                <p>Complete online store solutions with payment integration and inventory management.</p>
                <ul className="service-features">
                  <li>Custom Platforms</li>
                  <li>Payment Gateways</li>
                  <li>Analytics Dashboard</li>
                </ul>
              </div>
              <div className="service-card">
                <div className="service-icon">📈</div>
                <h3>Digital Marketing</h3>
                <p>Strategic marketing campaigns to boost your online presence and drive growth.</p>
                <ul className="service-features">
                  <li>SEO Optimization</li>
                  <li>Social Media</li>
                  <li>Content Strategy</li>
                </ul>
              </div>
              <div className="service-card">
                <div className="service-icon">☁️</div>
                <h3>Cloud Solutions</h3>
                <p>Scalable cloud infrastructure and deployment solutions for modern applications.</p>
                <ul className="service-features">
                  <li>AWS & Azure</li>
                  <li>DevOps Setup</li>
                  <li>24/7 Monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Marketplace Preview Section */}
        <section className="marketplace-preview">
          <div className="container">
            <h2 className="section-title">Digital Assets Marketplace</h2>
            <p className="section-subtitle">Discover premium templates, designs, and digital resources</p>
            <div className="marketplace-content">
              <div className="marketplace-features">
                <div className="marketplace-feature">
                  <div className="feature-icon">🎨</div>
                  <h3>Premium Templates</h3>
                  <p>High-quality website templates, UI kits, and design systems ready for your projects.</p>
                </div>
                <div className="marketplace-feature">
                  <div className="feature-icon">💎</div>
                  <h3>Digital Assets</h3>
                  <p>Icons, graphics, fonts, and multimedia resources from talented creators worldwide.</p>
                </div>
                <div className="marketplace-feature">
                  <div className="feature-icon">🚀</div>
                  <h3>Code Resources</h3>
                  <p>Reusable components, plugins, and development tools to accelerate your workflow.</p>
                </div>
              </div>
              <div className="marketplace-stats">
                <div className="stat-card">
                  <span className="stat-number">1000+</span>
                  <span className="stat-label">Digital Assets</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Templates</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">100+</span>
                  <span className="stat-label">Creators</span>
                </div>
              </div>
            </div>
            <div className="marketplace-cta">
              <Link to="/marketplace" className="btn btn-primary btn-large">Browse Marketplace</Link>
              <Link to="/marketplace" className="btn btn-secondary btn-large">Become a Seller</Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works">
          <div className="container">
            <h2 className="section-title">How We Work</h2>
            <p className="section-subtitle">Our proven process for delivering exceptional results</p>
            <div className="process-steps">
              <div className="process-step">
                <div className="step-number">01</div>
                <div className="step-content">
                  <h3>Discovery & Planning</h3>
                  <p>We analyze your requirements, understand your goals, and create a detailed project roadmap.</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">02</div>
                <div className="step-content">
                  <h3>Design & Development</h3>
                  <p>Our expert team designs and develops your solution using cutting-edge technologies.</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">03</div>
                <div className="step-content">
                  <h3>Testing & Launch</h3>
                  <p>Rigorous testing ensures quality, followed by a smooth launch and deployment process.</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">04</div>
                <div className="step-content">
                  <h3>Support & Growth</h3>
                  <p>Ongoing maintenance, updates, and optimization to ensure continued success.</p>
                </div>
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
              <Link to="/services" className="btn btn-primary btn-large">Contact Us Today</Link>
            </div>
          </div>
        </section>
      </div>
  );
}

export default Home;