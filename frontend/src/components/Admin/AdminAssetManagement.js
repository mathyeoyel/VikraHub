import React, { useState, useEffect } from 'react';
import api from '../../api';

const AdminAssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [assetsResponse, categoriesResponse] = await Promise.all([
        api.get('/creative-assets/'),
        api.get('/asset-categories/')
      ]);
      
      setAssets(assetsResponse.data.results || assetsResponse.data || []);
      setCategories(categoriesResponse.data.results || categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.seller?.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || asset.category?.id === parseInt(filterCategory);
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && asset.is_active) ||
                         (filterStatus === 'inactive' && !asset.is_active) ||
                         (filterStatus === 'featured' && asset.is_featured);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAssetAction = async (assetId, action) => {
    try {
      let endpoint = `/creative-assets/${assetId}/`;
      let data = {};

      switch (action) {
        case 'activate':
          data = { is_active: true };
          break;
        case 'deactivate':
          data = { is_active: false };
          break;
        case 'feature':
          data = { is_featured: true };
          break;
        case 'unfeature':
          data = { is_featured: false };
          break;
        case 'delete':
          await api.delete(endpoint);
          await fetchData();
          return;
        default:
          return;
      }

      await api.patch(endpoint, data);
      await fetchData();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} asset. Please try again.`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedAssets.length === 0) {
      alert('Please select assets first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedAssets.length} assets?`)) {
      return;
    }

    try {
      for (const assetId of selectedAssets) {
        await handleAssetAction(assetId, action);
      }
      setSelectedAssets([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleAssetSelection = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const selectAllAssets = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(asset => asset.id));
    }
  };

  const openAssetModal = (asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(true);
  };

  const closeAssetModal = () => {
    setSelectedAsset(null);
    setShowAssetModal(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading assets...</p>
      </div>
    );
  }

  return (
    <div className="admin-asset-management">
      <div className="asset-management-header">
        <h2>Asset Management</h2>
        <div className="asset-stats">
          <span>Total: {assets.length}</span>
          <span>Active: {assets.filter(a => a.is_active).length}</span>
          <span>Featured: {assets.filter(a => a.is_featured).length}</span>
        </div>
      </div>

      <div className="asset-controls">
        <div className="search-filter-section">
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="asset-search"
          />
          
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="asset-filter"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="asset-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
          </select>
        </div>

        {selectedAssets.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedAssets.length} assets selected</span>
            <button onClick={() => handleBulkAction('activate')} className="bulk-btn activate">
              Activate
            </button>
            <button onClick={() => handleBulkAction('deactivate')} className="bulk-btn deactivate">
              Deactivate
            </button>
            <button onClick={() => handleBulkAction('feature')} className="bulk-btn feature">
              Feature
            </button>
            <button onClick={() => handleBulkAction('delete')} className="bulk-btn delete">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="assets-table">
        <div className="table-header">
          <div className="select-all">
            <input
              type="checkbox"
              checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
              onChange={selectAllAssets}
            />
          </div>
          <div>Asset</div>
          <div>Seller</div>
          <div>Category</div>
          <div>Price</div>
          <div>Status</div>
          <div>Created</div>
          <div>Actions</div>
        </div>

        {filteredAssets.map(asset => (
          <div key={asset.id} className="table-row">
            <div className="select-asset">
              <input
                type="checkbox"
                checked={selectedAssets.includes(asset.id)}
                onChange={() => toggleAssetSelection(asset.id)}
              />
            </div>
            
            <div className="asset-info" onClick={() => openAssetModal(asset)}>
              <div className="asset-thumbnail">
                {asset.preview_image ? (
                  <img src={asset.preview_image} alt={asset.title} />
                ) : (
                  <div className="no-image">🎨</div>
                )}
              </div>
              <div className="asset-details">
                <div className="asset-title">{asset.title}</div>
                <div className="asset-description">
                  {asset.description?.substring(0, 50)}...
                </div>
              </div>
            </div>

            <div className="asset-seller">
              <div className="seller-info">
                <div className="seller-name">{asset.seller?.username || 'Unknown'}</div>
                <div className="seller-email">{asset.seller?.email}</div>
              </div>
            </div>

            <div className="asset-category">
              <span className="category-badge">
                {asset.category?.name || 'Uncategorized'}
              </span>
            </div>

            <div className="asset-price">
              {formatPrice(asset.price)}
            </div>

            <div className="asset-status">
              <span className={`status-badge ${asset.is_active ? 'active' : 'inactive'}`}>
                {asset.is_active ? 'Active' : 'Inactive'}
              </span>
              {asset.is_featured && <span className="featured-badge">Featured</span>}
            </div>

            <div className="asset-created">
              {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : 'N/A'}
            </div>

            <div className="asset-actions">
              <button 
                onClick={() => openAssetModal(asset)}
                className="action-btn view"
                title="View Details"
              >
                👁️
              </button>
              
              <button
                onClick={() => handleAssetAction(asset.id, asset.is_active ? 'deactivate' : 'activate')}
                className={`action-btn ${asset.is_active ? 'deactivate' : 'activate'}`}
                title={asset.is_active ? 'Deactivate' : 'Activate'}
              >
                {asset.is_active ? '🚫' : '✅'}
              </button>

              <button
                onClick={() => handleAssetAction(asset.id, asset.is_featured ? 'unfeature' : 'feature')}
                className={`action-btn ${asset.is_featured ? 'unfeature' : 'feature'}`}
                title={asset.is_featured ? 'Remove from Featured' : 'Add to Featured'}
              >
                {asset.is_featured ? '⭐' : '☆'}
              </button>

              <button
                onClick={() => handleAssetAction(asset.id, 'delete')}
                className="action-btn delete"
                title="Delete Asset"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAssetModal && selectedAsset && (
        <div className="asset-modal-overlay" onClick={closeAssetModal}>
          <div className="asset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asset Details</h3>
              <button onClick={closeAssetModal} className="close-btn">×</button>
            </div>
            
            <div className="modal-content">
              <div className="asset-preview-section">
                {selectedAsset.preview_image ? (
                  <img src={selectedAsset.preview_image} alt={selectedAsset.title} />
                ) : (
                  <div className="no-preview">No preview available</div>
                )}
              </div>

              <div className="asset-info-section">
                <h4>{selectedAsset.title}</h4>
                <p>{selectedAsset.description}</p>
                
                <div className="asset-details-grid">
                  <div className="detail-item">
                    <label>Price:</label>
                    <span>{formatPrice(selectedAsset.price)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category:</label>
                    <span>{selectedAsset.category?.name || 'Uncategorized'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Seller:</label>
                    <span>{selectedAsset.seller?.username}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={selectedAsset.is_active ? 'active' : 'inactive'}>
                      {selectedAsset.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Featured:</label>
                    <span>{selectedAsset.is_featured ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Created:</label>
                    <span>{selectedAsset.created_at ? new Date(selectedAsset.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Downloads:</label>
                    <span>{selectedAsset.download_count || 0}</span>
                  </div>
                  <div className="detail-item">
                    <label>File Size:</label>
                    <span>{selectedAsset.file_size ? `${(selectedAsset.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</span>
                  </div>
                </div>

                {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                  <div className="asset-tags">
                    <label>Tags:</label>
                    <div className="tags-list">
                      {selectedAsset.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssetManagement;
