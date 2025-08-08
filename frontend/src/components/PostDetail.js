import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postsAPI } from '../api';
import PostCard from './Social/PostCard';
import SEO from './common/SEO';
import './PostDetail.css';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await postsAPI.getById(id);
        setPost(response.data || response);
        
        // Increment view count
        await postsAPI.incrementView(id);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error.response?.status === 404 ? 'Post not found' : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  const handlePostUpdate = (updatedPost) => {
    setPost(updatedPost);
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-detail-error">
        <div className="container">
          <div className="text-center">
            <h2>Oops!</h2>
            <p>{error}</p>
            <Link to="/posts" className="btn btn-primary">Back to Posts</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-not-found">
        <div className="container">
          <div className="text-center">
            <h2>Post not found</h2>
            <p>The post you're looking for doesn't exist.</p>
            <Link to="/posts" className="btn btn-primary">Back to Posts</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail">
      {/* Dynamic SEO meta tags for social sharing */}
      {post && (
        <SEO
          title={post.content ? post.content.substring(0, 60) + '...' : 'Post'}
          description={post.content ? post.content.substring(0, 160) : 'A post shared on VikraHub'}
          image={post.image || `${window.location.origin}/vikrahub-hero.jpg`}
          url={`${window.location.origin}/posts/${post.id}`}
          type="article"
          article={{
            author: post.author?.username || post.author?.first_name || 'VikraHub User',
            publishedTime: post.created_at,
            modifiedTime: post.updated_at || post.created_at,
            section: 'Community Posts'
          }}
        />
      )}
      
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/posts">Posts</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {post.title || 'Post'}
                </li>
              </ol>
            </nav>

            {/* Post Card with comments enabled */}
            <PostCard 
              post={post}
              showComments={true}
              onPostUpdate={handlePostUpdate}
              className="post-detail-card"
            />

            {/* Navigation */}
            <div className="post-detail-navigation mt-4">
              <Link to="/posts" className="btn btn-outline-primary">
                <i className="fas fa-arrow-left"></i> Back to Posts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
