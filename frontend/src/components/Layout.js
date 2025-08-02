import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './Auth/AuthContext';
import UserMenu from './Auth/UserMenu';
import AuthModal from './Auth/AuthModal';
import SearchOverlay from './SearchOverlay';
import CreateButton from './common/CreateButton';
import logoImage from '../assets/images/logo.webp';
import './Layout.css';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);
  const menuToggleRef = useRef(null);
  const searchRef = useRef(null);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Close menu when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setIsMenuOpen(false);
      setAuthModalOpen(false);
    }
  }, [isAuthenticated]);

  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && 
          navRef.current && 
          !navRef.current.contains(event.target) &&
          menuToggleRef.current &&
          !menuToggleRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      // Close expanded search if clicking outside
      if (isSearchExpanded && 
          searchRef.current &&
          !searchRef.current.contains(event.target)) {
        setIsSearchExpanded(false);
      }
    };

    // Handle escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
      if (event.key === 'Escape' && isSearchExpanded) {
        setIsSearchExpanded(false);
      }
    };

    if (isMenuOpen || isSearchExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Prevent scrolling when menu is open, but not when search is expanded
      if (isMenuOpen) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen, isSearchExpanded]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setIsMenuOpen(false); // Close menu when opening auth modal
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Show search overlay for longer queries
    if (value.trim().length > 2) {
      setShowSearchOverlay(true);
    } else {
      setShowSearchOverlay(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setShowSearchOverlay(true);
      // Also collapse the expandable search on mobile
      setIsSearchExpanded(false);
    }
  };

  const toggleSearch = () => {
    console.log('Search toggle clicked, current state:', isSearchExpanded);
    const newExpanded = !isSearchExpanded;
    setIsSearchExpanded(newExpanded);
    
    // Focus the search input when expanding, especially important for mobile
    if (newExpanded) {
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input-expanded');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100); // Small delay to ensure the input is rendered
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <a href="/" className="logo" onClick={() => {
            closeMenu();
            window.location.reload();
          }}>
            <img src={logoImage} alt="VikraHub" className="logo-img" />
            <span className="logo-text">VikraHub</span>
          </a>
          
          {/* Search Bar - Facebook-style - Only show when not authenticated on desktop */}
          {!isAuthenticated && (
            <div className="header-search">
              <form className="search-container" onSubmit={handleSearchSubmit}>
                <i className="fas fa-search search-icon"></i>
                <input 
                  type="text" 
                  placeholder="Search VikraHub..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </form>
            </div>
          )}
          
          <div className="mobile-header-controls">
            {isAuthenticated ? (
              <div className="mobile-auth-section">
                {/* Mobile Expandable Search */}
                <div ref={searchRef} className={`expandable-search mobile-search ${isSearchExpanded ? 'expanded' : ''}`}>
                  <button 
                    className="icon-button search-toggle" 
                    onClick={toggleSearch}
                    title="Search"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                  <div className="expandable-search-input">
                    <form onSubmit={handleSearchSubmit}>
                      <input 
                        type="search" 
                        placeholder="Search VikraHub..." 
                        className="search-input-expanded"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        autoFocus={isSearchExpanded}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        inputMode="search"
                      />
                    </form>
                  </div>
                </div>
                {user && (user.is_staff || user.is_superuser) && (
                  <Link to="/admin" className="mobile-admin-link" onClick={closeMenu}>
                    Admin
                  </Link>
                )}
                <UserMenu onMenuAction={closeMenu} />
              </div>
            ) : (
              <div className="mobile-auth-buttons">
                <button 
                  className="mobile-get-started-btn" 
                  onClick={() => openAuthModal('login')}
                >
                  Get Started
                </button>
              </div>
            )}
            <button 
              ref={menuToggleRef}
              className="menu-toggle"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
          <nav ref={navRef} className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <a href="/" className="nav-link" onClick={() => {
              closeMenu();
              window.location.reload();
            }} title="Home">
              <i className="fas fa-home"></i>
              <span>Home</span>
            </a>
            <Link to="/creators" className="nav-link" onClick={closeMenu} title="Creators">
              <i className="fas fa-users"></i>
              <span>Creators</span>
            </Link>
            <Link to="/marketplace" className="nav-link" onClick={closeMenu} title="Marketplace">
              <i className="fas fa-store"></i>
              <span>Marketplace</span>
            </Link>

            <Link to="/freelance" className="nav-link" onClick={closeMenu} title="Freelance">
              <i className="fas fa-briefcase"></i>
              <span>Freelance</span>
            </Link>
            <Link to="/services" className="nav-link" onClick={closeMenu} title="Services">
              <i className="fas fa-cogs"></i>
              <span>Services</span>
            </Link>
            
            {/* Desktop auth section - hidden on mobile */}
            <div className="desktop-auth-section">
              {isAuthenticated ? (
                <div className="auth-section">
                  <div className="header-icons">
                    {/* Expandable Search Icon */}
                    <div ref={searchRef} className={`expandable-search ${isSearchExpanded ? 'expanded' : ''}`}>
                      <button 
                        className="icon-button search-toggle" 
                        onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                        title="Search"
                      >
                        <i className="fas fa-search"></i>
                      </button>
                      <div className="expandable-search-input">
                        <form onSubmit={handleSearchSubmit}>
                          <input 
                            type="search" 
                            placeholder="Search VikraHub..." 
                            className="search-input-expanded"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            autoFocus={isSearchExpanded}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            inputMode="search"
                          />
                        </form>
                      </div>
                    </div>
                    <button className="icon-button" title="Messages">
                      <i className="fas fa-envelope"></i>
                    </button>
                    <button className="icon-button" title="Notifications">
                      <i className="fas fa-bell"></i>
                    </button>
                  </div>
                  {user && (user.is_staff || user.is_superuser) && (
                    <Link to="/admin" className="nav-link admin-link" onClick={closeMenu}>
                      Admin
                    </Link>
                  )}
                  <UserMenu onMenuAction={closeMenu} />
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
            </div>
          </nav>
        </div>
      </header>
      
      {/* Secondary Navigation Bar */}
      <nav className="secondary-navbar">
        <div className="container">
          <div className="secondary-nav-links">
            <a href="/" className="secondary-nav-link" onClick={() => {
              closeMenu();
              window.location.reload();
            }}>
              <i className="fas fa-home"></i>
              <span>Home</span>
            </a>
            <Link to="/inspiration" className="secondary-nav-link" onClick={closeMenu}>
              <i className="fas fa-lightbulb"></i>
              <span>Inspiration</span>
            </Link>
            
            {/* Create Button */}
            <CreateButton />
            
            <Link to="/posts" className="secondary-nav-link" onClick={closeMenu}>
              <i className="fas fa-list-alt"></i>
              <span>Posts</span>
            </Link>
            
            <Link to="/blog" className="secondary-nav-link" onClick={closeMenu}>
              <i className="fas fa-edit"></i>
              <span>Blog</span>
            </Link>
          </div>
        </div>
      </nav>
      
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
            </div>
            
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a href="https://facebook.com/vikrahub" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-facebook"></i>
                  Facebook
                </a>
                <a href="https://instagram.com/vikrahub" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-instagram"></i>
                  Instagram
                </a>
                <a href="https://linkedin.com/company/vikrahub" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-linkedin"></i>
                  LinkedIn
                </a>
                <a href="https://twitter.com/vikrahub" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-twitter"></i>
                  Twitter
                </a>
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
      
      <SearchOverlay
        query={searchQuery}
        isVisible={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
      />
    </div>
  );
};

export default Layout;
