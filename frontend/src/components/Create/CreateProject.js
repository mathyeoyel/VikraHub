import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import './CreateProject.css';

const CreateProject = () => {
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    category: 'design',
    type: 'personal',
    timeline: '1-2-weeks',
    budget: '',
    skills: '',
    status: 'planning',
    isOpenToCollaborators: false,
    collaboratorRoles: [],
    requirements: '',
    deliverables: '',
    resources: []
  });
  const [milestones, setMilestones] = useState([
    { id: 1, title: '', description: '', dueDate: '', status: 'pending' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { value: 'design', label: '🎨 Design' },
    { value: 'development', label: '💻 Development' },
    { value: 'marketing', label: '📢 Marketing' },
    { value: 'content', label: '✍️ Content Creation' },
    { value: 'business', label: '💼 Business' },
    { value: 'education', label: '🎓 Education' },
    { value: 'research', label: '🔬 Research' },
    { value: 'art', label: '🎭 Art & Creative' },
    { value: 'technology', label: '⚡ Technology' },
    { value: 'other', label: '📦 Other' }
  ];

  const projectTypes = [
    { value: 'personal', label: 'Personal Project' },
    { value: 'client', label: 'Client Work' },
    { value: 'open-source', label: 'Open Source' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'startup', label: 'Startup' },
    { value: 'nonprofit', label: 'Non-Profit' }
  ];

  const timelines = [
    { value: '1-week', label: '1 Week' },
    { value: '1-2-weeks', label: '1-2 Weeks' },
    { value: '1-month', label: '1 Month' },
    { value: '2-3-months', label: '2-3 Months' },
    { value: '3-6-months', label: '3-6 Months' },
    { value: '6-months-plus', label: '6+ Months' },
    { value: 'ongoing', label: 'Ongoing' }
  ];

  const statusOptions = [
    { value: 'planning', label: '📋 Planning' },
    { value: 'in-progress', label: '🚀 In Progress' },
    { value: 'review', label: '👀 Under Review' },
    { value: 'completed', label: '✅ Completed' },
    { value: 'on-hold', label: '⏸️ On Hold' }
  ];

  const collaboratorRoleOptions = [
    'Designer', 'Developer', 'Writer', 'Marketer', 'Researcher', 
    'Project Manager', 'Consultant', 'Mentor', 'Reviewer'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCollaboratorRoleChange = (role) => {
    setProjectData(prev => ({
      ...prev,
      collaboratorRoles: prev.collaboratorRoles.includes(role)
        ? prev.collaboratorRoles.filter(r => r !== role)
        : [...prev.collaboratorRoles, role]
    }));
  };

  const addMilestone = () => {
    const newMilestone = {
      id: Date.now(),
      title: '',
      description: '',
      dueDate: '',
      status: 'pending'
    };
    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (id) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  const updateMilestone = (id, field, value) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const addResource = () => {
    setProjectData(prev => ({
      ...prev,
      resources: [...prev.resources, { name: '', url: '', type: 'reference' }]
    }));
  };

  const removeResource = (index) => {
    setProjectData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const updateResource = (index, field, value) => {
    setProjectData(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) => 
        i === index ? { ...resource, [field]: value } : resource
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fullProjectData = {
        ...projectData,
        milestones: milestones.filter(m => m.title.trim()),
        createdBy: user?.id,
        createdAt: new Date().toISOString()
      };

      console.log('Creating project:', fullProjectData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      navigate('/projects', { 
        state: { message: 'Project created successfully!' }
      });
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="create-project-container">
      <div className="create-project-header">
        <h1>Create New Project</h1>
        <p>Plan, organize, and collaborate on your next creative endeavor.</p>
      </div>

      <form onSubmit={handleSubmit} className="create-project-form">
        <div className="form-sections">
          <div className="form-section">
            <h3>Project Overview</h3>
            
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={projectData.title}
                onChange={handleInputChange}
                placeholder="Enter a compelling project title"
                className="form-input"
                required
                maxLength="100"
              />
              <div className="form-hint">
                {projectData.title.length}/100 characters
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Project Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={projectData.description}
                onChange={handleInputChange}
                placeholder="Describe your project goals, vision, and what you hope to achieve..."
                className="form-textarea"
                rows="5"
                required
                maxLength="2000"
              />
              <div className="form-hint">
                {projectData.description.length}/2000 characters
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={projectData.category}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="type" className="form-label">
                  Project Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={projectData.type}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {projectTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="timeline" className="form-label">
                  Timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  value={projectData.timeline}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {timelines.map(timeline => (
                    <option key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budget" className="form-label">
                  Budget (SSP)
                </label>
                <div className="price-input-container">
                  <span className="currency-symbol">SSP</span>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={projectData.budget}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="form-input price-input"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Current Status
              </label>
              <select
                id="status"
                name="status"
                value={projectData.status}
                onChange={handleInputChange}
                className="form-select"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Project Details</h3>
            
            <div className="form-group">
              <label htmlFor="skills" className="form-label">
                Required Skills
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={projectData.skills}
                onChange={handleInputChange}
                placeholder="React, Design, Photography, Writing"
                className="form-input"
              />
              <div className="form-hint">
                Separate skills with commas
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="requirements" className="form-label">
                Requirements
              </label>
              <textarea
                id="requirements"
                name="requirements"
                value={projectData.requirements}
                onChange={handleInputChange}
                placeholder="List any specific requirements, constraints, or prerequisites..."
                className="form-textarea"
                rows="4"
                maxLength="1000"
              />
              <div className="form-hint">
                {projectData.requirements.length}/1000 characters
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="deliverables" className="form-label">
                Expected Deliverables
              </label>
              <textarea
                id="deliverables"
                name="deliverables"
                value={projectData.deliverables}
                onChange={handleInputChange}
                placeholder="Describe what the final deliverables should include..."
                className="form-textarea"
                rows="4"
                maxLength="1000"
              />
              <div className="form-hint">
                {projectData.deliverables.length}/1000 characters
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Collaboration</h3>
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="isOpenToCollaborators"
                name="isOpenToCollaborators"
                checked={projectData.isOpenToCollaborators}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              <label htmlFor="isOpenToCollaborators" className="checkbox-label">
                Open to collaborators
              </label>
            </div>

            {projectData.isOpenToCollaborators && (
              <div className="collaborator-roles">
                <label className="form-label">Looking for:</label>
                <div className="role-tags">
                  {collaboratorRoleOptions.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleCollaboratorRoleChange(role)}
                      className={`role-tag ${projectData.collaboratorRoles.includes(role) ? 'selected' : ''}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Milestones</h3>
            <div className="milestones-container">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="milestone-item">
                  <div className="milestone-header">
                    <h4>Milestone {index + 1}</h4>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(milestone.id)}
                        className="remove-milestone"
                        title="Remove milestone"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  <div className="milestone-fields">
                    <div className="form-group">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                        placeholder="Milestone title"
                        className="form-input"
                        maxLength="100"
                      />
                    </div>
                    
                    <div className="form-group">
                      <textarea
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                        placeholder="Describe what should be accomplished in this milestone"
                        className="form-textarea"
                        rows="3"
                        maxLength="500"
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <input
                          type="date"
                          value={milestone.dueDate}
                          onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addMilestone}
                className="btn btn-outline add-milestone-btn"
              >
                + Add Milestone
              </button>
            </div>
          </div>

          <div className="form-section">
            <h3>Resources & References</h3>
            <div className="resources-container">
              {projectData.resources.map((resource, index) => (
                <div key={index} className="resource-item">
                  <div className="resource-fields">
                    <input
                      type="text"
                      value={resource.name}
                      onChange={(e) => updateResource(index, 'name', e.target.value)}
                      placeholder="Resource name"
                      className="form-input"
                    />
                    <input
                      type="url"
                      value={resource.url}
                      onChange={(e) => updateResource(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="form-input"
                    />
                    <select
                      value={resource.type}
                      onChange={(e) => updateResource(index, 'type', e.target.value)}
                      className="form-select"
                    >
                      <option value="reference">Reference</option>
                      <option value="inspiration">Inspiration</option>
                      <option value="tool">Tool</option>
                      <option value="documentation">Documentation</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeResource(index)}
                      className="remove-resource"
                      title="Remove resource"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addResource}
                className="btn btn-outline add-resource-btn"
              >
                + Add Resource
              </button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !projectData.title.trim() || !projectData.description.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
