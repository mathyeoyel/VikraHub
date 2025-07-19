import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './Auth/AuthContext';
import UserMenu from './Auth/UserMenu';
import AuthModal from './Auth/AuthModal';
import logoImage from '../assets/images/logo.webp';
import './Layout.css';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { isAuthenticated, user } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
            <img src={logoImage} alt="VikraHub" className="logo-img" />
            <span className="logo-text">VikraHub</span>
          </Link>
          <button 
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/members" className="nav-link" onClick={() => setIsMenuOpen(false)}>Members</Link>
            <Link to="/marketplace" className="nav-link" onClick={() => setIsMenuOpen(false)}>Marketplace</Link>
            <Link to="/freelance" className="nav-link" onClick={() => setIsMenuOpen(false)}>Freelance</Link>
            <Link to="/services" className="nav-link" onClick={() => setIsMenuOpen(false)}>Services</Link>
            
            {isAuthenticated ? (
              <div className="auth-section">
                <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                <Link to="/upload-asset" className="nav-link" onClick={() => setIsMenuOpen(false)}>Upload Asset</Link>
                {user && (user.is_staff || user.is_superuser) && (
                  <Link to="/admin" className="nav-link admin-link" onClick={() => setIsMenuOpen(false)}>
                    Admin
                  </Link>
                )}
                <UserMenu />
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  className="nav-link get-started-btn" 
                  onClick={() => openAuthModal('login')}
                >
                  Get Started
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <Link to="/" className="footer-logo">
                <img src={logoImage} alt="VikraHub" className="footer-logo-img" />
                <span className="footer-logo-text">VikraHub</span>
              </Link>
              <p>Empowering South Sudanese creatives with digital solutions and marketplace opportunities.</p>
            </div>
            
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/creators">Explore Creators</Link></li>
                <li><Link to="/services">Services</Link></li>
                <li><Link to="/collections">Collections</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Our Services</h4>
              <ul>
                <li><Link to="/services">Creator Portfolios</Link></li>
                <li><Link to="/services">Talent Discovery</Link></li>
                <li><Link to="/services">Custom Commissions</Link></li>
                <li><Link to="/services">Inspiration & Resources</Link></li>
                <li><Link to="/services">Workshops & Events</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Contact Info</h4>
              <p>Email: info@vikrahub.com</p>
              <p>Tel: +211922931515 | 0988931515</p>
              
              <div className="social-media">
                <h5>Follow Us</h5>
                <div className="social-links">
                  <a href="https://www.facebook.com/vikra.hub" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="https://www.instagram.com/vikrahub" target="_blank" rel="noopener noreferrer" className="social-link instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="https://www.linkedin.com/in/mathew-yel-0806my" target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                  <a href="https://x.com/mathyeoyel" target="_blank" rel="noopener noreferrer" className="social-link twitter">
                    <i className="fab fa-x-twitter"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 VikraHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      <AuthModal 
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authMode}
      />
    </div>
  );
};

export default Layout;
