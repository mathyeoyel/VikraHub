import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assetAPI } from '../api';
import './Inspiration.css';

const Inspiration = () => {
  const [featuredCreators, setFeaturedCreators] = useState([]);
  const [trendingWorks, setTrendingWorks] = useState([]);
  const [featuredStories, setFeaturedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  // Sample collections data (reusing from Home.js)
  const collections = [
    {
      id: 1,
      title: "Urban Life in Juba",
      image: "/assets/collection-urban.jpg",
      count: 45,
      description: "Capturing the vibrant energy of South Sudan's capital"
    },
    {
      id: 2,
      title: "Traditional Patterns & Motifs",
      image: "/assets/collection-patterns.jpg",
      count: 32,
      description: "Ancient designs that tell our cultural story"
    },
    {
      id: 3,
      title: "Youth Voices",
      image: "/assets/collection-youth.jpg",
      count: 28,
      description: "The next generation expressing their dreams"
    },
    {
      id: 4,
      title: "Wildlife & Nature",
      image: "/assets/collection-wildlife.jpg",
      count: 67,
      description: "The natural beauty of South Sudan"
    },
    {
      id: 5,
      title: "Women in Art",
      image: "/assets/collection-women.jpg",
      count: 41,
      description: "Celebrating feminine creativity and strength"
    },
    {
      id: 6,
      title: "Music & Performance",
      image: "/assets/collection-music.jpg",
      count: 23,
      description: "Rhythms and melodies that move the soul"
    }
  ];

  // Sample featured stories
  const sampleStories = [
    {
      id: 1,
      title: "Meet Akon Peter: Using Photography for Change",
      excerpt: "A documentary photographer capturing stories of resilience and hope across South Sudan.",
      image: "https://ui-avatars.com/api/?name=Akon+Peter&background=000223&color=ffffff&size=300",
      author: "Akon Peter",
      type: "Interview",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "Behind the Lens: Traditional Wedding Photography",
      excerpt: "How Sarah combines modern techniques with traditional South Sudanese ceremonies.",
      image: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=ffa000&color=ffffff&size=300",
      author: "Sarah Johnson",
      type: "Behind the Scenes",
      readTime: "8 min read"
    },
    {
      id: 3,
      title: "From Street Art to Gallery: A Creative Journey",
      excerpt: "The inspiring story of how local street art is finding its way into prestigious galleries.",
      image: "https://ui-avatars.com/api/?name=David+Machar&background=000223&color=ffffff&size=300",
      author: "David Machar",
      type: "Feature Story",
      readTime: "6 min read"
    }
  ];

  // Sample trending works
  const sampleTrendingWorks = [
    {
      id: 1,
      title: "Sunset over the Nile",
      creator: "Maria Akech",
      image: "/assets/trending-1.jpg",
      likes: 234,
      type: "Photography",
      tags: ["nature", "landscape", "nile"]
    },
    {
      id: 2,
      title: "Cultural Dance Series",
      creator: "Peter Deng",
      image: "/assets/trending-2.jpg",
      likes: 189,
      type: "Photography",
      tags: ["culture", "dance", "tradition"]
    },
    {
      id: 3,
      title: "Modern Juba Architecture",
      creator: "Grace Awut",
      image: "/assets/trending-3.jpg",
      likes: 156,
      type: "Design",
      tags: ["architecture", "urban", "modern"]
    },
    {
      id: 4,
      title: "Traditional Jewelry Collection",
      creator: "Rebecca Nyong",
      image: "/assets/trending-4.jpg",
      likes: 278,
      type: "Craft",
      tags: ["jewelry", "traditional", "craft"]
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Try to fetch real data, fallback to sample data
        try {
          const creatorsResponse = await assetAPI.getFeaturedCreators();
          setFeaturedCreators(creatorsResponse.data?.slice(0, 3) || []);
        } catch {
          setFeaturedCreators([]);
        }

        // Set sample data for stories and trending works
        setFeaturedStories(sampleStories);
        setTrendingWorks(sampleTrendingWorks);
        
      } catch (error) {
        console.error('Error fetching inspiration data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterOptions = [
    { value: 'all', label: 'All Collections' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'modern', label: 'Modern' },
    { value: 'nature', label: 'Nature' },
    { value: 'urban', label: 'Urban Life' },
    { value: 'cultural', label: 'Cultural' }
  ];

  const creatorTypes = [
    { value: 'all', label: 'All Creators' },
    { value: 'photographer', label: 'Photographers' },
    { value: 'artist', label: 'Artists' },
    { value: 'designer', label: 'Designers' },
    { value: 'writer', label: 'Writers' },
    { value: 'musician', label: 'Musicians' }
  ];

  const cities = [
    { value: 'all', label: 'All Cities' },
    { value: 'juba', label: 'Juba' },
    { value: 'wau', label: 'Wau' },
    { value: 'malakal', label: 'Malakal' },
    { value: 'yei', label: 'Yei' },
    { value: 'aweil', label: 'Aweil' }
  ];

  return (
    <div className="inspiration-page">
      {/* Hero Section */}
      <section className="inspiration-hero">
        <div className="hero-background">
          <img src="/vikrahub-hero.jpg" alt="South Sudanese Creativity" className="hero-bg-image" />
          <div className="hero-overlay"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <h1>Get Inspired by South Sudanese Creativity</h1>
            <p>Explore curated collections, trending works, and real stories from our creative community.</p>
            <div className="hero-actions">
              <Link to="/creators" className="btn btn-primary">Discover Creators</Link>
              <Link to="/blog" className="btn btn-secondary">Read Stories</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="inspiration-content">
        <div className="container">
          {/* Filters Sidebar */}
          <aside className="inspiration-filters">
            <div className="filter-section">
              <h3>Filter by Theme</h3>
              <div className="filter-group">
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    className={`filter-btn ${selectedFilter === option.value ? 'active' : ''}`}
                    onClick={() => setSelectedFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h3>Creator Type</h3>
              <div className="filter-group">
                {creatorTypes.map(type => (
                  <button
                    key={type.value}
                    className={`filter-btn ${selectedType === type.value ? 'active' : ''}`}
                    onClick={() => setSelectedType(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h3>Location</h3>
              <div className="filter-group">
                {cities.map(city => (
                  <button
                    key={city.value}
                    className={`filter-btn ${selectedCity === city.value ? 'active' : ''}`}
                    onClick={() => setSelectedCity(city.value)}
                  >
                    {city.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="inspiration-main">
            {/* Curated Collections */}
            <section className="curated-collections">
              <div className="section-header">
                <h2>Curated Collections</h2>
                <p>Discover themed galleries showcasing the best of South Sudanese creativity</p>
              </div>
              <div className="collections-grid">
                {collections.map(collection => (
                  <div key={collection.id} className="collection-card">
                    <div className="collection-image">
                      <img 
                        src={collection.image} 
                        alt={collection.title}
                        onError={(e) => {
                          e.target.src = '/hero-placeholder.jpg';
                        }}
                      />
                      <div className="collection-overlay">
                        <span className="collection-count">{collection.count} works</span>
                      </div>
                    </div>
                    <div className="collection-info">
                      <h3>{collection.title}</h3>
                      <p>{collection.description}</p>
                      <Link to={`/collections/${collection.id}`} className="collection-link">
                        Explore Collection →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Featured Stories */}
            <section className="featured-stories">
              <div className="section-header">
                <h2>Featured Stories</h2>
                <p>Behind-the-scenes insights and creator spotlights</p>
              </div>
              <div className="stories-carousel">
                {featuredStories.map(story => (
                  <div key={story.id} className="story-card">
                    <div className="story-image">
                      <img src={story.image} alt={story.title} />
                      <div className="story-type">{story.type}</div>
                    </div>
                    <div className="story-content">
                      <h3>{story.title}</h3>
                      <p>{story.excerpt}</p>
                      <div className="story-meta">
                        <span className="story-author">by {story.author}</span>
                        <span className="story-read-time">{story.readTime}</span>
                      </div>
                      <Link to={`/stories/${story.id}`} className="story-link">
                        Read Story
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Trending Works */}
            <section className="trending-works">
              <div className="section-header">
                <h2>Trending Works</h2>
                <p>Fresh inspiration from our community</p>
              </div>
              <div className="trending-grid">
                {trendingWorks.map(work => (
                  <div key={work.id} className="trending-work">
                    <div className="work-image">
                      <img 
                        src={work.image} 
                        alt={work.title}
                        onError={(e) => {
                          e.target.src = '/hero-placeholder.jpg';
                        }}
                      />
                      <div className="work-actions">
                        <button className="action-btn like-btn" title="Like">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          {work.likes}
                        </button>
                        <button className="action-btn save-btn" title="Save">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                          </svg>
                        </button>
                        <button className="action-btn share-btn" title="Share">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="work-info">
                      <h4>{work.title}</h4>
                      <p className="work-creator">by {work.creator}</p>
                      <div className="work-tags">
                        {work.tags.map(tag => (
                          <span key={tag} className="work-tag">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Community Highlights */}
            <section className="community-highlights">
              <div className="section-header">
                <h2>Community Highlights</h2>
                <p>Celebrating our most appreciated creators and works</p>
              </div>
              <div className="highlights-grid">
                <div className="highlight-card creator-of-month">
                  <div className="highlight-badge">Creator of the Month</div>
                  <div className="creator-avatar">
                    <img src="https://ui-avatars.com/api/?name=Maria+Akech&background=ffa000&color=ffffff&size=150" alt="Maria Akech" />
                  </div>
                  <h3>Maria Akech</h3>
                  <p className="creator-title">Documentary Photographer</p>
                  <p className="creator-highlight">
                    "Her powerful photo series 'Voices of Resilience' has touched hearts across the community."
                  </p>
                  <Link to="/profile/maria-akech" className="highlight-link">View Profile</Link>
                </div>

                <div className="highlight-card artwork-spotlight">
                  <div className="highlight-badge">Most Appreciated Artwork</div>
                  <div className="artwork-image">
                    <img src="/hero-placeholder.jpg" alt="Sunset over Juba" />
                  </div>
                  <h3>"Sunset over Juba"</h3>
                  <p className="artwork-creator">by David Machar</p>
                  <div className="artwork-stats">
                    <span className="stat">❤️ 456 likes</span>
                    <span className="stat">💬 89 comments</span>
                    <span className="stat">🔄 142 shares</span>
                  </div>
                  <Link to="/works/sunset-over-juba" className="highlight-link">View Artwork</Link>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="inspiration-cta">
              <div className="cta-content">
                <h2>Want to be Featured?</h2>
                <p>Share your creativity with the VikraHub community and get discovered by fellow creators and potential collaborators.</p>
                <div className="cta-actions">
                  <Link to="/upload" className="btn btn-primary">Submit Your Work</Link>
                  <Link to="/blog/new" className="btn btn-secondary">Share Your Story</Link>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Inspiration;
