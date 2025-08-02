import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = ({ 
  placeholder = "Search creators, freelancers, or services...", 
  onSearch,
  showFilters = true,
  variant = 'default' // 'default', 'hero', 'compact'
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'creators', 'freelancers', 'clients'
    category: 'all', // skill/service category
    location: '',
    industry: 'all', // for clients
    sortBy: 'relevance', // 'relevance', 'popular', 'newest', 'name', 'rating'
    sortOrder: 'desc' // 'asc', 'desc'
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Enhanced suggestions with more comprehensive data
  const mockSuggestions = [
    // Names/Usernames
    { type: 'user', name: 'Sarah Johnson (@sarahj_art)', category: 'creator', subcategory: 'art', location: 'Juba' },
    { type: 'user', name: 'Michael Chen (@mikedev)', category: 'freelancer', subcategory: 'tech', location: 'Wau' },
    { type: 'user', name: 'Grace Akol (@graceshots)', category: 'creator', subcategory: 'photography', location: 'Bentiu' },
    
    // Roles/Types
    { type: 'role', name: 'Visual Artists', category: 'creator', subcategory: 'art' },
    { type: 'role', name: 'Web Developers', category: 'freelancer', subcategory: 'tech' },
    { type: 'role', name: 'Graphic Designers', category: 'freelancer', subcategory: 'design' },
    { type: 'role', name: 'Photographers', category: 'creator', subcategory: 'photography' },
    { type: 'role', name: 'Content Writers', category: 'freelancer', subcategory: 'writing' },
    { type: 'role', name: 'Fashion Designers', category: 'creator', subcategory: 'fashion' },
    { type: 'role', name: 'Musicians', category: 'creator', subcategory: 'music' },
    { type: 'role', name: 'Video Editors', category: 'freelancer', subcategory: 'video' },
    
    // Skills/Services
    { type: 'skill', name: 'Logo Design', category: 'freelancer', subcategory: 'design' },
    { type: 'skill', name: 'Website Development', category: 'freelancer', subcategory: 'tech' },
    { type: 'skill', name: 'Portrait Photography', category: 'creator', subcategory: 'photography' },
    { type: 'skill', name: 'Content Marketing', category: 'freelancer', subcategory: 'marketing' },
    { type: 'skill', name: 'Mobile App Development', category: 'freelancer', subcategory: 'tech' },
    { type: 'skill', name: 'Brand Identity Design', category: 'freelancer', subcategory: 'design' },
    { type: 'skill', name: 'Documentary Photography', category: 'creator', subcategory: 'photography' },
    { type: 'skill', name: 'Traditional Art', category: 'creator', subcategory: 'art' },
    
    // Locations/Cities
    { type: 'location', name: 'Juba', category: 'location', subcategory: 'city' },
    { type: 'location', name: 'Wau', category: 'location', subcategory: 'city' },
    { type: 'location', name: 'Malakal', category: 'location', subcategory: 'city' },
    { type: 'location', name: 'Bentiu', category: 'location', subcategory: 'city' },
    { type: 'location', name: 'Yei', category: 'location', subcategory: 'city' },
    { type: 'location', name: 'Torit', category: 'location', subcategory: 'city' },
    { type: 'location', name: 'Aweil', category: 'location', subcategory: 'city' },
    { type: 'location', name: 'Bor', category: 'location', subcategory: 'city' },
    
    // Industries (for clients)
    { type: 'industry', name: 'Education', category: 'client', subcategory: 'industry' },
    { type: 'industry', name: 'Healthcare', category: 'client', subcategory: 'industry' },
    { type: 'industry', name: 'NGO/Non-Profit', category: 'client', subcategory: 'industry' },
    { type: 'industry', name: 'Technology', category: 'client', subcategory: 'industry' },
    { type: 'industry', name: 'Agriculture', category: 'client', subcategory: 'industry' },
    { type: 'industry', name: 'Tourism', category: 'client', subcategory: 'industry' },
    { type: 'industry', name: 'Media & Communications', category: 'client', subcategory: 'industry' },
    { type: 'industry', name: 'Government', category: 'client', subcategory: 'industry' },
    
    // Tags/Keywords
    { type: 'tag', name: 'Traditional Culture', category: 'tag', subcategory: 'cultural' },
    { type: 'tag', name: 'Modern Design', category: 'tag', subcategory: 'style' },
    { type: 'tag', name: 'Sustainability', category: 'tag', subcategory: 'theme' },
    { type: 'tag', name: 'Community Development', category: 'tag', subcategory: 'social' },
    { type: 'tag', name: 'Digital Innovation', category: 'tag', subcategory: 'tech' },
    { type: 'tag', name: 'Cultural Heritage', category: 'tag', subcategory: 'cultural' },
    { type: 'tag', name: 'Youth Empowerment', category: 'tag', subcategory: 'social' },
    { type: 'tag', name: 'Entrepreneurship', category: 'tag', subcategory: 'business' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery = query, searchFilters = filters) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowSuggestions(false);
      
      if (onSearch) {
        onSearch({ query: searchQuery, filters: searchFilters });
      } else {
        // Default behavior: navigate to search results
        const searchParams = new URLSearchParams({
          q: searchQuery,
          type: searchFilters.type,
          ...(searchFilters.location && { location: searchFilters.location }),
          ...(searchFilters.category !== 'all' && { category: searchFilters.category }),
          ...(searchFilters.industry !== 'all' && { industry: searchFilters.industry }),
          ...(searchFilters.sortBy !== 'relevance' && { sortBy: searchFilters.sortBy }),
          ...(searchFilters.sortOrder !== 'desc' && { sortOrder: searchFilters.sortOrder })
        });
        navigate(`/search?${searchParams}`);
      }
    }, 500);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      // Smart filtering based on query context
      const filtered = mockSuggestions.filter(suggestion => {
        const searchValue = value.toLowerCase();
        const matchesName = suggestion.name.toLowerCase().includes(searchValue);
        
        // Check for location-specific searches
        const isLocationQuery = searchValue.includes(' in ') || 
                               searchValue.startsWith('in ') ||
                               searchValue.endsWith(' location');
        
        // Check for role-specific searches  
        const isRoleQuery = searchValue.includes('photographer') ||
                           searchValue.includes('designer') ||
                           searchValue.includes('developer') ||
                           searchValue.includes('artist') ||
                           searchValue.includes('writer');
        
        // Prioritize suggestions based on query type
        if (isLocationQuery && suggestion.type === 'location') return true;
        if (isRoleQuery && suggestion.type === 'role') return true;
        
        return matchesName;
      });
      
      // Sort suggestions by relevance
      const sorted = filtered.sort((a, b) => {
        const aRelevance = a.name.toLowerCase().startsWith(value.toLowerCase()) ? 1 : 0;
        const bRelevance = b.name.toLowerCase().startsWith(value.toLowerCase()) ? 1 : 0;
        return bRelevance - aRelevance;
      });
      
      setSuggestions(sorted.slice(0, 8)); // Show max 8 suggestions
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.name);
    
    // Smart filter setting based on suggestion type
    const newFilters = { ...filters };
    
    switch (suggestion.type) {
      case 'user':
        newFilters.type = suggestion.category;
        break;
      case 'role':
        newFilters.type = suggestion.category;
        newFilters.category = suggestion.subcategory;
        break;
      case 'skill':
        newFilters.type = suggestion.category;
        newFilters.category = suggestion.subcategory;
        break;
      case 'location':
        newFilters.location = suggestion.name;
        break;
      case 'industry':
        newFilters.type = 'clients';
        newFilters.industry = suggestion.name;
        break;
      case 'tag':
        // Tags can apply to any type, so keep current type filter
        break;
      default:
        break;
    }
    
    setFilters(newFilters);
    handleSearch(suggestion.name, newFilters);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  return (
    <div className={`search-bar search-bar--${variant}`} ref={searchRef}>
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          
          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => query && setShowSuggestions(true)}
          />
          
          {isLoading && (
            <div className="search-loading">
              <div className="spinner"></div>
            </div>
          )}
          
          <button 
            className="search-button"
            onClick={() => handleSearch()}
            disabled={!query.trim() || isLoading}
          >
            🔍
          </button>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map((suggestion, index) => {
              // Dynamic icons based on suggestion type
              const getIcon = (type) => {
                switch (type) {
                  case 'user': return '👤';
                  case 'role': return suggestion.category === 'creator' ? '🎨' : '💼';
                  case 'skill': return '⚡';
                  case 'location': return '📍';
                  case 'industry': return '🏢';
                  case 'tag': return '🏷️';
                  default: return '🔍';
                }
              };
              
              return (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className={`suggestion-type suggestion-type--${suggestion.type}`}>
                    {getIcon(suggestion.type)}
                  </span>
                  <span className="suggestion-name">{suggestion.name}</span>
                  <span className="suggestion-category">
                    {suggestion.type === 'location' ? 'City' : 
                     suggestion.type === 'industry' ? 'Industry' :
                     suggestion.type === 'skill' ? 'Service' :
                     suggestion.type === 'tag' ? 'Tag' :
                     suggestion.type === 'user' ? 'Profile' :
                     suggestion.subcategory}
                  </span>
                  {suggestion.location && (
                    <span className="suggestion-location">📍 {suggestion.location}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search Filters */}
      {showFilters && (
        <div className="search-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Type:</label>
              <select 
                value={filters.type} 
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">All</option>
                <option value="creators">Creators</option>
                <option value="freelancers">Freelancers</option>
                <option value="clients">Clients</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Category:</label>
              <select 
                value={filters.category} 
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="art">Visual Arts</option>
                <option value="design">Design</option>
                <option value="tech">Technology</option>
                <option value="writing">Writing</option>
                <option value="music">Music</option>
                <option value="photography">Photography</option>
                <option value="video">Video</option>
                <option value="fashion">Fashion</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Location:</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <option value="">All Locations</option>
                <option value="Juba">Juba</option>
                <option value="Wau">Wau</option>
                <option value="Malakal">Malakal</option>
                <option value="Bentiu">Bentiu</option>
                <option value="Yei">Yei</option>
                <option value="Torit">Torit</option>
                <option value="Aweil">Aweil</option>
                <option value="Bor">Bor</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            {filters.type === 'clients' && (
              <div className="filter-group">
                <label>Industry:</label>
                <select 
                  value={filters.industry} 
                  onChange={(e) => handleFilterChange('industry', e.target.value)}
                >
                  <option value="all">All Industries</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="NGO/Non-Profit">NGO/Non-Profit</option>
                  <option value="Technology">Technology</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Tourism">Tourism</option>
                  <option value="Media & Communications">Media & Communications</option>
                  <option value="Government">Government</option>
                </select>
              </div>
            )}

            <div className="filter-group">
              <label>Sort by:</label>
              <select 
                value={filters.sortBy} 
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="name">Name (A-Z)</option>
                <option value="rating">Highest Rated</option>
                <option value="projects">Most Projects</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Order:</label>
              <select 
                value={filters.sortOrder} 
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
