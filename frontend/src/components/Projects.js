import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { portfolioAPI } from '../api';
import { handleImageError, createPortfolioImageUrl } from '../utils/portfolioImageUtils';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await portfolioAPI.getAll();
        console.log('Projects API response:', response);
        
        // Handle different response structures
        const projectData = response.results || response.data || response || [];
        console.log('Project data:', projectData);
        setProjects(Array.isArray(projectData) ? projectData : []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="projects-loading">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="projects-error">
        <div className="container">
          <div className="text-center">
            <h2>Unable to load projects</h2>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="projects">
      <div className="container">
        <div className="section-header">
          <h1>Projects</h1>
          <p>Discover amazing projects from our creative community</p>
        </div>

        {projects.length === 0 ? (
          <div className="no-projects">
            <div className="text-center">
              <i className="fas fa-folder-open display-1 text-muted"></i>
              <h3>No projects found</h3>
              <p className="text-muted">Be the first to share your project with the community!</p>
              <Link to="/create/project" className="btn btn-primary">
                Create Your First Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-image">
                  {project.image ? (
                    <img 
                      src={createPortfolioImageUrl(project.image)}
                      alt={project.title}
                      data-original-src={project.image}
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="project-placeholder">
                      <i className="fas fa-image"></i>
                    </div>
                  )}
                  
                  {project.category && (
                    <div className="project-category">
                      <span className="badge bg-primary">{project.category}</span>
                    </div>
                  )}
                </div>

                <div className="project-content">
                  <h3 className="project-title">
                    <Link to={`/projects/${project.id}`}>
                      {project.title || 'Untitled Project'}
                    </Link>
                  </h3>
                  
                  <p className="project-description">
                    {project.description || project.excerpt || 'No description available.'}
                  </p>

                  <div className="project-meta">
                    <div className="project-author">
                      <i className="fas fa-user-circle"></i>
                      <span>{project.user?.username || project.author?.username || 'Anonymous'}</span>
                    </div>
                    
                    {project.created_at && (
                      <div className="project-date">
                        <i className="fas fa-calendar"></i>
                        <span>
                          {new Date(project.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {project.technologies && project.technologies.length > 0 && (
                    <div className="project-technologies">
                      {project.technologies.slice(0, 3).map((tech, index) => (
                        <span key={index} className="tech-badge">
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="tech-badge tech-more">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="project-actions">
                    <Link 
                      to={`/projects/${project.id}`} 
                      className="btn btn-outline-primary btn-sm"
                    >
                      View Details
                    </Link>
                    
                    {project.demo_url && (
                      <a 
                        href={project.demo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        <i className="fas fa-external-link-alt"></i>
                        Live Demo
                      </a>
                    )}
                    
                    {project.github_url && (
                      <a 
                        href={project.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline-dark btn-sm"
                      >
                        <i className="fab fa-github"></i>
                        Code
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-5">
          <Link to="/create/project" className="btn btn-primary btn-lg">
            <i className="fas fa-plus-circle"></i>
            Create New Project
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Projects;
