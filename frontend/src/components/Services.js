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
              <div className="service-icon">�</div>
              <h3>Talent Discovery for Organizations</h3>
              <p>Find and collaborate with the best creative minds from South Sudan.</p>
              <ul className="service-features">
                <li>Search and filter creatives by skill, location, or style</li>
                <li>Browse verified creator profiles and portfolios</li>
                <li>Connect directly for projects, commissions, or partnerships</li>
              </ul>
              <div className="service-pricing">
                <span className="price">Free to browse</span>
              </div>
              <a href="#browse" className="service-btn">Find Talent</a>
            </div>

            {/* Custom Commissions */}
            <div className="service-card">
              <div className="service-icon">🛍️</div>
              <h3>Custom Commissions</h3>
              <p>Bring your project to life with local talent.</p>
              <ul className="service-features">
                <li>Post your creative project needs (design, photography, branding, illustration, etc.)</li>
                <li>Receive proposals from talented creators</li>
                <li>Collaborate easily and support the local creative economy</li>
              </ul>
              <div className="service-pricing">
                <span className="price">5% platform fee</span>
              </div>
              <a href="#commission" className="service-btn">Post Project</a>
            </div>

            {/* Curated Inspiration */}
            <div className="service-card">
              <div className="service-icon">�</div>
              <h3>Curated Inspiration & Resources</h3>
              <p>Fuel your imagination and grow your skills.</p>
              <ul className="service-features">
                <li>Explore themed galleries and collections by South Sudanese artists</li>
                <li>Access creative guides, tips, and resources</li>
                <li>Stay inspired by stories, features, and highlights from our community</li>
              </ul>
              <div className="service-pricing">
                <span className="price">Free access</span>
              </div>
              <a href="#inspiration" className="service-btn">Explore</a>
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
              <div className="service-pricing">
                <span className="price">$20-100/event</span>
              </div>
              <a href="#workshops" className="service-btn">View Events</a>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Preview/Demo */}
      <section className="service-process">
        <div className="container">
          <h2 className="section-title">See VikraHub in Action</h2>
          <p className="section-subtitle">
            Discover how easy it is to connect, create, and collaborate on VikraHub
          </p>
          
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">👤</div>
              <h3>Create Your Profile</h3>
              <p>Build a stunning portfolio in minutes with our intuitive profile builder. Upload your best work and tell your story.</p>
            </div>
            <div className="process-step">
              <div className="step-number">🔍</div>
              <h3>Get Discovered</h3>
              <p>Our smart matching system connects you with clients and collaborators looking for your specific skills and style.</p>
            </div>
            <div className="process-step">
              <div className="step-number">💼</div>
              <h3>Land Projects</h3>
              <p>Receive commission requests, negotiate terms, and work on exciting projects with local and international clients.</p>
            </div>
            <div className="process-step">
              <div className="step-number">🎓</div>
              <h3>Keep Growing</h3>
              <p>Access workshops, connect with mentors, and continuously develop your skills within our supportive community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="pricing-plans">
        <div className="container">
          <h2 className="section-title">VikraHub by the Numbers</h2>
          <p className="section-subtitle">
            Join a thriving community of South Sudanese creatives making real impact
          </p>
          
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Active Creators</h3>
              <div className="price-amount">
                <span className="amount">500+</span>
              </div>
              <ul className="plan-features">
                <li>Artists and designers</li>
                <li>Photographers and videographers</li>
                <li>Writers and storytellers</li>
                <li>Traditional craft makers</li>
                <li>Musicians and performers</li>
              </ul>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Growing Fast</div>
              <h3>Projects Completed</h3>
              <div className="price-amount">
                <span className="amount">1,200+</span>
              </div>
              <ul className="plan-features">
                <li>Brand design projects</li>
                <li>Photography commissions</li>
                <li>Cultural documentation</li>
                <li>Educational content</li>
                <li>Community art initiatives</li>
              </ul>
            </div>

            <div className="pricing-card">
              <h3>Organizations Served</h3>
              <div className="price-amount">
                <span className="amount">150+</span>
              </div>
              <ul className="plan-features">
                <li>Local businesses</li>
                <li>NGOs and nonprofits</li>
                <li>Government agencies</li>
                <li>International organizations</li>
                <li>Educational institutions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Creators Spotlight */}
      <section className="success-stories">
        <div className="container">
          <h2 className="section-title">Meet Our Featured Creators</h2>
          <p className="section-subtitle">
            Discover the talented South Sudanese creatives making waves on VikraHub
          </p>
          
          <div className="stories-grid">
            <div className="story-card">
              <div className="story-image">
                <img src="/assets/hero-placeholder.jpg" alt="Sarah Akech - Visual Artist" />
              </div>
              <div className="story-content">
                <h3>Sarah Akech - Visual Artist</h3>
                <p>
                  "VikraHub connected me with clients across East Africa. I've completed over 50 brand design projects 
                  and even had my artwork featured in international exhibitions."
                </p>
                <div className="story-stats">
                  <span>🎨 50+ Projects</span>
                  <span>🌍 12 Countries</span>
                  <span>⭐ 4.9/5 Rating</span>
                </div>
              </div>
            </div>

            <div className="story-card">
              <div className="story-image">
                <img src="/assets/hero-placeholder.jpg" alt="James Mabior - Photographer" />
              </div>
              <div className="story-content">
                <h3>James Mabior - Photographer</h3>
                <p>
                  "From wedding photography to documenting cultural events, VikraHub has given me a platform 
                  to showcase South Sudanese beauty to the world."
                </p>
                <div className="story-stats">
                  <span>📸 200+ Shoots</span>
                  <span>💑 100+ Weddings</span>
                  <span>🏆 Award Winner</span>
                </div>
              </div>
            </div>

            <div className="story-card">
              <div className="story-image">
                <img src="/assets/hero-placeholder.jpg" alt="Mary Nyong - Craft Artist" />
              </div>
              <div className="story-content">
                <h3>Mary Nyong - Traditional Craft Artist</h3>
                <p>
                  "I learned to digitize my traditional crafts through VikraHub workshops. Now I sell 
                  internationally and teach other artisans online."
                </p>
                <div className="story-stats">
                  <span>🧺 300+ Items Sold</span>
                  <span>🎓 50+ Students</span>
                  <span>🌟 Featured Artist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose VikraHub */}
      <section className="success-stories">
        <div className="container">
          <h2 className="section-title">Why Choose VikraHub?</h2>
          <p className="section-subtitle">
            We are dedicated to uplifting South Sudanese talent with trusted community support
          </p>
          
          <div className="stories-grid">
            <div className="story-card">
              <div className="story-image">
                <img src="/assets/hero-placeholder.jpg" alt="Local Focus" />
              </div>
              <div className="story-content">
                <h3>🇸🇸 Local Focus</h3>
                <p>
                  We are dedicated to uplifting South Sudanese talent and celebrating our unique cultural heritage 
                  through creative expression and community building.
                </p>
              </div>
            </div>

            <div className="story-card">
              <div className="story-image">
                <img src="/assets/hero-placeholder.jpg" alt="Trusted Community" />
              </div>
              <div className="story-content">
                <h3>🤝 Trusted Community</h3>
                <p>
                  A safe, supportive, and inspiring space for all creators to connect, collaborate, 
                  and grow together in a verified and welcoming environment.
                </p>
              </div>
            </div>

            <div className="story-card">
              <div className="story-image">
                <img src="/assets/hero-placeholder.jpg" alt="Easy Connections" />
              </div>
              <div className="story-content">
                <h3>🔗 Easy Connections</h3>
                <p>
                  Simple tools to connect creators with real opportunities, making it effortless 
                  to find collaborators, clients, and creative partnerships.
                </p>
              </div>
            </div>

            <div className="story-card">
              <div className="story-image">
                <img src="/assets/hero-placeholder.jpg" alt="Professional Growth" />
              </div>
              <div className="story-content">
                <h3>📈 Professional Growth</h3>
                <p>
                  Resources and events designed to help you thrive, including workshops, mentorship 
                  opportunities, and skill-building programs tailored for South Sudanese creatives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="service-process">
        <div className="container">
          <h2 className="section-title">Upcoming Events & Workshops</h2>
          <p className="section-subtitle">
            Join our community events designed to grow your skills and expand your network
          </p>
          
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">📅</div>
              <h3>Digital Photography Masterclass</h3>
              <p><strong>Jan 25, 2025</strong> - Learn advanced photography techniques and post-processing skills. Led by award-winning photographer David Garang.</p>
              <a href="#register" className="service-btn" style={{marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1rem', fontSize: '0.9rem'}}>Register - $35</a>
            </div>
            <div className="process-step">
              <div className="step-number">🎨</div>
              <h3>Brand Design for Local Businesses</h3>
              <p><strong>Feb 8, 2025</strong> - Create compelling brand identities for South Sudanese businesses. Workshop includes client acquisition strategies.</p>
              <a href="#register" className="service-btn" style={{marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1rem', fontSize: '0.9rem'}}>Register - $50</a>
            </div>
            <div className="process-step">
              <div className="step-number">💼</div>
              <h3>Freelancing Success Summit</h3>
              <p><strong>Feb 22, 2025</strong> - Learn pricing strategies, client management, and business growth tactics from successful VikraHub creators.</p>
              <a href="#register" className="service-btn" style={{marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1rem', fontSize: '0.9rem'}}>Register - Free</a>
            </div>
            <div className="process-step">
              <div className="step-number">🤝</div>
              <h3>Creator Networking Night</h3>
              <p><strong>Mar 5, 2025</strong> - Connect with fellow creators, potential collaborators, and industry professionals in Juba. Food and drinks included!</p>
              <a href="#register" className="service-btn" style={{marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1rem', fontSize: '0.9rem'}}>Register - $20</a>
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
              Whether you're a creator looking to share your work, or an organization seeking the best local talent—VikraHub is your creative home.
            </p>
            <div className="cta-buttons">
              <a href="#signup" className="cta-btn primary">Sign Up as a Creator</a>
              <a href="#find-talent" className="cta-btn secondary">Find Talent</a>
              <a href="#contact" className="cta-btn secondary">Contact Us</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="success-stories">
        <div className="container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about getting started with VikraHub
          </p>
          
          <div className="stories-grid">
            <div className="story-card">
              <div className="story-content">
                <h3>❓ How do I get started as a creator?</h3>
                <p>
                  Simply sign up for free, create your profile, upload your best work, and start applying for projects. 
                  Our team will review your profile and provide feedback to help you optimize it for success.
                </p>
              </div>
            </div>

            <div className="story-card">
              <div className="story-content">
                <h3>💰 How does payment work?</h3>
                <p>
                  We use secure payment processing with multiple options including mobile money, bank transfers, and digital wallets. 
                  Payments are released when project milestones are completed and approved.
                </p>
              </div>
            </div>

            <div className="story-card">
              <div className="story-content">
                <h3>🔍 How do organizations find me?</h3>
                <p>
                  Our smart matching algorithm considers your skills, location, portfolio quality, and client preferences. 
                  You can also apply directly to posted projects that match your expertise.
                </p>
              </div>
            </div>

            <div className="story-card">
              <div className="story-content">
                <h3>🎓 Are workshops really worth it?</h3>
                <p>
                  Absolutely! Our workshops are led by industry experts and successful VikraHub creators. 
                  Participants report 40% higher project success rates and 60% more repeat clients after attending.
                </p>
              </div>
            </div>

            <div className="story-card">
              <div className="story-content">
                <h3>🌍 Can I work with international clients?</h3>
                <p>
                  Yes! Many of our creators work with clients across Africa and internationally. 
                  We provide tools and support for cross-border collaboration and payments.
                </p>
              </div>
            </div>

            <div className="story-card">
              <div className="story-content">
                <h3>📱 Is there a mobile app?</h3>
                <p>
                  Our platform is fully mobile-responsive, and we're launching dedicated iOS and Android apps in Q2 2025. 
                  Join our beta testing program to get early access!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Projects Section */}
      <section className="service-process">
        <div className="container">
          <h2 className="section-title">Need Something Custom?</h2>
          <p className="section-subtitle">
            We're happy to discuss special projects, partnerships, and more.
          </p>
          
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">📧</div>
              <h3>Email Us</h3>
              <p>Drop us a line at <strong>info@vikrahub.com</strong> for custom projects and partnerships.</p>
            </div>
            <div className="process-step">
              <div className="step-number">📞</div>
              <h3>Call Us</h3>
              <p>Speak directly with our team at <strong>+211922931515</strong> for immediate assistance.</p>
            </div>
            <div className="process-step">
              <div className="step-number">🤝</div>
              <h3>Partnership</h3>
              <p>Explore collaboration opportunities and custom solutions tailored to your needs.</p>
            </div>
            <div className="process-step">
              <div className="step-number">🚀</div>
              <h3>Get Started</h3>
              <p>Launch your project with the support of our dedicated team and creative community.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
