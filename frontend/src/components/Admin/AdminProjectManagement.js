import React, { useState, useEffect } from 'react';
import api from '../../api';

const AdminProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBudget, setFilterBudget] = useState('all');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/projects/');
      setProjects(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    
    const matchesBudget = filterBudget === 'all' || 
                         (filterBudget === 'low' && project.budget < 500) ||
                         (filterBudget === 'medium' && project.budget >= 500 && project.budget < 2000) ||
                         (filterBudget === 'high' && project.budget >= 2000);

    return matchesSearch && matchesStatus && matchesBudget;
  });

  const handleProjectAction = async (projectId, action) => {
    try {
      let endpoint = `/projects/${projectId}/`;
      let data = {};

      switch (action) {
        case 'approve':
          data = { status: 'open' };
          break;
        case 'suspend':
          data = { status: 'suspended' };
          break;
        case 'close':
          data = { status: 'closed' };
          break;
        case 'delete':
          await api.delete(endpoint);
          await fetchProjects();
          return;
        default:
          return;
      }

      await api.patch(endpoint, data);
      await fetchProjects();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} project. Please try again.`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedProjects.length === 0) {
      alert('Please select projects first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedProjects.length} projects?`)) {
      return;
    }

    try {
      for (const projectId of selectedProjects) {
        await handleProjectAction(projectId, action);
      }
      setSelectedProjects([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const selectAllProjects = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(project => project.id));
    }
  };

  const openProjectModal = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const closeProjectModal = () => {
    setSelectedProject(null);
    setShowProjectModal(false);
  };

  const formatBudget = (budget) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(budget || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'gray',
      'open': 'blue',
      'in_progress': 'orange',
      'completed': 'green',
      'cancelled': 'red',
      'suspended': 'purple'
    };
    return colors[status] || 'gray';
  };

  const getUrgencyLevel = (deadline) => {
    if (!deadline) return 'low';
    const daysUntilDeadline = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline < 7) return 'high';
    if (daysUntilDeadline < 30) return 'medium';
    return 'low';
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="admin-project-management">
      <div className="project-management-header">
        <h2>Project Management</h2>
        <div className="project-stats">
          <span>Total: {projects.length}</span>
          <span>Open: {projects.filter(p => p.status === 'open').length}</span>
          <span>In Progress: {projects.filter(p => p.status === 'in_progress').length}</span>
          <span>Completed: {projects.filter(p => p.status === 'completed').length}</span>
        </div>
      </div>

      <div className="project-controls">
        <div className="search-filter-section">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="project-search"
          />
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="project-filter"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="suspended">Suspended</option>
          </select>

          <select 
            value={filterBudget} 
            onChange={(e) => setFilterBudget(e.target.value)}
            className="project-filter"
          >
            <option value="all">All Budgets</option>
            <option value="low">Under $500</option>
            <option value="medium">$500 - $2,000</option>
            <option value="high">Over $2,000</option>
          </select>
        </div>

        {selectedProjects.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedProjects.length} projects selected</span>
            <button onClick={() => handleBulkAction('approve')} className="bulk-btn approve">
              Approve
            </button>
            <button onClick={() => handleBulkAction('suspend')} className="bulk-btn suspend">
              Suspend
            </button>
            <button onClick={() => handleBulkAction('close')} className="bulk-btn close">
              Close
            </button>
            <button onClick={() => handleBulkAction('delete')} className="bulk-btn delete">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="projects-table">
        <div className="table-header">
          <div className="select-all">
            <input
              type="checkbox"
              checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
              onChange={selectAllProjects}
            />
          </div>
          <div>Project</div>
          <div>Client</div>
          <div>Budget</div>
          <div>Status</div>
          <div>Deadline</div>
          <div>Created</div>
          <div>Actions</div>
        </div>

        {filteredProjects.map(project => (
          <div key={project.id} className="table-row">
            <div className="select-project">
              <input
                type="checkbox"
                checked={selectedProjects.includes(project.id)}
                onChange={() => toggleProjectSelection(project.id)}
              />
            </div>
            
            <div className="project-info" onClick={() => openProjectModal(project)}>
              <div className="project-details">
                <div className="project-title">{project.title}</div>
                <div className="project-description">
                  {project.description?.substring(0, 60)}...
                </div>
              </div>
              <div className={`urgency-indicator ${getUrgencyLevel(project.deadline)}`}></div>
            </div>

            <div className="project-client">
              <div className="client-info">
                <div className="client-name">{project.client?.username || 'Unknown'}</div>
                <div className="client-email">{project.client?.email}</div>
              </div>
            </div>

            <div className="project-budget">
              {formatBudget(project.budget)}
            </div>

            <div className="project-status">
              <span className={`status-badge ${getStatusColor(project.status)}`}>
                {project.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="project-deadline">
              {project.deadline ? (
                <div className={`deadline ${getUrgencyLevel(project.deadline)}`}>
                  {new Date(project.deadline).toLocaleDateString()}
                </div>
              ) : (
                <span className="no-deadline">No deadline</span>
              )}
            </div>

            <div className="project-created">
              {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
            </div>

            <div className="project-actions">
              <button 
                onClick={() => openProjectModal(project)}
                className="action-btn view"
                title="View Details"
              >
                👁️
              </button>
              
              {project.status === 'draft' && (
                <button
                  onClick={() => handleProjectAction(project.id, 'approve')}
                  className="action-btn approve"
                  title="Approve Project"
                >
                  ✅
                </button>
              )}

              {['open', 'in_progress'].includes(project.status) && (
                <button
                  onClick={() => handleProjectAction(project.id, 'suspend')}
                  className="action-btn suspend"
                  title="Suspend Project"
                >
                  ⏸️
                </button>
              )}

              <button
                onClick={() => handleProjectAction(project.id, 'close')}
                className="action-btn close"
                title="Close Project"
              >
                🔒
              </button>

              <button
                onClick={() => handleProjectAction(project.id, 'delete')}
                className="action-btn delete"
                title="Delete Project"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {showProjectModal && selectedProject && (
        <div className="project-modal-overlay" onClick={closeProjectModal}>
          <div className="project-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Project Details</h3>
              <button onClick={closeProjectModal} className="close-btn">×</button>
            </div>
            
            <div className="modal-content">
              <div className="project-overview">
                <h4>{selectedProject.title}</h4>
                <p>{selectedProject.description}</p>
              </div>

              <div className="project-details-grid">
                <div className="detail-item">
                  <label>Budget:</label>
                  <span>{formatBudget(selectedProject.budget)}</span>
                </div>
                <div className="detail-item">
                  <label>Client:</label>
                  <span>{selectedProject.client?.username}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Category:</label>
                  <span>{selectedProject.category?.name || 'Uncategorized'}</span>
                </div>
                <div className="detail-item">
                  <label>Deadline:</label>
                  <span className={selectedProject.deadline ? getUrgencyLevel(selectedProject.deadline) : ''}>
                    {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'No deadline'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Created:</label>
                  <span>{selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Applications:</label>
                  <span>{selectedProject.applications_count || 0}</span>
                </div>
                <div className="detail-item">
                  <label>Selected Freelancer:</label>
                  <span>{selectedProject.selected_freelancer?.username || 'None'}</span>
                </div>
              </div>

              {selectedProject.required_skills && selectedProject.required_skills.length > 0 && (
                <div className="project-skills">
                  <label>Required Skills:</label>
                  <div className="skills-list">
                    {selectedProject.required_skills.map((skill, index) => (
                      <span key={index} className="skill">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedProject.attachments && selectedProject.attachments.length > 0 && (
                <div className="project-attachments">
                  <label>Attachments:</label>
                  <div className="attachments-list">
                    {selectedProject.attachments.map((attachment, index) => (
                      <div key={index} className="attachment">
                        <span>📎 {attachment.name || `Attachment ${index + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjectManagement;
