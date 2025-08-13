import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { portfolioAPI } from '../api';
import { validatePortfolioOwnership, logOwnershipCheck } from '../utils/portfolioOwnership';
import { safeSplit, asString } from '../utils/string';
import { getPortfolioImage, handleImageError as handleImageErrorNew } from '../utils/image';
import { useAuth } from './Auth/AuthContext';
import SEO from './common/SEO';
import './Portfolio.css';

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      // Clear the navigation state
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleEdit = (portfolioId) => {
    // 🔒 Double-check ownership before navigation
    const portfolioItem = portfolios.find(item => item.id === portfolioId);
    
    if (!validatePortfolioOwnership(portfolioItem, user, 'edit')) {
      logOwnershipCheck(portfolioItem, user, 'edit', false);
      return;
    }
    
    logOwnershipCheck(portfolioItem, user, 'edit', true);
    navigate(`/upload-work/${portfolioId}`);
  };

  const handleDelete = async (portfolioId) => {
    // 🔒 Verify ownership before deletion
    const portfolioItem = portfolios.find(item => item.id === portfolioId);
    
    if (!validatePortfolioOwnership(portfolioItem, user, 'delete')) {
      logOwnershipCheck(portfolioItem, user, 'delete', false);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      try {
        await portfolioAPI.delete(portfolioId);
        setPortfolios(portfolios.filter(item => item.id !== portfolioId));
        logOwnershipCheck(portfolioItem, user, 'delete', true);
        alert('Portfolio item deleted successfully!');
      } catch (error) {
        console.error('Error deleting portfolio item:', error);
        logOwnershipCheck(portfolioItem, user, 'delete', false);
        if (error.response?.status === 403) {
          alert('You do not have permission to delete this portfolio item.');
        } else {
          alert('Failed to delete portfolio item. Please try again.');
        }
      }
    }
  };

  // Get unique categories for filtering
  const categories = ['all', ...new Set(portfolios.map(item => 
    typeof item.category === 'string' ? item.category : 
    typeof item.category === 'object' && item.category ? 
    (item.category.name || 'general') : 'general'
  ))];

  // Filter portfolios based on selected category
  const filteredPortfolios = filter === 'all' 
    ? portfolios 
    : portfolios.filter(item => {
        const itemCategory = typeof item.category === 'string' ? item.category : 
                           typeof item.category === 'object' && item.category ? 
                           (item.category.name || 'general') : 'general';
        return itemCategory === filter;
      });

  const getCategoryIcon = (category) => {
    const icons = {
      design: '🎨',
      photography: '📸',
      illustration: '🖼️',
      'ui-ux': '💻',
      branding: '🏷️',
      video: '🎬',
      audio: '🎵',
      writing: '✍️',
      code: '💾',
      general: '📦',
      other: '📦'
    };
    return icons[category] || icons.general;
  };

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        // For public portfolio showcase, we need to handle the new scoped API
        // Since we want to show all public portfolios, but our API now requires authentication
        // or username parameter, we'll need to adjust this logic
        let response;
        
        if (user) {
          // If user is authenticated, get all portfolios (will return user's own by default)
          // TODO: We may need a dedicated public endpoint for viewing all portfolios
          response = await portfolioAPI.getAll();
        } else {
          // For non-authenticated users, we'll need a different approach
          // For now, return empty array since the API requires authentication
          response = { data: [] };
          console.warn('Portfolio API now requires authentication. Consider implementing a public showcase endpoint.');
        }
        
        console.log('📊 Portfolio API Response:', response);
        console.log('📊 Portfolio Data:', response.data);
        console.log('📊 First Item Structure:', response.data?.[0]);
        console.log('📊 First Item User:', response.data?.[0]?.user);
        setPortfolios(response.data || []);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        // If authentication fails, show empty portfolio
        setPortfolios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [user]);

  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading amazing portfolio pieces...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="portfolio-section">
      <SEO
        title="Creative Portfolio - Showcase Your Work"
        description="Discover amazing work from talented South Sudanese creatives and showcase your own masterpieces. Browse portfolios, connect with artists, and find inspiration."
        url={`${window.location.origin}/portfolio`}
        image={`${window.location.origin}/vikrahub-hero.jpg`}
      />
      
      <div className="portfolio-container">
        {/* Header Section */}
        <div className="portfolio-header">
          <div className="header-content">
            <h1 className="portfolio-title">Creative Portfolio</h1>
            <p className="portfolio-subtitle">
              Discover amazing work from talented creatives and showcase your own masterpieces
            </p>
          </div>
          {user && (
            <div className="header-actions">
              <button 
                onClick={() => navigate('/create/upload-work')}
                className="add-work-btn"
              >
                <i className="fas fa-plus"></i>
                Add New Work
              </button>
            </div>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            {successMessage}
          </div>
        )}

        {/* Filter Section */}
        <div className="portfolio-filters">
          <h3>Filter by Category</h3>
          <div className="filter-buttons">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`filter-btn ${filter === category ? 'active' : ''}`}
              >
                {category === 'all' ? '🌟' : getCategoryIcon(category)}
                {asString(category).charAt(0).toUpperCase() + asString(category).slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Grid */}
        <div className="portfolio-grid">
          {filteredPortfolios.length === 0 ? (
            <div className="empty-portfolio">
              <div className="empty-icon"><i className="fas fa-palette icon"></i></div>
              <h3>No Portfolio Items Yet</h3>
              <p>
                {filter === 'all' 
                  ? 'Be the first to showcase your creative work!' 
                  : `No items found in "${filter}" category.`
                }
              </p>
              {user && filter === 'all' && (
                <button 
                  onClick={() => navigate('/create/upload-work')}
                  className="cta-btn"
                >
                  Upload Your First Work
                </button>
              )}
            </div>
          ) : (
            filteredPortfolios.map(item => (
              <div key={item.id} className="portfolio-card">
                <div className="card-image">
                  <img 
                    src={getPortfolioImage(item)}
                    alt={asString(item.title) || "Portfolio item"}
                    className="portfolio-img"
                    onError={(e) => handleImageErrorNew(e, item.title || "Portfolio")}
                    loading="lazy"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="card-overlay">
                    <div className="overlay-actions">
                      {item.project_url && (
                        <a 
                          href={item.project_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="action-btn view-btn"
                          title="View Project"
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </a>
                      )}
                      {/* 🔒 Only show edit/delete buttons for the owner */}
                      {user && item.user && item.user.id === user.id && (
                        <>
                          <button 
                            onClick={() => handleEdit(item.id)}
                            className="action-btn edit-btn"
                            title="Edit Portfolio Item"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="action-btn delete-btn"
                            title="Delete Portfolio Item"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-content">
                  <div className="card-header">
                    <h3 className="card-title">{item.title}</h3>
                    <div className="card-category">
                      <span className="category-icon">
                        {getCategoryIcon(
                          typeof item.category === 'string' ? item.category : 
                          typeof item.category === 'object' && item.category ? 
                          (item.category.name || 'general') : 'general'
                        )}
                      </span>
                      <span className="category-text">
                        {typeof item.category === 'string' ? item.category : 
                         typeof item.category === 'object' && item.category ? 
                         (item.category.name || 'General') : 'General'}
                      </span>
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="card-description">
                      {asString(item.description).length > 100 
                        ? `${asString(item.description).substring(0, 100)}...` 
                        : asString(item.description)
                      }
                    </p>
                  )}

                  {item.tags && (
                    <div className="card-tags">
                      {safeSplit(item.tags, ',').slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">
                          #{asString(tag).trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Show count */}
        {filteredPortfolios.length > 0 && (
          <div className="portfolio-count">
            Showing {filteredPortfolios.length} of {portfolios.length} portfolio items
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
