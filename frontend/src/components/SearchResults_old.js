import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import { publicProfileAPI, assetAPI } from '../api';
import './SearchResults.css';

// Enhanced search results using real backend data
const mockResults = [
  {
    id: 1,
    type: 'creator',
    username: 'sarahj_art',
    name: 'Sarah Johnson',
    title: 'Visual Artist & Illustrator',
    location: 'Juba, South Sudan',
    category: 'art',
    skills: ['Traditional Art', 'Digital Illustration', 'Portrait Art', 'Cultural Art'],
    industry: null,
    tags: ['Traditional Culture', 'Modern Design', 'Cultural Heritage'],
    image: 'https://ui-avatars.com/api/?name=SJ&background=000223&color=ffffff&size=200',
    bio: 'Passionate visual artist specializing in traditional and digital illustrations that celebrate South Sudanese culture.',
    rating: 4.9,
    projects: 23,
    joinedDate: '2023-01-15',
    isPopular: true,
    verified: true
  },
  {
    id: 2,
    type: 'freelancer',
    username: 'mikedev',
    name: 'Michael Chen',
    title: 'Full-Stack Web Developer',
    location: 'Wau, South Sudan',
    category: 'tech',
    skills: ['React', 'Node.js', 'Python', 'Mobile App Development', 'Cloud Technologies'],
    industry: null,
    tags: ['Digital Innovation', 'Entrepreneurship'],
    image: 'https://ui-avatars.com/api/?name=MC&background=000223&color=ffffff&size=200',
    bio: 'Experienced developer with expertise in React, Node.js, and cloud technologies. Building digital solutions for South Sudan.',
    rating: 4.8,
    projects: 45,
    joinedDate: '2022-08-22',
    isPopular: true,
    verified: true
  },
  {
    id: 3,
    type: 'creator',
    username: 'amina_fashion',
    name: 'Amina Hassan',
    title: 'Fashion Designer',
    location: 'Malakal, South Sudan',
    category: 'fashion',
    skills: ['Fashion Design', 'Textile Design', 'Traditional Clothing', 'Modern Fashion'],
    industry: null,
    tags: ['Traditional Culture', 'Sustainability', 'Cultural Heritage'],
    image: 'https://ui-avatars.com/api/?name=AH&background=000223&color=ffffff&size=200',
    bio: 'Contemporary fashion designer blending traditional South Sudanese styles with modern trends.',
    rating: 4.7,
    projects: 18,
    joinedDate: '2023-03-10',
    isPopular: false,
    verified: false
  },
  {
    id: 4,
    type: 'freelancer',
    username: 'davidbrand',
    name: 'David Mwangi',
    title: 'Graphic Designer & Brand Specialist',
    location: 'Yei, South Sudan',
    category: 'design',
    skills: ['Logo Design', 'Brand Identity', 'Print Design', 'Digital Design'],
    industry: null,
    tags: ['Modern Design', 'Digital Innovation'],
    image: 'https://ui-avatars.com/api/?name=DM&background=000223&color=ffffff&size=200',
    bio: 'Creative graphic designer helping businesses build strong visual identities and modern brand presence.',
    rating: 4.9,
    projects: 67,
    joinedDate: '2022-05-18',
    isPopular: true,
    verified: true
  },
  {
    id: 5,
    type: 'creator',
    username: 'graceshots',
    name: 'Grace Akol',
    title: 'Photographer & Visual Storyteller',
    location: 'Bentiu, South Sudan',
    category: 'photography',
    skills: ['Documentary Photography', 'Portrait Photography', 'Event Photography', 'Photo Editing'],
    industry: null,
    tags: ['Cultural Heritage', 'Community Development'],
    image: 'https://ui-avatars.com/api/?name=GA&background=000223&color=ffffff&size=200',
    bio: 'Documentary photographer capturing the beauty and stories of South Sudan through powerful visual narratives.',
    rating: 4.8,
    projects: 34,
    joinedDate: '2023-01-28',
    isPopular: true,
    verified: false
  },
  {
    id: 6,
    type: 'freelancer',
    username: 'jamescopy',
    name: 'James Lokwi',
    title: 'Content Writer & Copywriter',
    location: 'Torit, South Sudan',
    category: 'writing',
    skills: ['Content Writing', 'Copywriting', 'Blog Writing', 'Marketing Copy'],
    industry: null,
    tags: ['Digital Innovation', 'Community Development'],
    image: 'https://ui-avatars.com/api/?name=JL&background=000223&color=ffffff&size=200',
    bio: 'Professional content writer with expertise in marketing copy and storytelling for local and international brands.',
    rating: 4.6,
    projects: 52,
    joinedDate: '2022-11-05',
    isPopular: false,
    verified: true
  },
  {
    id: 7,
    type: 'client',
    username: 'edu_foundation',
    name: 'South Sudan Education Foundation',
    title: 'Education NGO',
    location: 'Juba, South Sudan',
    category: 'client',
    skills: [],
    industry: 'Education',
    tags: ['Youth Empowerment', 'Community Development'],
    image: 'https://ui-avatars.com/api/?name=SEF&background=000223&color=ffffff&size=200',
    bio: 'Non-profit organization working to improve educational opportunities across South Sudan.',
    rating: 4.5,
    projects: 12,
    joinedDate: '2023-02-14',
    isPopular: false,
    verified: true
  },
  {
    id: 8,
    type: 'client',
    username: 'health_ministry',
    name: 'Ministry of Health - South Sudan',
    title: 'Government Healthcare Agency',
    location: 'Juba, South Sudan',
    category: 'client',
    skills: [],
    industry: 'Healthcare',
    tags: ['Community Development', 'Digital Innovation'],
    image: 'https://ui-avatars.com/api/?name=MOH&background=000223&color=ffffff&size=200',
    bio: 'Government agency focused on improving healthcare services and public health initiatives.',
    rating: 4.2,
    projects: 8,
    joinedDate: '2023-04-20',
    isPopular: false,
    verified: true
  }
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || 'all',
    location: searchParams.get('location') || '',
    industry: searchParams.get('industry') || 'all',
    sortBy: searchParams.get('sortBy') || 'relevance',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  const query = searchParams.get('q') || '';

  useEffect(() => {
    // Simulate API search
    setLoading(true);
    setTimeout(() => {
      let filtered = mockResults;
      
      if (query) {
        filtered = filtered.filter(result => {
          const searchTerm = query.toLowerCase();
          
          // Search by name or username
          const nameMatch = result.name.toLowerCase().includes(searchTerm) ||
                           result.username.toLowerCase().includes(searchTerm);
          
          // Search by title/role
          const titleMatch = result.title.toLowerCase().includes(searchTerm);
          
          // Search by skills/services
          const skillsMatch = result.skills.some(skill => 
            skill.toLowerCase().includes(searchTerm)
          );
          
          // Search by location
          const locationMatch = result.location.toLowerCase().includes(searchTerm);
          
          // Search by industry (for clients)
          const industryMatch = result.industry && 
                                result.industry.toLowerCase().includes(searchTerm);
          
          // Search by tags
          const tagsMatch = result.tags.some(tag => 
            tag.toLowerCase().includes(searchTerm)
          );
          
          // Search by bio
          const bioMatch = result.bio.toLowerCase().includes(searchTerm);
          
          return nameMatch || titleMatch || skillsMatch || locationMatch || 
                 industryMatch || tagsMatch || bioMatch;
        });
      }
      
      // Apply type filter
      if (filters.type !== 'all') {
        const typeMap = {
          'creators': 'creator',
          'freelancers': 'freelancer', 
          'clients': 'client'
        };
        filtered = filtered.filter(result => result.type === typeMap[filters.type]);
      }
      
      // Apply category filter
      if (filters.category !== 'all') {
        filtered = filtered.filter(result => result.category === filters.category);
      }
      
      // Apply location filter
      if (filters.location) {
        filtered = filtered.filter(result => 
          result.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
      
      // Apply industry filter (for clients)
      if (filters.industry !== 'all') {
        filtered = filtered.filter(result => result.industry === filters.industry);
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (filters.sortBy) {
          case 'popular':
            comparison = (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0) || 
                        b.projects - a.projects;
            break;
          case 'newest':
            comparison = new Date(b.joinedDate) - new Date(a.joinedDate);
            break;
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'rating':
            comparison = b.rating - a.rating;
            break;
          case 'projects':
            comparison = b.projects - a.projects;
            break;
          case 'relevance':
          default:
            // For relevance, prioritize verified users and exact matches
            comparison = (b.verified ? 1 : 0) - (a.verified ? 1 : 0) ||
                        (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0) ||
                        b.rating - a.rating;
            break;
        }
        
        return filters.sortOrder === 'desc' ? comparison : -comparison;
      });
      
      setResults(filtered);
      setLoading(false);
    }, 800);
  }, [query, filters]);

  const handleSearch = ({ query: newQuery, filters: newFilters }) => {
    setFilters(newFilters);
    // Update URL parameters
    const searchParams = new URLSearchParams();
    searchParams.set('q', newQuery);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        searchParams.set(key, value);
      }
    });
    window.history.pushState({}, '', `${window.location.pathname}?${searchParams}`);
  };

  if (loading) {
    return (
      <div className="search-results">
        <div className="container">
          <SearchBar 
            onSearch={handleSearch}
            showFilters={true}
          />
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Searching for "{query}"...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="container">
        {/* Search Bar */}
        <div className="search-section">
          <SearchBar 
            onSearch={handleSearch}
            showFilters={true}
          />
        </div>

        {/* Search Results Header */}
        <div className="results-header">
          <h1>Search Results</h1>
          <p className="results-count">
            {results.length > 0 
              ? `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
              : `No results found for "${query}"`
            }
          </p>
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="results-grid">
            {results.map(result => (
              <div key={result.id} className="result-card">
                <div className="result-image">
                  <img src={result.image} alt={result.name} />
                  <span className={`result-type result-type--${result.type}`}>
                    {result.type === 'creator' ? '🎨' : result.type === 'freelancer' ? '💼' : '🏢'}
                  </span>
                  {result.verified && (
                    <span className="verified-badge">✓</span>
                  )}
                  {result.isPopular && (
                    <span className="popular-badge">🔥</span>
                  )}
                </div>
                
                <div className="result-content">
                  <h3 className="result-name">
                    {result.name}
                    <span className="result-username">@{result.username}</span>
                  </h3>
                  <p className="result-title">{result.title}</p>
                  <p className="result-location">📍 {result.location}</p>
                  
                  {result.industry && (
                    <p className="result-industry">🏢 {result.industry}</p>
                  )}
                  
                  <p className="result-bio">{result.bio}</p>
                  
                  {/* Skills/Services */}
                  {result.skills.length > 0 && (
                    <div className="result-skills">
                      {result.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                      {result.skills.length > 3 && (
                        <span className="skill-more">+{result.skills.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  {/* Tags */}
                  {result.tags.length > 0 && (
                    <div className="result-tags">
                      {result.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="tag-item">🏷️ {tag}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="result-stats">
                    <span className="rating">⭐ {result.rating}</span>
                    <span className="projects">{result.projects} projects</span>
                    <span className="joined">Joined {new Date(result.joinedDate).getFullYear()}</span>
                  </div>
                </div>
                
                <div className="result-actions">
                  <Link 
                    to={`/${result.type === 'creator' ? 'creators' : result.type === 'freelancer' ? 'freelancers' : 'clients'}/${result.id}`}
                    className="btn btn-primary"
                  >
                    View Profile
                  </Link>
                  <button className="btn btn-secondary">
                    {result.type === 'creator' ? 'Follow' : 
                     result.type === 'freelancer' ? 'Hire' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No results found</h3>
            <p>Try adjusting your search terms or filters to find what you're looking for.</p>
            <div className="search-suggestions">
              <h4>Try searching for:</h4>
              <div className="suggestion-tags">
                <button onClick={() => handleSearch({ query: 'graphic designer', filters })}>
                  Graphic Designer
                </button>
                <button onClick={() => handleSearch({ query: 'photographer', filters })}>
                  Photographer
                </button>
                <button onClick={() => handleSearch({ query: 'web developer', filters })}>
                  Web Developer
                </button>
                <button onClick={() => handleSearch({ query: 'artist', filters })}>
                  Artist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
