import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioAPI } from '../api';
import { handleImageError, createPortfolioImageUrl } from '../utils/portfolioImageUtils';
import { useAuth } from './Auth/AuthContext';
import './Portfolio.css';

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEdit = (portfolioId) => {
    navigate(`/upload-work/${portfolioId}`);
  };

  const handleDelete = async (portfolioId) => {
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      try {
        await portfolioAPI.delete(portfolioId);
        setPortfolios(portfolios.filter(item => item.id !== portfolioId));
        alert('Portfolio item deleted successfully!');
      } catch (error) {
        console.error('Error deleting portfolio item:', error);
        alert('Failed to delete portfolio item. Please try again.');
      }
    }
  };

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await portfolioAPI.getAll();
        setPortfolios(response.data || []);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await portfolioAPI.getAll();
        setPortfolios(response.data || []);
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, []);

  if (loading) {
    return <div className="text-center">Loading portfolio...</div>;
  }

  return (
    <section id="portfolio" className="portfolio">
      <div className="container">
        <div className="section-title">
          <h2>Portfolio</h2>
          <p>Our work</p>
        </div>

        <div className="row portfolio-container">
          {portfolios.map(item => (
            <div key={item.id} className="col-lg-4 col-md-6 portfolio-item">
              <div className="portfolio-wrap">
                {item.image && (
                  <img 
                    src={createPortfolioImageUrl(item.image)}
                    className="img-fluid" 
                    alt={item.title}
                    data-original-src={item.image}
                    onError={handleImageError}
                  />
                )}
                {!item.image && (
                  <div className="portfolio-placeholder" style={{
                    height: '200px',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6c757d',
                    fontSize: '14px',
                    border: '2px dashed #dee2e6',
                    borderRadius: '8px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <i className="fas fa-image" style={{ fontSize: '2em', marginBottom: '8px', opacity: 0.5 }}></i>
                      <div>No Image Available</div>
                    </div>
                  </div>
                )}
                <div className="portfolio-info">
                  <h4>{item.title}</h4>
                  <p>{typeof item.category === 'string' ? item.category : 
                      typeof item.category === 'object' && item.category ? 
                      (item.category.name || 'General') : 'General'}</p>
                  <div className="portfolio-links">
                    {item.project_url && (
                      <a 
                        href={item.project_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="Project Link"
                      >
                        <i className="bx bx-link"></i>
                      </a>
                    )}
                    {user && (
                      <>
                        <button 
                          onClick={() => handleEdit(item.id)}
                          className="portfolio-edit-btn"
                          title="Edit Portfolio Item"
                        >
                          <i className="bx bx-edit"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="portfolio-delete-btn"
                          title="Delete Portfolio Item"
                        >
                          <i className="bx bx-trash"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
