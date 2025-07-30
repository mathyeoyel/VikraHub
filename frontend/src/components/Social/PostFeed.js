import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import PostCard from './PostCard';
import { postsAPI } from '../../api';
import './PostFeed.css';

const PostFeed = ({ 
  userId = null, 
  category = null, 
  tag = null,
  limit = 10,
  showCreatePrompt = true,
  className = '' 
}) => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPosts(true);
  }, [userId, category, tag]);

  const loadPosts = async (reset = false) => {
    if (loading && !reset) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      if (userId) params.user = userId;
      if (category) params.category = category;
      if (tag) params.tag = tag;
      if (!reset) params.page = page;
      
      const response = await postsAPI.getAll(params);
      const newPosts = response.data.results || response.data || [];
      
      if (reset) {
        setPosts(newPosts);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
      }
      
      // Check if there are more posts
      if (newPosts.length < limit) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts(false);
    }
  };

  const renderCreatePostPrompt = () => {
    if (!isAuthenticated || !showCreatePrompt || userId) return null;
    
    return (
      <div className="post-feed__create-prompt">
        <div className="create-prompt">
          <h3>Share your thoughts with the community</h3>
          <p>Create a post to engage with other VikraHub members</p>
          <a href="/create/post" className="btn btn-primary">
            ✨ Create Post
          </a>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    let message = 'No posts found.';
    let suggestion = '';
    
    if (category) {
      message = `No posts found in the "${category}" category.`;
      suggestion = 'Try browsing other categories or create the first post in this category.';
    } else if (tag) {
      message = `No posts found with the tag "${tag}".`;
      suggestion = 'Try searching for other tags or create a post with this tag.';
    } else if (userId) {
      message = 'This user hasn\'t created any posts yet.';
      suggestion = 'Check back later or explore other users.';
    } else {
      message = 'No posts available.';
      suggestion = 'Be the first to create a post and start the conversation!';
    }
    
    return (
      <div className="post-feed__empty">
        <div className="empty-state">
          <div className="empty-state__icon">📝</div>
          <h3>{message}</h3>
          <p>{suggestion}</p>
          {isAuthenticated && !userId && (
            <a href="/create/post" className="btn btn-primary">
              Create First Post
            </a>
          )}
        </div>
      </div>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <div className={`post-feed ${className}`}>
        {renderCreatePostPrompt()}
        <div className="post-feed__loading">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className={`post-feed ${className}`}>
        <div className="post-feed__error">
          <div className="error-state">
            <div className="error-state__icon">⚠️</div>
            <h3>Failed to load posts</h3>
            <p>{error}</p>
            <button 
              onClick={() => loadPosts(true)} 
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`post-feed ${className}`}>
      {renderCreatePostPrompt()}
      
      {posts.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="post-feed__list">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdate={handlePostUpdate}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="post-feed__load-more">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn btn-outline load-more-btn"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner loading-spinner--small"></span>
                    Loading...
                  </>
                ) : (
                  'Load More Posts'
                )}
              </button>
            </div>
          )}
          
          {!hasMore && posts.length > 0 && (
            <div className="post-feed__end">
              <p>You've reached the end of the feed</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostFeed;
