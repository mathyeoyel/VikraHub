import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import { publicProfileAPI, assetAPI } from '../api';
import './SearchResults.css';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    location: '',
    skills: '',
    industry: ''
  });

  const query = searchParams.get('q') || '';

  // Fetch search results from backend
  const fetchSearchResults = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchPromises = [];
      
      // Search public profiles
      searchPromises.push(publicProfileAPI.search({ q: searchQuery }));
      
      // Search creators
      searchPromises.push(assetAPI.getCreators({ search: searchQuery }));
      
      // Search freelancers  
      searchPromises.push(assetAPI.getFreelancers({ search: searchQuery }));

      const [publicProfiles, creators, freelancers] = await Promise.all(searchPromises);

      console.log('Search results:', { publicProfiles, creators, freelancers });

      // Combine and format results
      const combinedResults = [];

      // Add public profiles
      if (publicProfiles.data?.results) {
        publicProfiles.data.results.forEach(profile => {
          combinedResults.push(formatPublicProfile(profile));
        });
      } else if (publicProfiles.data && Array.isArray(publicProfiles.data)) {
        publicProfiles.data.forEach(profile => {
          combinedResults.push(formatPublicProfile(profile));
        });
      }

      // Add creators
      if (creators.data?.results) {
        creators.data.results.forEach(creator => {
          combinedResults.push(formatCreator(creator));
        });
      } else if (creators.data && Array.isArray(creators.data)) {
        creators.data.forEach(creator => {
          combinedResults.push(formatCreator(creator));
        });
      }

      // Add freelancers
      if (freelancers.data?.results) {
        freelancers.data.results.forEach(freelancer => {
          combinedResults.push(formatFreelancer(freelancer));
        });
      } else if (freelancers.data && Array.isArray(freelancers.data)) {
        freelancers.data.forEach(freelancer => {
          combinedResults.push(formatFreelancer(freelancer));
        });
      }

      // Remove duplicates based on username
      const uniqueResults = combinedResults.filter((result, index, self) => 
        index === self.findIndex(r => r.username === result.username)
      );

      setResults(uniqueResults);

    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to load search results. Please try again.');
      // For debugging, let's also show a fallback with some sample data
      setResults([
        {
          id: 1,
          type: 'profile',
          username: 'sample_user',
          name: 'Search functionality is being updated',
          title: 'Backend integration in progress',
          location: 'VikraHub',
          category: 'general',
          skills: ['Currently', 'Being', 'Updated'],
          industry: 'Platform',
          tags: [],
          image: 'https://ui-avatars.com/api/?name=VH&background=000223&color=ffffff&size=200',
          bio: 'Search results will show real user data from the backend once the connection is established.',
          rating: 0,
          projects: 0,
          joinedDate: new Date().toISOString(),
          isPopular: false,
          verified: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Format public profile data
  const formatPublicProfile = (profile) => {
    const user = profile.user || profile;
    return {
      id: profile.id,
      type: 'profile',
      username: user.username,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      title: profile.bio?.split('.')[0] || 'VikraHub User',
      location: extractLocation(profile.bio) || 'South Sudan',
      category: 'general',
      skills: extractSkills(profile.bio) || [],
      industry: null,
      tags: [],
      image: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=000223&color=ffffff&size=200`,
      bio: profile.bio || 'VikraHub community member',
      rating: 0,
      projects: 0,
      joinedDate: user.date_joined || new Date().toISOString(),
      isPopular: false,
      verified: user.is_verified || false
    };
  };

  // Format creator profile data
  const formatCreator = (creator) => {
    const user = creator.user || creator;
    const userProfile = user.userprofile || {};
    return {
      id: creator.id,
      type: 'creator',
      username: user.username,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      title: creator.creator_type_display || 'Creative Professional',
      location: extractLocation(userProfile.bio) || 'South Sudan',
      category: mapCreatorType(creator.creator_type),
      skills: parseSkills(userProfile.skills) || [],
      industry: 'Creative Arts',
      tags: [],
      image: userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=000223&color=ffffff&size=200`,
      bio: creator.art_statement || userProfile.bio || 'Passionate creative professional.',
      rating: 0,
      projects: 0,
      joinedDate: user.date_joined || new Date().toISOString(),
      isPopular: creator.featured || false,
      verified: user.is_verified || false
    };
  };

  // Format freelancer profile data
  const formatFreelancer = (freelancer) => {
    const user = freelancer.user || freelancer;
    const userProfile = user.userprofile || {};
    return {
      id: freelancer.id,
      type: 'freelancer',
      username: user.username,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      title: freelancer.specialization || 'Freelance Professional',
      location: extractLocation(userProfile.bio) || 'South Sudan',
      category: 'freelance',
      skills: parseSkills(userProfile.skills) || [],
      industry: 'Freelance Services',
      tags: [],
      image: userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=000223&color=ffffff&size=200`,
      bio: freelancer.description || userProfile.bio || 'Professional freelancer ready to help with your projects.',
      rating: parseFloat(freelancer.rating) || 0,
      projects: freelancer.completed_projects || 0,
      joinedDate: user.date_joined || new Date().toISOString(),
      isPopular: freelancer.featured || false,
      verified: user.is_verified || false
    };
  };

  // Helper functions
  const extractLocation = (bio) => {
    if (!bio) return null;
    const locationKeywords = ['Juba', 'Malakal', 'Wau', 'Yei', 'Torit', 'Rumbek', 'Bor', 'South Sudan'];
    const found = locationKeywords.find(keyword => bio.toLowerCase().includes(keyword.toLowerCase()));
    return found || null;
  };

  const extractSkills = (bio) => {
    if (!bio) return [];
    const skillKeywords = ['React', 'JavaScript', 'Python', 'Design', 'Art', 'Writing', 'Photography', 'Music'];
    return skillKeywords.filter(skill => bio.toLowerCase().includes(skill.toLowerCase()));
  };

  const parseSkills = (skillsString) => {
    if (!skillsString) return [];
    if (Array.isArray(skillsString)) return skillsString;
    return skillsString.split(',').map(skill => skill.trim()).filter(Boolean);
  };

  const mapCreatorType = (type) => {
    const typeMapping = {
      'visual_artist': 'art',
      'musician': 'music',
      'writer': 'writing',
      'photographer': 'photography',
      'designer': 'design'
    };
    return typeMapping[type] || 'general';
  };

  useEffect(() => {
    if (query) {
      fetchSearchResults(query);
    }
  }, [query]);

  // Apply filters and sorting
  const applyFiltersAndSort = (allResults) => {
    let filtered = [...allResults];
    
    // Apply filters
    if (filters.type !== 'all') {
      const typeMap = {
        'creators': 'creator',
        'freelancers': 'freelancer', 
        'profiles': 'profile'
      };
      filtered = filtered.filter(result => result.type === typeMap[filters.type]);
    }
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(result => result.category === filters.category);
    }
    
    if (filters.location) {
      filtered = filtered.filter(result => 
        result.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    if (filters.skills) {
      filtered = filtered.filter(result => 
        result.skills.some(skill => 
          skill.toLowerCase().includes(filters.skills.toLowerCase())
        )
      );
    }
    
    if (filters.industry) {
      filtered = filtered.filter(result => 
        result.industry && result.industry.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.projects || 0) - (a.projects || 0);
        case 'newest':
          return new Date(b.joinedDate) - new Date(a.joinedDate);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'projects':
          return (b.projects || 0) - (a.projects || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const filteredResults = applyFiltersAndSort(results);

  const handleSearch = ({ query: searchQuery, filters: searchFilters }) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchFilters.type !== 'all') params.set('type', searchFilters.type);
    if (searchFilters.location) params.set('location', searchFilters.location);
    if (searchFilters.skills) params.set('skills', searchFilters.skills);
    if (searchFilters.industry) params.set('industry', searchFilters.industry);
    
    navigate(`/search?${params.toString()}`);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="search-results">
      <div className="container">
        {/* Search Section */}
        <div className="search-section">
          <SearchBar 
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            variant="default"
            showAdvancedFilters={true}
          />
        </div>

        {/* Results Header */}
        <div className="results-header">
          <h1>Search Results</h1>
          {query && (
            <p className="results-count">
              {loading ? 'Searching...' : `${filteredResults.length} result${filteredResults.length !== 1 ? 's' : ''} found for "${query}"`}
            </p>
          )}
          {error && (
            <p className="error-message" style={{ color: '#dc3545', marginTop: '1rem' }}>
              {error}
            </p>
          )}
        </div>

        {/* Results Controls */}
        <div className="results-controls">
          <div className="controls-left">
            <select 
              value={filters.type} 
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="creators">Creators</option>
              <option value="freelancers">Freelancers</option>
              <option value="profiles">Profiles</option>
            </select>
          </div>
          
          <div className="controls-right">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Most Relevant</option>
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="name">Name (A-Z)</option>
              <option value="rating">Highest Rated</option>
              <option value="projects">Most Projects</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Searching VikraHub...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredResults.length === 0 && query && (
          <div className="no-results">
            <h3>No results found</h3>
            <p>We couldn't find any results for "{query}". Try:</p>
            <ul>
              <li>Checking your spelling</li>
              <li>Using different keywords</li>
              <li>Being less specific</li>
              <li>Removing some filters</li>
            </ul>
          </div>
        )}

        {/* Results Grid */}
        {!loading && filteredResults.length > 0 && (
          <div className="results-grid">
            {filteredResults.map(result => (
              <div key={`${result.type}-${result.id}`} className="result-card">
                <div className="result-header">
                  <div className="result-info">
                    <img 
                      src={result.image} 
                      alt={result.name}
                      className="result-avatar"
                    />
                    <div className="result-details">
                      <div className="result-badges">
                        {result.verified && <span className="badge verified">✓ Verified</span>}
                        {result.isPopular && <span className="badge popular">🔥 Popular</span>}
                      </div>
                      <h3 className="result-name">{result.name}</h3>
                      <p className="result-title">{result.title}</p>
                      <p className="result-location">📍 {result.location}</p>
                    </div>
                  </div>
                </div>

                <div className="result-body">
                  <p className="result-bio">{result.bio}</p>
                  
                  {result.skills.length > 0 && (
                    <div className="result-skills">
                      <strong>Skills:</strong>
                      <div className="skills-list">
                        {result.skills.slice(0, 4).map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                        {result.skills.length > 4 && (
                          <span className="skill-tag more">+{result.skills.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="result-stats">
                    <div className="stat-item">
                      <span className="stat-label">Rating:</span>
                      <span className="stat-value">{result.rating > 0 ? `${result.rating}/5.0` : 'New'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Projects:</span>
                      <span className="stat-value">{result.projects}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Joined:</span>
                      <span className="stat-value">{new Date(result.joinedDate).getFullYear()}</span>
                    </div>
                  </div>
                </div>

                <div className="result-actions">
                  <Link 
                    to={`/profile/${result.username}`} 
                    className="btn btn-primary"
                  >
                    View Profile
                  </Link>
                  <button className="btn btn-secondary">
                    Contact
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
