import React, { useState, useEffect } from 'react';
import { assetAPI } from '../../api';
import { useAuth } from '../Auth/AuthContext';
import './AssetsMarketplace.css';

const AssetsMarketplace = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [selectedCategory, searchQuery, sortBy, priceRange]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load categories, trending, and recommended assets
      const [categoriesRes, trendingRes] = await Promise.all([
        assetAPI.getCategories(),
        assetAPI.getTrending({ limit: 6 })
      ]);

      setCategories(categoriesRes.data);
      setTrending(trendingRes.data);

      // Load recommended assets if user is authenticated
      if (user) {
        try {
          const recommendedRes = await assetAPI.getRecommended({ limit: 6 });
          setRecommended(recommendedRes.data);
        } catch (err) {
          console.log('No recommendations available');
        }
      }

      // Load initial assets
      await loadAssets();
    } catch (err) {
      setError('Failed to load marketplace data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const params = {
        search: searchQuery,
        category: selectedCategory,
        sort: sortBy,
        min_price: priceRange.min,
        max_price: priceRange.max,
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await assetAPI.getAll(params);
      setAssets(response.data);
    } catch (err) {
      setError('Failed to load assets');
      console.error(err);
    }
  };

  const handlePurchase = async (assetId) => {
    if (!user) {
      alert('Please login to purchase assets');
      return;
    }

    try {
      const response = await assetAPI.purchase(assetId);
      alert('Asset purchased successfully!');
      // Refresh assets to update purchase status
      loadAssets();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Purchase failed';
      alert(errorMsg);
    }
  };

  const handleDownload = async (assetId) => {
    try {
      const response = await assetAPI.download(assetId);
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = response.data.download_url;
      link.download = true;
      link.click();
      
      alert(`Download started. Downloads remaining: ${response.data.downloads_remaining}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Download failed';
      alert(errorMsg);
    }
  };

  const AssetCard = ({ asset }) => (
    <div className="asset-card">
      <div className="asset-image">
        <img src={asset.preview_image} alt={asset.title} loading="lazy" />
        <div className="asset-overlay">
          <div className="asset-rating">
            ⭐ {asset.rating ? parseFloat(asset.rating).toFixed(1) : '0.0'} ({asset.review_count || 0})
          </div>
        </div>
      </div>
      
      <div className="asset-info">
        <h3 className="asset-title">{asset.title}</h3>
        <p className="asset-seller">by {asset.seller?.username || 'Unknown'}</p>
        <p className="asset-description">{asset.description ? asset.description.substring(0, 100) + '...' : ''}</p>
        
        <div className="asset-tags">
          {(asset.tags_list || []).slice(0, 3).map((tag, index) => (
            <span key={index} className="asset-tag">{tag}</span>
          ))}
        </div>
        
        <div className="asset-footer">
          <div className="asset-price">${asset.price ? parseFloat(asset.price).toFixed(2) : '0.00'}</div>
          <div className="asset-actions">
            {asset.is_purchased ? (
              <button 
                className="btn btn-success"
                onClick={() => handleDownload(asset.id)}
              >
                Download
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={() => handlePurchase(asset.id)}
              >
                Purchase
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const TrendingSection = () => (
    <section className="trending-section">
      <h2>🔥 Trending Assets</h2>
      <div className="assets-grid trending-grid">
        {trending.map(asset => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  );

  const RecommendedSection = () => (
    user && recommended.length > 0 && (
      <section className="recommended-section">
        <h2>💡 Recommended for You</h2>
        <div className="assets-grid recommended-grid">
          {recommended.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </section>
    )
  );

  if (loading) {
    return (
      <div className="marketplace-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading marketplace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="marketplace-container">
        <div className="error-message">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadInitialData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <h1>🎨 Creative Assets Marketplace</h1>
        <p>Discover and purchase high-quality creative assets from talented creators</p>
      </header>

      {/* Search and Filters */}
      <div className="marketplace-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-row">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="rating">Highest Rated</option>
            <option value="downloads">Most Downloaded</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>

          <div className="price-range">
            <input
              type="number"
              placeholder="Min $"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="price-input"
            />
            <input
              type="number"
              placeholder="Max $"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="price-input"
            />
          </div>
        </div>
      </div>

      {/* Trending Section */}
      <TrendingSection />

      {/* Recommended Section */}
      <RecommendedSection />

      {/* All Assets */}
      <section className="all-assets-section">
        <h2>All Assets ({assets.length})</h2>
        {assets.length === 0 ? (
          <div className="no-assets">
            <p>No assets found matching your criteria.</p>
          </div>
        ) : (
          <div className="assets-grid">
            {assets.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AssetsMarketplace;
