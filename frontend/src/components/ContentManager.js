import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogAPI, portfolioAPI, assetAPI } from '../api';
import { createPortfolioImageUrl } from '../utils/portfolioImageUtils';
import './ContentManager.css';

const ContentManager = ({ blogPosts, portfolioItems, assets, onRefresh }) => {
  const navigate = useNavigate();
  const [activeContentType, setActiveContentType] = useState('blogs');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Reset selections when switching content types
  useEffect(() => {
    setSelectedItems([]);
    setSearchTerm('');
    setFilterStatus('all');
  }, [activeContentType]);

  // Get current content based on active type
  const getCurrentContent = () => {
    switch (activeContentType) {
      case 'blogs':
        return blogPosts || [];
      case 'portfolio':
        return portfolioItems || [];
      case 'assets':
        return assets || [];
      default:
        return [];
    }
  };

  // Filter and sort content
  const getFilteredContent = () => {
    let content = getCurrentContent();

    // Search filter
    if (searchTerm) {
      content = content.filter(item =>
        (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      content = content.filter(item => {
        switch (filterStatus) {
          case 'published':
            return item.published || item.is_published || item.status === 'published';
          case 'draft':
            return !item.published && !item.is_published || item.status === 'draft';
          case 'featured':
            return item.featured || item.is_featured;
          default:
            return true;
        }
      });
    }

    // Sort content
    content.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date fields
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return content;
  };

  // Handle item selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    const filteredContent = getFilteredContent();
    if (selectedItems.length === filteredContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredContent.map(item => item.id));
    }
  };

  // CRUD Operations
  const handleCreate = () => {
    switch (activeContentType) {
      case 'blogs':
        navigate('/create/blog');
        break;
      case 'portfolio':
        navigate('/create/upload-work');
        break;
      case 'assets':
        navigate('/marketplace/upload');
        break;
      default:
        break;
    }
  };

  const handleEdit = (item) => {
    switch (activeContentType) {
      case 'blogs':
        navigate(`/create/blog/${item.id}`);
        break;
      case 'portfolio':
        navigate(`/upload-work/${item.id}`);
        break;
      case 'assets':
        navigate(`/marketplace/asset/${item.id}/edit`);
        break;
      default:
        break;
    }
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleQuickToggle = async (item, action) => {
    setLoading(true);
    try {
      let updateData = {};
      
      if (action === 'publish') {
        const isCurrentlyPublished = getItemStatus(item) === 'Published';
        if (activeContentType === 'blogs') {
          updateData = { published: !isCurrentlyPublished };
        } else if (activeContentType === 'assets') {
          updateData = { is_published: !isCurrentlyPublished };
        }
      } else if (action === 'feature') {
        const isCurrentlyFeatured = item.featured || item.is_featured;
        if (activeContentType === 'blogs') {
          updateData = { featured: !isCurrentlyFeatured };
        } else if (activeContentType === 'assets') {
          updateData = { is_featured: !isCurrentlyFeatured };
        }
      }

      switch (activeContentType) {
        case 'blogs':
          await blogAPI.update(item.id, updateData);
          break;
        case 'assets':
          await assetAPI.update(item.id, updateData);
          break;
        default:
          break;
      }
      
      // Refresh the data
      onRefresh();
    } catch (error) {
      console.error(`Error toggling ${action}:`, error);
      alert(`Failed to ${action} item. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setLoading(true);
    try {
      switch (activeContentType) {
        case 'blogs':
          await blogAPI.delete(itemToDelete.id);
          break;
        case 'portfolio':
          await portfolioAPI.delete(itemToDelete.id);
          break;
        case 'assets':
          await assetAPI.delete(itemToDelete.id);
          break;
        default:
          break;
      }
      
      // Refresh the data
      onRefresh();
      setShowDeleteModal(false);
      setItemToDelete(null);
      setSelectedItems(prev => prev.filter(id => id !== itemToDelete.id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) {
      alert('Please select items first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedItems.length} items?`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const itemId of selectedItems) {
        try {
          switch (action) {
            case 'delete':
              switch (activeContentType) {
                case 'blogs':
                  await blogAPI.delete(itemId);
                  break;
                case 'portfolio':
                  await portfolioAPI.delete(itemId);
                  break;
                case 'assets':
                  await assetAPI.delete(itemId);
                  break;
                default:
                  break;
              }
              break;
            case 'publish':
              // Implementation for bulk publish
              const publishData = { published: true };
              switch (activeContentType) {
                case 'blogs':
                  await blogAPI.update(itemId, publishData);
                  break;
                case 'assets':
                  await assetAPI.update(itemId, { is_published: true });
                  break;
                default:
                  break;
              }
              break;
            case 'unpublish':
              // Implementation for bulk unpublish
              const unpublishData = { published: false };
              switch (activeContentType) {
                case 'blogs':
                  await blogAPI.update(itemId, unpublishData);
                  break;
                case 'assets':
                  await assetAPI.update(itemId, { is_published: false });
                  break;
                default:
                  break;
              }
              break;
            case 'feature':
              // Implementation for bulk feature
              const featureData = { featured: true };
              switch (activeContentType) {
                case 'blogs':
                  await blogAPI.update(itemId, featureData);
                  break;
                case 'assets':
                  await assetAPI.update(itemId, { is_featured: true });
                  break;
                default:
                  break;
              }
              break;
            default:
              break;
          }
          successCount++;
        } catch (itemError) {
          console.error(`Error ${action}ing item ${itemId}:`, itemError);
          errorCount++;
        }
      }
      
      // Show results
      if (errorCount === 0) {
        alert(`Successfully ${action}ed ${successCount} items!`);
      } else {
        alert(`${action} completed: ${successCount} successful, ${errorCount} failed. Please check the console for details.`);
      }
      
      onRefresh();
      setSelectedItems([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Bulk operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getItemImage = (item) => {
    let imageUrl = null;
    
    if (activeContentType === 'blogs') {
      imageUrl = item.featured_image;
    } else if (activeContentType === 'portfolio') {
      imageUrl = item.preview_image || item.image;
    } else if (activeContentType === 'assets') {
      imageUrl = item.preview_image || item.thumbnail_url;
    }
    
    if (imageUrl) {
      // Use the portfolio image utility for proper URL handling
      return createPortfolioImageUrl(imageUrl);
    }
    
    return '/api/placeholder/300/200';
  };

  const getItemStatus = (item) => {
    if (activeContentType === 'blogs') {
      return item.published ? 'Published' : 'Draft';
    } else if (activeContentType === 'assets') {
      return item.is_published ? 'Published' : 'Draft';
    }
    return 'Published';
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'featured':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getContentStats = () => {
    const content = getCurrentContent();
    
    const stats = {
      total: content.length,
      published: 0,
      draft: 0,
      featured: 0,
      totalViews: 0,
      totalLikes: 0
    };

    content.forEach(item => {
      // Count published/draft
      const status = getItemStatus(item);
      if (status === 'Published') {
        stats.published++;
      } else {
        stats.draft++;
      }

      // Count featured
      if (item.featured || item.is_featured) {
        stats.featured++;
      }

      // Sum views and likes
      stats.totalViews += item.views || 0;
      stats.totalLikes += item.likes || 0;
    });

    return stats;
  };

  const filteredContent = getFilteredContent();
  const contentStats = getContentStats();

  return (
    <div className="content-manager">
      <div className="content-manager-header">
        <h3>Content Manager</h3>
        <p>Manage your blogs, portfolio items, and assets in one place</p>
      </div>

      {/* Content Type Tabs */}
      <div className="content-tabs">
        <button
          className={`tab-btn ${activeContentType === 'blogs' ? 'active' : ''}`}
          onClick={() => setActiveContentType('blogs')}
        >
          <span className="tab-icon">📝</span>
          Blog Posts ({blogPosts?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeContentType === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveContentType('portfolio')}
        >
          <span className="tab-icon">🎨</span>
          Portfolio ({portfolioItems?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeContentType === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveContentType('assets')}
        >
          <span className="tab-icon">💎</span>
          Assets ({assets?.length || 0})
        </button>
      </div>

      {/* Content Statistics */}
      <div className="content-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{contentStats.total}</div>
            <div className="stat-label">Total Items</div>
          </div>
          {activeContentType !== 'portfolio' && (
            <>
              <div className="stat-card">
                <div className="stat-number">{contentStats.published}</div>
                <div className="stat-label">Published</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{contentStats.draft}</div>
                <div className="stat-label">Draft</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{contentStats.featured}</div>
                <div className="stat-label">Featured</div>
              </div>
            </>
          )}
          <div className="stat-card">
            <div className="stat-number">{contentStats.totalViews.toLocaleString()}</div>
            <div className="stat-label">Total Views</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{contentStats.totalLikes.toLocaleString()}</div>
            <div className="stat-label">Total Likes</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="content-controls">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder={`Search ${activeContentType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="featured">Featured</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="created_at">Date Created</option>
            <option value="updated_at">Date Modified</option>
            <option value="title">Title</option>
            <option value="views">Views</option>
          </select>

          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <i className={`fas fa-sort-amount-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>

        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={handleCreate}
          >
            <i className="fas fa-plus"></i>
            New {activeContentType === 'blogs' ? 'Post' : activeContentType === 'portfolio' ? 'Portfolio Item' : 'Asset'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bulk-actions">
          <span className="selection-count">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          <div className="bulk-buttons">
            <button
              className="btn btn-success"
              onClick={() => handleBulkAction('publish')}
              disabled={loading}
              style={{ display: activeContentType === 'portfolio' ? 'none' : 'inline-flex' }}
            >
              <i className="fas fa-globe"></i>
              Publish
            </button>
            <button
              className="btn btn-warning"
              onClick={() => handleBulkAction('unpublish')}
              disabled={loading}
              style={{ display: activeContentType === 'portfolio' ? 'none' : 'inline-flex' }}
            >
              <i className="fas fa-eye-slash"></i>
              Unpublish
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleBulkAction('feature')}
              disabled={loading}
              style={{ display: activeContentType === 'portfolio' ? 'none' : 'inline-flex' }}
            >
              <i className="fas fa-star"></i>
              Feature
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleBulkAction('delete')}
              disabled={loading}
            >
              <i className="fas fa-trash"></i>
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="content-grid">
        {filteredContent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {activeContentType === 'blogs' && <i className="fas fa-blog"></i>}
              {activeContentType === 'portfolio' && <i className="fas fa-palette"></i>}
              {activeContentType === 'assets' && <i className="fas fa-gem"></i>}
            </div>
            <h4>No {activeContentType} found</h4>
            <p>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : `Create your first ${activeContentType === 'blogs' ? 'blog post' : activeContentType === 'portfolio' ? 'portfolio item' : 'asset'}`
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button className="btn btn-primary" onClick={handleCreate}>
                <i className="fas fa-plus"></i>
                Create New
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="content-header">
              <div className="select-all">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredContent.length && filteredContent.length > 0}
                  onChange={selectAllItems}
                />
                <span>Select All</span>
              </div>
              <div className="results-count">
                Showing {filteredContent.length} of {getCurrentContent().length} items
              </div>
            </div>

            {/* Content Items */}
            <div className="content-items">
              {filteredContent.map((item) => (
                <div key={item.id} className="content-item">
                  <div className="item-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                    />
                  </div>

                  <div className="item-image">
                    <img
                      src={getItemImage(item)}
                      alt={item.title}
                      onError={(e) => {
                        e.target.src = '/api/placeholder/300/200';
                      }}
                    />
                  </div>

                  <div className="item-content">
                    <div className="item-header">
                      <h4 className="item-title">{item.title}</h4>
                      <div className="item-badges">
                        <span className={`status-badge ${getStatusColor(getItemStatus(item))}`}>
                          {getItemStatus(item)}
                        </span>
                        {(item.featured || item.is_featured) && (
                          <span className="status-badge featured">
                            <i className="fas fa-star"></i> Featured
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="item-description">
                      {item.description && item.description.length > 100
                        ? `${item.description.substring(0, 100)}...`
                        : item.description || 'No description available'
                      }
                    </p>

                    <div className="item-meta">
                      <span className="meta-item">
                        <i className="fas fa-calendar"></i>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.views !== undefined && (
                        <span className="meta-item">
                          <i className="fas fa-eye"></i>
                          {item.views} views
                        </span>
                      )}
                      {item.likes !== undefined && (
                        <span className="meta-item">
                          <i className="fas fa-heart"></i>
                          {item.likes} likes
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="item-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEdit(item)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    
                    {/* Quick Publish/Unpublish for blogs and assets */}
                    {activeContentType !== 'portfolio' && (
                      <button
                        className={`action-btn ${getItemStatus(item) === 'Published' ? 'unpublish' : 'publish'}`}
                        onClick={() => handleQuickToggle(item, 'publish')}
                        title={getItemStatus(item) === 'Published' ? 'Unpublish' : 'Publish'}
                      >
                        <i className={`fas ${getItemStatus(item) === 'Published' ? 'fa-eye-slash' : 'fa-globe'}`}></i>
                      </button>
                    )}
                    
                    {/* Quick Feature toggle for blogs and assets */}
                    {activeContentType !== 'portfolio' && (
                      <button
                        className={`action-btn ${(item.featured || item.is_featured) ? 'unfeature' : 'feature'}`}
                        onClick={() => handleQuickToggle(item, 'feature')}
                        title={(item.featured || item.is_featured) ? 'Remove from Featured' : 'Feature'}
                      >
                        <i className={`fas ${(item.featured || item.is_featured) ? 'fa-star' : 'fa-star-o'}`}></i>
                      </button>
                    )}
                    
                    <button
                      className="action-btn delete"
                      onClick={() => confirmDelete(item)}
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    {activeContentType === 'blogs' && (
                      <button
                        className="action-btn view"
                        onClick={() => window.open(`/blog/${item.slug}`, '_blank')}
                        title="View"
                      >
                        <i className="fas fa-external-link-alt"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Confirm Delete</h4>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete "<strong>{itemToDelete?.title}</strong>"?
              </p>
              <p className="warning-text">
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
