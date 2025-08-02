import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { blogAPI } from '../../api';
import RichTextEditor from '../common/RichTextEditor';
import './CreateBlog.css';

const CreateBlog = () => {
  const [blogData, setBlogData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'general',
    tags: '',
    featuredImage: null,
    isPublished: true,  // Default to published
    allowComments: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'tutorials', label: 'Tutorials' },
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'business', label: 'Business' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'reviews', label: 'Reviews' },
    { value: 'news', label: 'News & Updates' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBlogData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContentChange = (e) => {
    setBlogData(prev => ({
      ...prev,
      content: e.target.value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBlogData(prev => ({ ...prev, featuredImage: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare blog data for API
      const formData = new FormData();
      formData.append('title', blogData.title);
      formData.append('excerpt', blogData.excerpt);
      formData.append('content', blogData.content);
      formData.append('category', blogData.category);
      formData.append('tags', blogData.tags);
      formData.append('published', blogData.isPublished);
      formData.append('allow_comments', blogData.allowComments);
      
      if (blogData.featuredImage) {
        formData.append('featured_image', blogData.featuredImage);
      }

      const createdBlog = await blogAPI.create(formData);
      
      // Navigate to the created blog or dashboard
      navigate('/blog', { 
        state: { message: 'Blog post created successfully!' }
      });
    } catch (error) {
      console.error('Error creating blog:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const draftData = { ...blogData, isPublished: false };
      console.log('Saving draft:', draftData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate('/dashboard', { 
        state: { message: 'Blog draft saved successfully!' }
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-blog-container">
      <div className="create-blog-header">
        <h1>Create New Blog Post</h1>
        <p>Share your knowledge, insights, and stories with the VikraHub community.</p>
      </div>

      <form onSubmit={handleSubmit} className="create-blog-form">
        <div className="form-row">
          <div className="form-col-main">
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Blog Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={blogData.title}
                onChange={handleInputChange}
                placeholder="Enter an engaging title for your blog post"
                className="form-input"
                required
                maxLength="150"
              />
              <div className="form-hint">
                {blogData.title.length}/150 characters
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="excerpt" className="form-label">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={blogData.excerpt}
                onChange={handleInputChange}
                placeholder="Write a brief description that will appear in previews..."
                className="form-textarea"
                rows="3"
                maxLength="300"
              />
              <div className="form-hint">
                {blogData.excerpt.length}/300 characters. This will be shown in blog previews.
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="content" className="form-label">
                Content *
              </label>
              <RichTextEditor
                value={blogData.content}
                onChange={handleContentChange}
                placeholder="Write your blog content here... Use the toolbar above for formatting."
                required={true}
              />
              <div className="form-hint">
                Tip: Use the formatting toolbar above for rich text editing. Preview your content before publishing.
              </div>
            </div>
          </div>

          <div className="form-col-sidebar">
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={blogData.category}
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
              <label htmlFor="tags" className="form-label">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={blogData.tags}
                onChange={handleInputChange}
                placeholder="design, tutorial, tips"
                className="form-input"
              />
              <div className="form-hint">
                Separate with commas
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="featuredImage" className="form-label">
                Featured Image
              </label>
              <input
                type="file"
                id="featuredImage"
                name="featuredImage"
                onChange={handleImageChange}
                accept="image/*"
                className="form-file"
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>

            <div className="form-settings">
              <h4>Publishing Settings</h4>
              
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={blogData.isPublished}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="isPublished" className="checkbox-label">
                  Publish immediately
                </label>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="allowComments"
                  name="allowComments"
                  checked={blogData.allowComments}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="allowComments" className="checkbox-label">
                  Allow comments
                </label>
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
            type="button"
            onClick={handleSaveDraft}
            className="btn btn-outline"
            disabled={isSubmitting || !blogData.title.trim()}
          >
            Save Draft
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !blogData.title.trim() || !blogData.content.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                {blogData.isPublished ? 'Publishing...' : 'Creating...'}
              </>
            ) : (
              blogData.isPublished ? 'Publish Blog' : 'Create Blog'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBlog;
