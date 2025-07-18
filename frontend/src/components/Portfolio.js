import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../api';

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const response = await portfolioAPI.list();
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
                    src={item.image} 
                    className="img-fluid" 
                    alt={item.title}
                  />
                )}
                <div className="portfolio-info">
                  <h4>{item.title}</h4>
                  <p>{item.category}</p>
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
