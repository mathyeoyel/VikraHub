import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogAPI } from '../api';
import LikeButton from './Social/LikeButton';
import './BlogPost.css';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await blogAPI.getBySlug(slug);
        setBlog(response.data || response);
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setError(error.response?.status === 404 ? 'Blog post not found' : 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="blog-post-loading">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading blog post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-post-error">
        <div className="container">
          <div className="text-center">
            <h2>Oops!</h2>
            <p>{error}</p>
            <Link to="/blog" className="btn btn-primary">Back to Blog</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-post-not-found">
        <div className="container">
          <div className="text-center">
            <h2>Blog post not found</h2>
            <p>The blog post you're looking for doesn't exist.</p>
            <Link to="/blog" className="btn btn-primary">Back to Blog</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <article className="blog-post-content">
              {/* Breadcrumb */}
              <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/blog">Blog</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {blog.title}
                  </li>
                </ol>
              </nav>

              {/* Featured Image */}
              {blog.image && (
                <div className="blog-post-image mb-4">
                  <img 
                    src={blog.image} 
                    alt={blog.title} 
                    className="img-fluid rounded"
                  />
                </div>
              )}

              {/* Header */}
              <header className="blog-post-header mb-4">
                {blog.category && (
                  <div className="blog-category mb-2">
                    <span className="badge bg-primary">{blog.category}</span>
                  </div>
                )}
                
                <h1 className="blog-post-title">{blog.title}</h1>
                
                {blog.excerpt && (
                  <p className="blog-post-excerpt text-muted">{blog.excerpt}</p>
                )}

                <div className="blog-post-meta">
                  <div className="d-flex align-items-center flex-wrap gap-3">
                    <div className="author-info d-flex align-items-center">
                      <i className="bi bi-person-circle me-2"></i>
                      <span>By {blog.author?.username || blog.author?.first_name || 'Anonymous'}</span>
                    </div>
                    <div className="publish-date d-flex align-items-center">
                      <i className="bi bi-calendar3 me-2"></i>
                      <time dateTime={blog.created_at}>
                        {new Date(blog.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                    <div className="read-time d-flex align-items-center">
                      <i className="bi bi-clock me-2"></i>
                      <span>{Math.ceil((blog.content?.length || 0) / 1000)} min read</span>
                    </div>
                  </div>
                </div>
              </header>

              {/* Content */}
              <div className="blog-post-body">
                <div 
                  className="content"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              </div>

              {/* Tags */}
              {blog.tags_list && blog.tags_list.length > 0 && (
                <div className="blog-post-tags mt-4">
                  <h6>Tags:</h6>
                  <div className="tags-list">
                    {blog.tags_list.map((tag, index) => (
                      <span key={index} className="badge bg-secondary me-2 mb-2">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagement */}
              <div className="blog-post-engagement mt-4 pt-4 border-top">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="engagement-actions">
                    <LikeButton 
                      type="blog" 
                      id={blog.id} 
                      initialCount={blog.like_count || 0}
                      initialLiked={blog.is_liked || false}
                      size="medium"
                      showCount={true}
                    />
                  </div>
                  <div className="share-actions">
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: blog.title,
                            text: blog.excerpt,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copied to clipboard!');
                        }
                      }}
                    >
                      <i className="bi bi-share"></i> Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="blog-post-navigation mt-5 pt-4 border-top">
                <Link to="/blog" className="btn btn-outline-primary">
                  <i className="bi bi-arrow-left"></i> Back to Blog
                </Link>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
