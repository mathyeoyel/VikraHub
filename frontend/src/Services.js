import React from 'react';
import './Services.css';

const Services = () => {
  return (
    <div className="services">
      {/* Hero Section */}
      <section className="services-hero">
        <div className="container">
          <div className="services-hero-content">
            <h1>Empowering South Sudanese Creativity</h1>
            <p className="hero-subtitle">
              Comprehensive services designed to support artists, creators, and cultural preservationists 
              in South Sudan. From digital asset management to cultural documentation.
            </p>
            <div className="hero-buttons">
              <a href="#get-started" className="btn btn-primary btn-large">Get Started Today</a>
              <a href="#consultation" className="btn btn-secondary btn-large">Free Consultation</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="services-overview">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">
            Everything you need to preserve, showcase, and monetize South Sudanese cultural assets
          </p>
          
          <div className="services-grid">
            {/* Digital Asset Management */}
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-palette icon"></i></div>
              <h3>Digital Asset Management</h3>
              <p>Secure storage, organization, and management of your cultural and creative digital assets.</p>
              <ul className="service-features">
                <li>Cloud-based secure storage</li>
                <li>Advanced tagging and categorization</li>
                <li>Version control and backup</li>
                <li>Easy sharing and collaboration</li>
                <li>Mobile access and sync</li>
              </ul>
              <div className="service-pricing">
                <span className="price">Starting at $10/month</span>
              </div>
              <a href="#contact" className="service-btn">Learn More</a>
            </div>

            {/* Cultural Documentation */}
            <div className="service-card featured">
              <div className="featured-badge">Most Popular</div>
              <div className="service-icon"><i className="fas fa-book icon"></i></div>
              <h3>Cultural Documentation</h3>
              <p>Professional documentation and preservation of South Sudanese cultural practices, stories, and traditions.</p>
              <ul className="service-features">
                <li>Video documentation services</li>
                <li>Audio recording and editing</li>
                <li>Cultural research and archiving</li>
                <li>Multilingual transcription</li>
                <li>Digital storytelling support</li>
              </ul>
              <div className="service-pricing">
                <span className="price">Starting at $50/project</span>
              </div>
              <a href="#contact" className="service-btn">Get Started</a>
            </div>

            {/* Marketplace Integration */}
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-shopping-bag icon"></i></div>
              <h3>Marketplace Integration</h3>
              <p>Connect with buyers and sell your cultural assets through our integrated marketplace platform.</p>
              <ul className="service-features">
                <li>Professional portfolio creation</li>
                <li>Payment processing integration</li>
                <li>Customer management tools</li>
                <li>Marketing and promotion support</li>
                <li>Analytics and insights</li>
              </ul>
              <div className="service-pricing">
                <span className="price">5% commission on sales</span>
              </div>
              <a href="#contact" className="service-btn">Join Marketplace</a>
            </div>

            {/* Creative Training */}
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-graduation-cap icon"></i></div>
              <h3>Creative Training & Workshops</h3>
              <p>Skill development programs for South Sudanese artists and cultural practitioners.</p>
              <ul className="service-features">
                <li>Digital art and design courses</li>
                <li>Photography and videography</li>
                <li>Traditional craft digitization</li>
                <li>Business skills for creators</li>
                <li>Cultural preservation techniques</li>
              </ul>
              <div className="service-pricing">
                <span className="price">$25-100/workshop</span>
              </div>
              <a href="#contact" className="service-btn">View Workshops</a>
            </div>

            {/* Cultural Research */}
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-search icon"></i></div>
              <h3>Cultural Research Services</h3>
              <p>In-depth research and analysis of South Sudanese cultural heritage and contemporary practices.</p>
              <ul className="service-features">
                <li>Ethnographic research</li>
                <li>Historical documentation</li>
                <li>Community interviews</li>
                <li>Cultural mapping</li>
                <li>Academic publication support</li>
              </ul>
              <div className="service-pricing">
                <span className="price">Custom pricing</span>
              </div>
              <a href="#contact" className="service-btn">Request Quote</a>
            </div>

            {/* Technical Support */}
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-cog icon"></i></div>
              <h3>Technical Support & Consulting</h3>
              <p>Expert technical guidance for digital transformation and technology adoption.</p>
              <ul className="service-features">
                <li>Platform training and onboarding</li>
                <li>Custom integration solutions</li>
                <li>Digital workflow optimization</li>
                <li>24/7 technical support</li>
                <li>Regular system updates</li>
              </ul>
              <div className="service-pricing">
                <span className="price">$75/hour consultation</span>
              </div>
              <a href="#contact" className="service-btn">Get Support</a>
            </div>
          </div>
        </div>
      </section>

      {/* Service Process */}
      <section className="service-process">
        <div className="container">
          <h2 className="section-title">How We Work</h2>
          <p className="section-subtitle">
            Our streamlined process ensures quality results and client satisfaction
          </p>
          
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">01</div>
              <h3>Consultation</h3>
              <p>We start with a detailed consultation to understand your specific needs and cultural context.</p>
            </div>
            <div className="process-step">
              <div className="step-number">02</div>
              <h3>Planning</h3>
              <p>Our team develops a customized plan tailored to your project requirements and timeline.</p>
            </div>
            <div className="process-step">
              <div className="step-number">03</div>
              <h3>Execution</h3>
              <p>We implement the solution with regular updates and quality checkpoints throughout the process.</p>
            </div>
            <div className="process-step">
              <div className="step-number">04</div>
              <h3>Delivery</h3>
              <p>Final delivery includes training, documentation, and ongoing support for sustainable success.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pricing-plans">
        <div className="container">
          <h2 className="section-title">Choose Your Plan</h2>
          <p className="section-subtitle">
            Flexible pricing options to support creators at every stage
          </p>
          
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price-amount">
                <span className="currency">$</span>
                <span className="amount">10</span>
                <span className="period">/month</span>
              </div>
              <ul className="plan-features">
                <li>5GB secure storage</li>
                <li>Basic asset management</li>
                <li>Community support</li>
                <li>Mobile app access</li>
                <li>Basic analytics</li>
              </ul>
              <a href="#signup" className="plan-btn">Get Started</a>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price-amount">
                <span className="currency">$</span>
                <span className="amount">35</span>
                <span className="period">/month</span>
              </div>
              <ul className="plan-features">
                <li>50GB secure storage</li>
                <li>Advanced asset management</li>
                <li>Marketplace access</li>
                <li>Priority support</li>
                <li>Advanced analytics</li>
                <li>Cultural documentation tools</li>
                <li>Workshop access</li>
              </ul>
              <a href="#signup" className="plan-btn">Choose Professional</a>
            </div>

            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price-amount">
                <span className="currency">$</span>
                <span className="amount">99</span>
                <span className="period">/month</span>
              </div>
              <ul className="plan-features">
                <li>Unlimited storage</li>
                <li>Custom integrations</li>
                <li>Dedicated support</li>
                <li>White-label solutions</li>
                <li>API access</li>
                <li>Custom training programs</li>
                <li>Research collaboration</li>
              </ul>
              <a href="#contact" className="plan-btn">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="success-stories">
        <div className="container">
          <h2 className="section-title">Success Stories</h2>
          <p className="section-subtitle">
            See how VikraHub is transforming South Sudanese cultural preservation
          </p>
          
          <div className="stories-grid">
            <div className="story-card">
              <div className="story-image">
                <img src="/assets/story1.jpg" alt="Cultural preservation project" />
              </div>
              <div className="story-content">
                <h3>Preserving Dinka Traditional Music</h3>
                <p>
                  Working with local musicians in Juba, we documented over 200 traditional Dinka songs, 
                  creating a comprehensive digital archive for future generations.
                </p>
                <div className="story-stats">
                  <span>200+ Songs Preserved</span>
                  <span>15 Musicians Involved</span>
                  <span>3 Languages Documented</span>
                </div>
              </div>
            </div>

            <div className="story-card">
              <div className="story-image">
                <img src="/assets/story2.jpg" alt="Artisan marketplace success" />
              </div>
              <div className="story-content">
                <h3>Empowering Local Artisans</h3>
                <p>
                  Through our marketplace platform, South Sudanese artisans have connected with 
                  international buyers, increasing their income by an average of 300%.
                </p>
                <div className="story-stats">
                  <span>50+ Artisans Supported</span>
                  <span>300% Income Increase</span>
                  <span>25 Countries Reached</span>
                </div>
              </div>
            </div>

            <div className="story-card">
              <div className="story-image">
                <img src="/assets/story3.jpg" alt="Digital storytelling workshop" />
              </div>
              <div className="story-content">
                <h3>Digital Storytelling Initiative</h3>
                <p>
                  Our workshops have trained over 100 young South Sudanese to use digital tools 
                  for preserving and sharing their cultural stories.
                </p>
                <div className="story-stats">
                  <span>100+ Young People Trained</span>
                  <span>50+ Stories Created</span>
                  <span>10 Communities Involved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="services-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Preserve Your Cultural Heritage?</h2>
            <p>
              Join thousands of South Sudanese creators who are using VikraHub to preserve, 
              showcase, and monetize their cultural assets.
            </p>
            <div className="cta-buttons">
              <a href="#signup" className="cta-btn primary">Start Your Journey</a>
              <a href="#contact" className="cta-btn secondary">Schedule Consultation</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
