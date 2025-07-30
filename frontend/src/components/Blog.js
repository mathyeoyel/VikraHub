import React, { useState, useEffect } from 'react';
import { blogAPI } from '../api';
import LikeButton from './Social/LikeButton';
import './Blog.css';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        console.log('Fetching blogs...');
        const response = await blogAPI.getAll();
        console.log('Blog API response:', response);
        
        // Handle different response structures
        const blogData = response.results || response.data || response || [];
        console.log('Blog data:', blogData);
        setBlogs(Array.isArray(blogData) ? blogData : []);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setBlogs([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="blog-loading">
        <div className="text-center">Loading blog posts...</div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <section id="blog" className="blog">
        <div className="container">
          <div className="section-title">
            <h2>Blog</h2>
            <p>Latest insights and updates</p>
          </div>
          <div className="no-blogs-message">
            <p>No blog posts available yet. Be the first to create one!</p>
            <a href="/create/blog" className="btn btn-primary">Create Your First Blog Post</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="blog" className="blog">
      <div className="container">
        <div className="section-title">
          <h2>Blog</h2>
          <p>Latest insights and updates</p>
        </div>

        <div className="blog-grid">
          {blogs.map((blog, index) => (
            <div key={blog.id} className={`blog-item col-lg-4 col-md-6`}>
              <article className="entry">
                {blog.image && (
                  <div className="entry-img">
                    <img 
                      src={blog.image} 
                      alt={blog.title} 
                      className="img-fluid"
                    />
                  </div>
                )}

                <div className="entry-content">
                  {blog.category && (
                    <div className="blog-category">{blog.category}</div>
                  )}
                </div>

                <h2 className="entry-title">
                  <a href={`/blog/${blog.slug}`}>{blog.title}</a>
                </h2>

                <div className="entry-meta">
                  <ul>
                    <li className="d-flex align-items-center">
                      <i className="bi bi-person"></i>
                      <span className="author-name">{blog.author?.username || 'Anonymous'}</span>
                    </li>
                    <li className="d-flex align-items-center">
                      <i className="bi bi-clock"></i>
                      <time dateTime={blog.created_at}>
                        {new Date(blog.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </li>
                  </ul>
                </div>

                <div className="entry-content">
                  <p>{blog.excerpt || blog.content?.substring(0, 150) + '...'}</p>
                  
                  {/* Blog engagement */}
                  <div className="blog-engagement">
                    <LikeButton 
                      contentType="blog" 
                      contentId={blog.id} 
                      initialLikes={blog.like_count || 0}
                      initialIsLiked={blog.is_liked || false}
                    />
                    <span className="comments-count">
                      <i className="bi bi-chat"></i>
                      {blog.comment_count || 0} comments
                    </span>
                  </div>
                  
                  <div className="read-more">
                    <a href={`/blog/${blog.slug}`}>Read More</a>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
