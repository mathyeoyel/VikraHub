import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import './CreateButton.css';

const CreateButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCreateAction = (action) => {
    setIsOpen(false);
    
    switch (action) {
      case 'post':
        navigate('/create/post');
        break;
      case 'blog':
        navigate('/create/blog');
        break;
      case 'work':
        navigate('/create/upload-work');
        break;
      case 'project':
        navigate('/create/project');
        break;
      case 'explore':
        // For non-authenticated users - could navigate to explore page or show modal
        navigate('/explore');
        break;
      case 'join':
        // For non-authenticated users - could navigate to signup or show modal
        navigate('/signup');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const createOptions = isAuthenticated ? [
    { 
      key: 'post', 
      label: 'New Post', 
      icon: '📝',
      description: 'Share your thoughts'
    },
    { 
      key: 'blog', 
      label: 'New Blog', 
      icon: '📖',
      description: 'Write an article'
    },
    { 
      key: 'work', 
      label: 'Upload Work', 
      icon: '🎨',
      description: 'Share your portfolio'
    },
    { 
      key: 'project', 
      label: 'New Project', 
      icon: '🚀',
      description: 'Start something new'
    }
  ] : [
    { 
      key: 'explore', 
      label: 'Explore VikraHub', 
      icon: '🌟',
      description: 'Discover amazing creators'
    },
    { 
      key: 'join', 
      label: 'Join Community', 
      icon: '👥',
      description: 'Become a member'
    }
  ];

  return (
    <div className="create-button-container" ref={dropdownRef}>
      <button
        className="create-button"
        onClick={toggleDropdown}
        title="Create"
        aria-label="Create new content"
        aria-expanded={isOpen}
      >
        <i className={`fas fa-plus create-icon ${isOpen ? 'rotated' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="create-dropdown">
          <div className="create-dropdown-content">
            <div className="create-dropdown-header">
              <h4>Create Something Amazing</h4>
            </div>
            <div className="create-options">
              {createOptions.map((option) => (
                <button
                  key={option.key}
                  className="create-option"
                  onClick={() => handleCreateAction(option.key)}
                >
                  <div className="create-option-icon">{option.icon}</div>
                  <div className="create-option-content">
                    <div className="create-option-label">{option.label}</div>
                    <div className="create-option-description">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateButton;
