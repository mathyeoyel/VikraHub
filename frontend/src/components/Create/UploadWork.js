import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { portfolioAPI } from '../../api';
import { createPortfolioImageUrl } from '../../utils/portfolioImageUtils';
import { getAccessToken } from '../../auth';
import './UploadWork.css';

const UploadWork = () => {
  const { id } = useParams(); // For editing existing items
  const location = useLocation();
  const isEditing = !!id;
  
  const [workData, setWorkData] = useState({
    title: '',
    description: '',
    category: 'design',
    type: 'image',
    tags: '',
    files: [],
    previewImage: null,
    price: '',
    isForSale: false,
    license: 'all-rights-reserved',
    allowDownload: false,
    url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [previewImagePreview, setPreviewImagePreview] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { value: 'design', label: '🎨 Design' },
    { value: 'photography', label: '📸 Photography' },
    { value: 'illustration', label: '🖼️ Illustration' },
    { value: 'ui-ux', label: '💻 UI/UX' },
    { value: 'branding', label: '🏷️ Branding' },
    { value: 'video', label: '🎬 Video' },
    { value: 'audio', label: '🎵 Audio' },
    { value: 'writing', label: '✍️ Writing' },
    { value: 'code', label: '💾 Code' },
    { value: 'other', label: '📦 Other' }
  ];

  const workTypes = [
    { value: 'image', label: 'Image/Artwork' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'document', label: 'Document' },
    { value: 'archive', label: 'Archive/Package' }
  ];

  const licenses = [
    { value: 'all-rights-reserved', label: 'All Rights Reserved' },
    { value: 'creative-commons', label: 'Creative Commons' },
    { value: 'royalty-free', label: 'Royalty Free' },
    { value: 'custom', label: 'Custom License' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWorkData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setWorkData(prev => ({ ...prev, files }));

    // Create previews
    const newPreviews = files.map(file => {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => resolve({
          file,
          preview: reader.result,
          name: file.name,
          size: file.size,
          type: file.type
        });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPreviews).then(setPreviews);
  };

  const removeFile = (index) => {
    const newFiles = workData.files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setWorkData(prev => ({ ...prev, files: newFiles }));
    setPreviews(newPreviews);
  };

  const handlePreviewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWorkData(prev => ({ ...prev, previewImage: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreviewImage = () => {
    setWorkData(prev => ({ ...prev, previewImage: null }));
    setPreviewImagePreview(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user is authenticated
      if (!user) {
        alert('You must be logged in to upload work. Please log in and try again.');
        navigate('/login');
        return;
      }

      // Validate required fields
      if (!workData.title.trim()) {
        alert('Please enter a title for your work.');
        return;
      }

      if (!workData.description.trim()) {
        alert('Please enter a description for your work.');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', workData.title.trim());
      formData.append('description', workData.description.trim());
      formData.append('category', workData.category);
      formData.append('tags', workData.tags.trim());
      formData.append('url', workData.url.trim());
      
      // Add preview image if present (only if it's a new file, not a URL)
      if (workData.previewImage && workData.previewImage instanceof File) {
        formData.append('image', workData.previewImage);
      }
      
      // For editing: only include image if user uploaded a new one
      if (isEditing && !workData.previewImage) {
        // Don't send image field if user didn't upload a new image
        // This preserves the existing image
      }
      
      // Add additional files if present
      workData.files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      console.log(isEditing ? 'Updating portfolio item' : 'Creating portfolio item');
      console.log('Form data keys:', Array.from(formData.keys()));
      console.log('User authenticated:', !!user);
      console.log('Auth token exists:', !!getAccessToken());
      
      let response;
      if (isEditing) {
        // Update existing portfolio item
        response = await portfolioAPI.update(id, formData);
        console.log('Portfolio item updated:', response.data);
      } else {
        // Create new portfolio item
        response = await portfolioAPI.create(formData);
        console.log('Portfolio item created:', response.data);
      }
      
      // Navigate to portfolio with success message
      navigate('/portfolio', { 
        state: { 
          message: isEditing ? 
            'Work updated successfully!' : 
            'Work uploaded successfully and added to your portfolio!' 
        }
      });
    } catch (error) {
      console.error('Error with portfolio item:', error);
      
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in and try again.');
        navigate('/login');
      } else if (error.response?.status === 400) {
        alert('Invalid data. Please check your input and try again.');
      } else if (error.response?.status === 404 && isEditing) {
        alert('Portfolio item not found. It may have been deleted.');
        navigate('/portfolio');
      } else {
        alert(isEditing ? 'Failed to update work. Please try again later.' : 'Failed to upload work. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Load existing portfolio item when editing
  useEffect(() => {
    const loadPortfolioItem = async () => {
      if (isEditing && id) {
        setIsLoading(true);
        try {
          const response = await portfolioAPI.getById(id);
          const item = response.data;
          
          setWorkData({
            title: item.title || '',
            description: item.description || '',
            category: item.category || 'design',
            type: 'image', // Default for existing items
            tags: item.tags || '',
            files: [],
            previewImage: null,
            price: '',
            isForSale: false,
            license: 'all-rights-reserved',
            allowDownload: false,
            url: item.url || ''
          });
          
          // Set preview image if exists
          if (item.image) {
            // For editing, just show the existing image preview
            // Don't set it as a file object since we're not changing it
            setPreviewImagePreview(createPortfolioImageUrl(item.image));
          }
          
          // Handle preview_image field if it exists
          if (item.preview_image) {
            setPreviewImagePreview(createPortfolioImageUrl(item.preview_image));
          }
        } catch (error) {
          console.error('Error loading portfolio item:', error);
          alert('Failed to load portfolio item for editing.');
          navigate('/portfolio');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPortfolioItem();
  }, [isEditing, id, navigate]);

  if (isLoading) {
    return (
      <div className="upload-work-container">
        <div className="upload-work-header">
          <h1>Loading...</h1>
          <p>Loading portfolio item for editing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-work-container">
      <div className="upload-work-header">
        <h1>{isEditing ? 'Edit Your Work' : 'Upload Your Work'}</h1>
        <p>
          {isEditing 
            ? 'Update your creative work details and preview image.' 
            : 'Share your creative work with the VikraHub community and potential clients.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-work-form">
        <div className="form-row">
          <div className="form-col-main">
            <div className="upload-section">
              <h3>Files</h3>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="files"
                  name="files"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.rar"
                  className="file-input"
                  required
                />
                <label htmlFor="files" className="file-upload-label">
                  <div className="upload-icon"><i className="fas fa-folder-open icon"></i></div>
                  <div className="upload-text">
                    <h4>Drop files here or click to browse</h4>
                    <p>Supports images, videos, audio, documents, and archives</p>
                  </div>
                </label>
              </div>

              {previews.length > 0 && (
                <div className="file-previews">
                  {previews.map((preview, index) => (
                    <div key={index} className="file-preview">
                      {preview.type.startsWith('image/') ? (
                        <img src={preview.preview} alt={preview.name} />
                      ) : (
                        <div className="file-icon">
                          {preview.type.startsWith('video/') ? '🎬' :
                           preview.type.startsWith('audio/') ? '🎵' :
                           preview.type.includes('pdf') ? '📄' :
                           preview.type.includes('zip') || preview.type.includes('rar') ? '📦' : '📄'}
                        </div>
                      )}
                      <div className="file-info">
                        <div className="file-name">{preview.name}</div>
                        <div className="file-size">{formatFileSize(preview.size)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="remove-file"
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="upload-section">
              <h3>Preview Image</h3>
              <p className="section-description">
                Upload a preview image that represents your work. This will be displayed in your portfolio.
              </p>
              
              <div className="preview-image-upload">
                <input
                  type="file"
                  id="previewImage"
                  onChange={handlePreviewImageChange}
                  accept="image/*"
                  className="preview-image-input"
                />
                <label htmlFor="previewImage" className="preview-upload-label">
                  {previewImagePreview ? (
                    <div className="preview-image-container">
                      <img 
                        src={previewImagePreview} 
                        alt="Preview" 
                        className="preview-image"
                      />
                      <div className="preview-overlay">
                        <span>Click to change image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="preview-placeholder">
                      <div className="upload-icon">🖼️</div>
                      <div className="upload-text">
                        <h4>Upload Preview Image</h4>
                        <p>Recommended: 1200x800px or 3:2 aspect ratio</p>
                      </div>
                    </div>
                  )}
                </label>
                
                {previewImagePreview && (
                  <button
                    type="button"
                    onClick={removePreviewImage}
                    className="remove-preview-btn"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Work Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={workData.title}
                onChange={handleInputChange}
                placeholder="Give your work a compelling title"
                className="form-input"
                required
                maxLength="100"
              />
              <div className="form-hint">
                {workData.title.length}/100 characters
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={workData.description}
                onChange={handleInputChange}
                placeholder="Describe your work, inspiration, process, and what makes it special..."
                className="form-textarea"
                rows="6"
                required
                maxLength="2000"
              />
              <div className="form-hint">
                {workData.description.length}/2000 characters
              </div>
            </div>
          </div>

          <div className="form-col-sidebar">
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={workData.category}
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
                Work Type
              </label>
              <select
                id="type"
                name="type"
                value={workData.type}
                onChange={handleInputChange}
                className="form-select"
              >
                {workTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
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
                value={workData.tags}
                onChange={handleInputChange}
                placeholder="creative, design, modern"
                className="form-input"
              />
              <div className="form-hint">
                Separate with commas
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="url" className="form-label">
                Project URL (Optional)
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={workData.url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="form-input"
              />
              <div className="form-hint">
                Link to live project, repository, or more info
              </div>
            </div>

            <div className="pricing-section">
              <h4>Pricing & Licensing</h4>
              
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="isForSale"
                  name="isForSale"
                  checked={workData.isForSale}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="isForSale" className="checkbox-label">
                  Available for sale
                </label>
              </div>

              {workData.isForSale && (
                <div className="form-group">
                  <label htmlFor="price" className="form-label">
                    Price (SSP)
                  </label>
                  <div className="price-input-container">
                    <span className="currency-symbol">SSP</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={workData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="form-input price-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="license" className="form-label">
                  License
                </label>
                <select
                  id="license"
                  name="license"
                  value={workData.license}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {licenses.map(license => (
                    <option key={license.value} value={license.value}>
                      {license.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="allowDownload"
                  name="allowDownload"
                  checked={workData.allowDownload}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="allowDownload" className="checkbox-label">
                  Allow free download
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
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !workData.title.trim() || !workData.description.trim() || workData.files.length === 0}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                {isEditing ? 'Updating...' : 'Uploading...'}
              </>
            ) : (
              isEditing ? 'Update Work' : 'Upload Work'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadWork;
