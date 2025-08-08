import React, { useState, useEffect } from 'react';
import { assetAPI } from '../../api';
import { useAuth } from '../Auth/AuthContext';
import SEO from '../common/SEO';
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAssets();
  }, [selectedCategory, searchQuery, sortBy, priceRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Load categories and trending assets (these don't require authentication)
      const [categoriesRes, trendingRes] = await Promise.all([
        assetAPI.getCategories().catch(err => {
          console.warn('Failed to load categories:', err);
          return { data: [] }; // getCategories returns axios response
        }),
        assetAPI.getTrending({ limit: 6 }).catch(err => {
          console.warn('Failed to load trending assets:', err);
          return [];
        })
      ]);

      // Handle different response formats:
      // - getCategories returns axios response object with .data
      // - getTrending returns data directly or error object
      const categories = categoriesRes?.data ? categoriesRes.data : (Array.isArray(categoriesRes) ? categoriesRes : []);
      const trending = Array.isArray(trendingRes) ? trendingRes : [];
      
      console.log('Categories response:', categoriesRes, 'Processed:', categories);
      console.log('Trending response:', trendingRes, 'Processed:', trending);
      
      setCategories(categories);
      setTrending(trending);

      // Load recommended assets only if user is authenticated
      if (user) {
        try {
          const recommendedRes = await assetAPI.getRecommended({ limit: 6 });
          console.log('Recommended response:', recommendedRes);
          // Check if response is an array before setting state
          const recommended = Array.isArray(recommendedRes) ? recommendedRes : [];
          setRecommended(recommended);
        } catch (err) {
          console.warn('No recommendations available or user not authenticated:', err);
          setRecommended([]); // Set empty array to prevent undefined errors
        }
      } else {
        setRecommended([]); // Set empty array for non-authenticated users
      }

      // Load initial assets
      await loadAssets();
    } catch (err) {
      console.error('Failed to load marketplace data:', err);
      setError('Failed to load marketplace data. Please try again.');
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
      
      // Check if response has error property (from enhanced error handling)
      if (response && response.error) {
        console.error('API returned error:', response.message);
        setAssets([]);
        return;
      }
      
      // Only set assets if response is an array, not an error object
      setAssets(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to load assets:', err);
      setAssets([]); // Set empty array on error to prevent undefined errors
      // Don't set global error here as this might be called frequently
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

  const AssetCard = ({ asset }) => {
    // Add safety checks for asset properties
    if (!asset) return null;
    
    return (
      <div className="asset-card">
        <div className="asset-image">
          {asset.preview_image && (
            <img src={asset.preview_image} alt={asset.title || 'Asset'} loading="lazy" />
          )}
          <div className="asset-overlay">
            <div className="asset-rating">
              ⭐ {asset.rating ? parseFloat(asset.rating).toFixed(1) : '0.0'} ({asset.review_count || 0})
            </div>
          </div>
        </div>
        
        <div className="asset-info">
          <h3 className="asset-title">{asset.title || 'Untitled Asset'}</h3>
          <p className="asset-seller">by {asset.seller?.username || 'Unknown'}</p>
          <p className="asset-description">
            {asset.description ? asset.description.substring(0, 100) + '...' : 'No description available'}
          </p>
          
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
  };

  const TrendingSection = () => (
    <section className="trending-section">
      <h2>🔥 Trending Assets</h2>
      <div className="assets-grid trending-grid">
        {(trending || []).map(asset => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
      {(!trending || trending.length === 0) && (
        <div className="no-assets">
          <p>No trending assets available at the moment.</p>
        </div>
      )}
    </section>
  );

  const RecommendedSection = () => (
    user && (recommended || []).length > 0 && (
      <section className="recommended-section">
        <h2>💡 Recommended for You</h2>
        <div className="assets-grid recommended-grid">
          {(recommended || []).map(asset => (
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
      <SEO
        title="Creative Assets Marketplace"
        description="Discover and purchase high-quality creative assets from talented South Sudanese creators. Find graphics, templates, photos, and more on VikraHub."
        url={`${window.location.origin}/marketplace`}
        image={`${window.location.origin}/vikrahub-hero.jpg`}
      />
      
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
        <h2>All Assets ({(assets || []).length})</h2>
        {(!assets || assets.length === 0) ? (
          <div className="no-assets">
            <p>No assets found matching your criteria.</p>
          </div>
        ) : (
          <div className="assets-grid">
            {(assets || []).map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AssetsMarketplace;
