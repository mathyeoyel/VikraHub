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
                <h1>Discover, Connect & Empower <span className="highlight">South Sudanese Creatives</span></h1>
                <p className="hero-subtitle">
                  Unleashing the potential of artists, designers, photographers, storytellers, and innovators from South Sudan. 
                  Join VikraHub and get inspired, get discovered, and connect with new opportunities!
                </p>
                <div className="hero-buttons">
                  <Link to="/marketplace" className="hero-btn hero-btn-primary">Get Started</Link>
                  <Link to="/creators" className="hero-btn hero-btn-secondary">Explore Creators</Link>
                </div>
              </div>
              <div className="hero-image">
                <img 
                  src="/vikrahub-hero.jpg" 
                  alt="VikraHub - Empowering South Sudanese Creatives" 
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

        {/* About VikraHub Section */}
        <section className="about-section">
          <div className="container">
            <div className="about-content">
              <h2>Welcome to VikraHub!</h2>
              <p>
                VikraHub is the first platform dedicated to discovering and empowering creative minds from South Sudan. 
                Our mission is to shine a spotlight on local talent, inspire collaboration, and connect creators with the world.
              </p>
              <Link to="/about" className="about-btn">Learn More</Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works">
          <div className="container">
            <h2 className="section-title">How It Works</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Join the Community</h3>
                <p>Sign up for free and create your personalized creator profile.</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Showcase Your Work</h3>
                <p>Upload your photos, artwork, designs, stories, and more to your portfolio.</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Get Discovered</h3>
                <p>Be featured on our platform, connect with fans and collaborators, and unlock new opportunities for growth.</p>
              </div>
            </div>
            <div className="how-it-works-cta">
              <Link to="/register" className="signup-btn">Sign Up Now</Link>
            </div>
          </div>
        </section>

        {/* Our Services Section */}
        <section className="services-overview">
          <div className="container">
            <div className="section-header">
              <h2>Our Services</h2>
              <p>Empowering Creatives, Connecting Opportunities</p>
            </div>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">📁</div>
                <h3>Creator Portfolios</h3>
                <p>Build your digital showcase and grow your audience.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">🔍</div>
                <h3>Talent Discovery</h3>
                <p>Businesses and organizations can find the best creative talent for their projects.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">🎨</div>
                <h3>Custom Commissions</h3>
                <p>Need art, photography, or design? Post your project and hire South Sudanese creatives directly.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">💡</div>
                <h3>Inspiration & Resources</h3>
                <p>Access curated galleries, creative guides, and resources made for and by local talent.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">🎓</div>
                <h3>Workshops & Events</h3>
                <p>Participate in exclusive skill-building workshops, creative challenges, and community events.</p>
              </div>
            </div>
            <div className="services-cta">
              <Link to="/services" className="services-btn">View All Services</Link>
            </div>
          </div>
        </section>

        {/* Featured Creators Section */}
        <section className="featured-creators">
          <div className="container">
            <h2 className="section-title">Featured Creators</h2>
            <p className="section-subtitle">Spotlight on South Sudanese Talent</p>
            <div className="creators-grid">
              <div className="creator-card">
                <div className="creator-avatar">
                  <img src={require('./assets/Akon-peter.jpg')} alt="Akon Peter" />
                </div>
                <h3>Akon Peter</h3>
                <p className="creator-title">Photographer | Juba</p>
                <p className="creator-quote">"Through my lens, I tell stories of resilience and the vibrant spirit of my community."</p>
              </div>
              <div className="creator-card">
                <div className="creator-avatar">
                  <img src={require('./assets/Maduot_chongo.jpg')} alt="Maduot Chongo" />
                </div>
                <h3>Maduot Chongo</h3>
                <p className="creator-title">Designer | Gudele</p>
                <p className="creator-quote">"Art is my universal language—I use creativity to share our stories with the world."</p>
              </div>
              <div className="creator-card">
                <div className="creator-avatar">
                  <img src={require('./assets/Awut_paul.jpg')} alt="Awut Paul" />
                </div>
                <h3>Awut Paul</h3>
                <p className="creator-title">Programmer | Munuki</p>
                <p className="creator-quote">"I blend technology and culture, building digital solutions that reflect and celebrate our heritage."</p>
              </div>
            </div>
            <div className="creators-cta">
              <Link to="/creators" className="creators-btn">Meet All Creators</Link>
            </div>
          </div>
        </section>

        {/* Explore Inspiration Section */}
        <section className="inspiration-section">
          <div className="container">
            <h2 className="section-title">Explore Inspiration</h2>
            <p className="section-subtitle">Curated Collections to Spark Your Creativity</p>
            <div className="collections-grid">
              <div className="collection-card">
                <div className="collection-image">
                  <img src="/assets/collection-urban.jpg" alt="Urban Life in Juba" />
                </div>
                <h3>Urban Life in Juba</h3>
              </div>
              <div className="collection-card">
                <div className="collection-image">
                  <img src="/assets/collection-patterns.jpg" alt="Traditional Patterns & Motifs" />
                </div>
                <h3>Traditional Patterns & Motifs</h3>
              </div>
              <div className="collection-card">
                <div className="collection-image">
                  <img src="/assets/collection-youth.jpg" alt="Youth Voices" />
                </div>
                <h3>Youth Voices</h3>
              </div>
              <div className="collection-card">
                <div className="collection-image">
                  <img src="/assets/collection-wildlife.jpg" alt="Wildlife & Nature" />
                </div>
                <h3>Wildlife & Nature</h3>
              </div>
              <div className="collection-card">
                <div className="collection-image">
                  <img src="/assets/collection-women.jpg" alt="Women in Art" />
                </div>
                <h3>Women in Art</h3>
              </div>
            </div>
            <div className="collections-cta">
              <Link to="/collections" className="collections-btn">Explore Collections</Link>
            </div>
          </div>
        </section>

        {/* Why VikraHub Section */}
        <section className="why-vikrahub">
          <div className="container">
            <h2 className="section-title">Why VikraHub?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🇸🇸</div>
                <h3>Local Focus</h3>
                <p>100% South Sudanese creative community, representing authentic stories and visions.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Easy Discovery</h3>
                <p>Search by skill, city, or creative field.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🚀</div>
                <h3>Opportunities</h3>
                <p>Get noticed by agencies, media, NGOs, and collaborators.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🤝</div>
                <h3>Inclusive Community</h3>
                <p>Connect, collaborate, and support each other.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Growth-Oriented</h3>
                <p>Workshops, competitions, and learning resources to help you level up.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials">
          <div className="container">
            <h2 className="section-title">What Creators Say</h2>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <p className="testimonial-quote">
                  "VikraHub helped me share my art with people I never thought would see it. I've made new friends and clients."
                </p>
                <div className="testimonial-author">
                  <strong>— Peter, Visual Artist</strong>
                </div>
              </div>
              <div className="testimonial-card">
                <p className="testimonial-quote">
                  "This is what South Sudan has been missing. A real home for creatives."
                </p>
                <div className="testimonial-author">
                  <strong>— Amina, Graphic Designer</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Join VikraHub Section */}
        <section className="join-section">
          <div className="container">
            <div className="join-content">
              <h2>Join VikraHub Today</h2>
              <p>
                Ready to get discovered and connect with creative opportunities?
                Whether you're an artist, designer, photographer, storyteller, or simply passionate about creativity—VikraHub is your platform.
              </p>
              <div className="join-buttons">
                <Link to="/register" className="join-btn primary">Sign Up Free</Link>
                <Link to="/contact" className="join-btn secondary">Contact Us</Link>
                <Link to="/partners" className="join-btn tertiary">Partner with Us</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
  );
}

export default Home;