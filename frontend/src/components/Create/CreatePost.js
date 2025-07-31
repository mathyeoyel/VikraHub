import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { postsAPI } from '../../api';
import './CreatePost.css';

const CreatePost = () => {
  const [postData, setPostData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    isPublic: true,
    allowComments: true,
    allowSharing: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'art', label: 'Art & Design' },
    { value: 'music', label: 'Music' },
    { value: 'photography', label: 'Photography' },
    { value: 'writing', label: 'Writing' },
    { value: 'tech', label: 'Technology' },
    { value: 'business', label: 'Business' },
    { value: 'lifestyle', label: 'Lifestyle' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPostData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare post data for API
      const apiPostData = {
        title: postData.title,
        content: postData.content,
        category: postData.category,
        tags: postData.tags, // Send as string, not array
        is_public: postData.isPublic,
        allow_comments: postData.allowComments,
        allow_sharing: postData.allowSharing
      };

      const createdPost = await postsAPI.create(apiPostData);
      
      // Navigate to the posts page after successful creation
      navigate('/posts', { 
        state: { message: 'Post created successfully!' }
      });
    } catch (error) {
      console.error('Error creating post:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <h1>Create New Post</h1>
        <p>Share your thoughts, ideas, and updates with the VikraHub community.</p>
      </div>

      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Post Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={postData.title}
              onChange={handleInputChange}
              placeholder="What's on your mind?"
              className="form-input"
              required
              maxLength="200"
            />
            <div className="form-hint">
              {postData.title.length}/200 characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={postData.category}
              onChange={handleInputChange}
              className="form-select"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={postData.content}
              onChange={handleInputChange}
              placeholder="Share your story, thoughts, or updates..."
              className="form-textarea"
              rows="8"
              required
              maxLength="5000"
            />
            <div className="form-hint">
              {postData.content.length}/5000 characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags" className="form-label">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={postData.tags}
              onChange={handleInputChange}
              placeholder="creativity, inspiration, art (separated by commas)"
              className="form-input"
            />
            <div className="form-hint">
              Separate tags with commas. This helps others discover your post.
            </div>
          </div>

          <div className="privacy-section">
            <h3 className="privacy-title">
              <span className="privacy-icon">🔒</span>
              Privacy & Sharing Settings
            </h3>
            
            <div className="privacy-options">
              <div className="privacy-option main-privacy">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={postData.isPublic}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <label htmlFor="isPublic" className="checkbox-label">
                    <span className="checkbox-title">
                      {postData.isPublic ? '🌍 Public Post' : '🔒 Private Post'}
                    </span>
                    <span className="checkbox-description">
                      {postData.isPublic 
                        ? 'Visible to all VikraHub users and may appear in search results'
                        : 'Only visible to you and people you specifically share it with'
                      }
                    </span>
                  </label>
                </div>
              </div>

              <div className="privacy-option">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="allowComments"
                    name="allowComments"
                    checked={postData.allowComments}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <label htmlFor="allowComments" className="checkbox-label">
                    <span className="checkbox-title">💬 Allow Comments</span>
                    <span className="checkbox-description">
                      Let others comment and engage with your post
                    </span>
                  </label>
                </div>
              </div>

              <div className="privacy-option">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="allowSharing"
                    name="allowSharing"
                    checked={postData.allowSharing}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <label htmlFor="allowSharing" className="checkbox-label">
                    <span className="checkbox-title">📤 Allow Sharing</span>
                    <span className="checkbox-description">
                      Enable others to share your post with their networks
                    </span>
                  </label>
                </div>
              </div>
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
            disabled={isSubmitting || !postData.title.trim() || !postData.content.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              'Create Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
