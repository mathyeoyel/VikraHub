import React, { useState, useEffect } from 'react';
import { assetAPI } from '../../api';
import { useAuth } from '../Auth/AuthContext';
import { uploadToCloudinary, uploadRawToCloudinary } from '../../utils/cloudinary';
import './AssetUpload.css';

const AssetUpload = ({ onAssetCreated }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    asset_type: '',
    price: '',
    tags: '',
    software_used: '',
    file_formats: '',
    preview_image: '',
    asset_files: '',
    preview_file: null,
    asset_file: null
  });

  const assetTypes = [
    { value: 'graphic', label: 'Graphic Design' },
    { value: 'template', label: 'Template' },
    { value: 'ui_kit', label: 'UI Kit' },
    { value: 'icon_set', label: 'Icon Set' },
    { value: 'illustration', label: 'Illustration' },
    { value: 'photo', label: 'Photography' },
    { value: 'vector', label: 'Vector Art' },
    { value: 'mockup', label: 'Mockup' },
    { value: 'font', label: 'Font' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      setCategoriesLoading(true);
      const response = await assetAPI.getCategories();
      console.log('Categories response:', response);
      setCategories(response.data);
      console.log('Categories set:', response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to empty array if API fails
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreviewUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // For now, create a local URL for preview
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        preview_image: previewUrl,
        preview_file: file
      }));
    }
  };

  const handleAssetFilesUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        asset_files: file.name, // Just store filename for now
        asset_file: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to upload assets');
      return;
    }

    if (!formData.preview_file || !formData.asset_file) {
      alert('Please upload both preview image and asset files');
      return;
    }

    setLoading(true);
    
    try {
      // Upload files to Cloudinary first
      const [previewUpload, assetUpload] = await Promise.all([
        uploadToCloudinary(formData.preview_file, {
          folder: 'vikrahub/assets/previews',
          tags: 'asset_preview'
        }),
        uploadRawToCloudinary(formData.asset_file, {
          folder: 'vikrahub/assets/files',
          tags: 'asset_file'
        })
      ]);

      // Create asset data with Cloudinary URLs
      const assetData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category,
        asset_type: formData.asset_type,
        price: formData.price,
        tags: formData.tags,
        software_used: formData.software_used,
        file_formats: formData.file_formats,
        preview_image: previewUpload.secure_url,
        asset_files: assetUpload.secure_url
      };
      
      const response = await assetAPI.create(assetData);
      alert('Asset uploaded successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        asset_type: '',
        price: '',
        tags: '',
        software_used: '',
        file_formats: '',
        preview_image: '',
        asset_files: '',
        preview_file: null,
        asset_file: null
      });

      if (onAssetCreated) {
        onAssetCreated(response.data);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.detail ||
                      error.message ||
                      'Failed to upload asset';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asset-upload-container">
      <div className="upload-header">
        <h2>📤 Upload Creative Asset</h2>
        <p>Share your creative work with the community and earn money</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Asset Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a descriptive title"
              required
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (USD) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              min="0.01"
              max="999999.99"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your asset, its features, and what makes it special..."
            required
            rows={4}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading ? 'Loading categories...' : 'Select a category'}
              </option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesLoading && <div className="loading-text">Loading categories...</div>}
            {!categoriesLoading && categories.length === 0 && (
              <div className="error-text">No categories available. Please try refreshing.</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="asset_type">Asset Type *</label>
            <select
              id="asset_type"
              name="asset_type"
              value={formData.asset_type}
              onChange={handleInputChange}
              required
            >
              <option value="">Select asset type</option>
              {assetTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="design, modern, business, logo (comma-separated)"
            maxLength={500}
          />
          <small className="form-help">Add relevant tags to help users find your asset (max 20 tags)</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="software_used">Software Used</label>
            <input
              type="text"
              id="software_used"
              name="software_used"
              value={formData.software_used}
              onChange={handleInputChange}
              placeholder="Adobe Photoshop, Illustrator, Figma"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="file_formats">File Formats</label>
            <input
              type="text"
              id="file_formats"
              name="file_formats"
              value={formData.file_formats}
              onChange={handleInputChange}
              placeholder="PSD, AI, PNG, SVG"
              maxLength={200}
            />
          </div>
        </div>

        {/* File Uploads */}
        <div className="upload-section">
          <h3>File Uploads</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Preview Image *</label>
              <div className="upload-widget">
                <input
                  type="file"
                  id="preview-upload"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handlePreviewUpload}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => document.getElementById('preview-upload').click()}
                  className="upload-btn"
                >
                  {formData.preview_image ? '✅ Preview Uploaded' : '📷 Upload Preview Image'}
                </button>
                {formData.preview_image && (
                  <div className="preview-container">
                    <img src={formData.preview_image} alt="Preview" className="preview-image" />
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Asset Files (ZIP) *</label>
              <div className="upload-widget">
                <input
                  type="file"
                  id="asset-upload"
                  accept=".zip,.rar,.7z"
                  onChange={handleAssetFilesUpload}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => document.getElementById('asset-upload').click()}
                  className="upload-btn"
                >
                  {formData.asset_files ? '✅ Asset Files Uploaded' : '📦 Upload Asset Files (ZIP)'}
                </button>
                {formData.asset_files && (
                  <div className="file-info">
                    <p>✅ Asset files uploaded successfully</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || !formData.preview_image || !formData.asset_files}
          >
            {loading ? 'Uploading...' : 'Upload Asset'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssetUpload;
