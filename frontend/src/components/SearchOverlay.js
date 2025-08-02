import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchAPI } from '../api';
import './SearchOverlay.css';

const SearchOverlay = ({ query, isVisible, onClose }) => {
  const [results, setResults] = useState({
    users: [],
    freelancers: [],
    creators: [],
    assets: [],
    collections: [],
    services: [],
    portfolios: [],
    loading: false,
    error: null
  });
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (query && query.trim().length > 2) {
      performSearch(query.trim());
    } else {
      setResults(prev => ({ ...prev, loading: false }));
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    console.log('🔍 Starting search for:', searchQuery);
    setResults(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Call the real API for universal search
      console.log('📡 Calling searchAPI.universal...');
      const searchResults = await searchAPI.universal(searchQuery);
      console.log('✅ Search results received:', searchResults);
      
      setResults({
        ...searchResults,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('❌ Search failed:', error);
      setResults(prev => ({
        ...prev,
        loading: false,
        error: 'Search failed. Please try again.'
      }));
    }
  };

  const getTotalResults = () => {
    return (results.users?.length || 0) + 
           (results.freelancers?.length || 0) + 
           (results.creators?.length || 0) + 
           (results.assets?.length || 0) + 
           (results.collections?.length || 0) + 
           (results.services?.length || 0) + 
           (results.portfolios?.length || 0);
  };

  const handleViewAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    onClose();
  };

  // Render a user result card using real backend fields
  const renderUserResult = (user) => (
    <Link to={`/profile/${user.username}`} key={user.id || user.username} className="search-result-item" onClick={onClose}>
      <div className="result-avatar">
        {user.profile_picture ? (
          <img src={user.profile_picture} alt={user.username} />
        ) : (
          <div className="avatar-fallback">
            {user.first_name?.[0] || user.username?.[0]}
            {user.last_name?.[0] || ''}
          </div>
        )}
      </div>
      <div className="result-content">
        <h4>{user.first_name || ''} {user.last_name || ''} <span style={{color:'#aaa', fontWeight:400}}>@{user.username}</span></h4>
        {user.headline && <p>{user.headline}</p>}
        {user.bio && <p>{user.bio}</p>}
      </div>
      <div className="result-type">User</div>
    </Link>
  );

  const renderFreelancerResult = (freelancer) => (
    <Link to={`/freelancer/${freelancer.user.username}`} key={freelancer.id} className="search-result-item" onClick={onClose}>
      <div className="result-avatar">
        {freelancer.user.profile_picture ? (
          <img src={freelancer.user.profile_picture} alt={freelancer.user.full_name} />
        ) : (
          <div className="result-avatar-initials">
            {freelancer.user.full_name?.charAt(0) || freelancer.user.username?.charAt(0) || 'F'}
          </div>
        )}
      </div>
      <div className="result-content">
        <h4>{freelancer.user.full_name || freelancer.user.username}</h4>
        <p>{freelancer.title}</p>
        {freelancer.skills && <span className="result-skills">{freelancer.skills.slice(0, 3).join(', ')}</span>}
      </div>
      <div className="result-type">Freelancer</div>
    </Link>
  );

  const renderAssetResult = (asset) => (
    <Link to={`/marketplace/${asset.id}`} key={asset.id} className="search-result-item" onClick={onClose}>
      <div className="result-thumbnail">
        {asset.thumbnail ? (
          <img src={asset.thumbnail} alt={asset.title} />
        ) : (
          <div className="result-thumbnail-placeholder">
            <i className="fas fa-star"></i>
          </div>
        )}
      </div>
      <div className="result-content">
        <h4>{asset.title}</h4>
        <p>{asset.category}</p>
        <span className="result-price">${asset.price || 'Free'}</span>
      </div>
      <div className="result-type">Asset</div>
    </Link>
  );

  if (!isVisible || !query || query.trim().length < 3) {
    return null;
  }

  return (
    <div className="search-results-overlay" onClick={onClose}>
      <div className="search-results-container" onClick={e => e.stopPropagation()}>
        <div className="search-results-header">
          <h3>Search Results for "{query}"</h3>
          <button className="close-search" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {results.loading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
            <p>Searching VikraHub...</p>
          </div>
        )}

        {results.error && (
          <div className="search-error">
            <p>{results.error}</p>
          </div>
        )}

        {!results.loading && !results.error && getTotalResults() === 0 && (
          <div className="no-results">
            <i className="fas fa-search" style={{fontSize: '48px'}}></i>
            <h4>No results found</h4>
            <p>Try adjusting your search terms or browse our categories</p>
          </div>
        )}

        {!results.loading && !results.error && getTotalResults() > 0 && (
          <div className="search-results-content">
            <div className="result-section">
              <div className="section-header">
                <h4>Quick Results</h4>
                <button className="view-all-btn" onClick={handleViewAllResults}>
                  View All ({getTotalResults()})
                </button>
              </div>
              
              <div className="result-list">
                {results.users?.slice(0, 2).map(renderUserResult)}
                {results.freelancers?.slice(0, 2).map(renderFreelancerResult)}
                {results.assets?.slice(0, 3).map(renderAssetResult)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
