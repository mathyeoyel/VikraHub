import React, { useState, useEffect } from 'react';
import { blogAPI } from '../api';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await blogAPI.list();
        setBlogs(response.data || []);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return <div className="text-center">Loading blog posts...</div>;
  }

  return (
    <section id="blog" className="blog">
      <div className="container">
        <div className="section-title">
          <h2>Blog</h2>
          <p>Latest insights and updates</p>
        </div>

        <div className="row">
          {blogs.map(blog => (
            <div key={blog.id} className="col-lg-4 col-md-6">
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

                <h2 className="entry-title">
                  <a href={`/blog/${blog.slug}`}>{blog.title}</a>
                </h2>

                <div className="entry-meta">
                  <ul>
                    <li className="d-flex align-items-center">
                      <i className="bi bi-person"></i>
                      <a href="#">{blog.author?.username}</a>
                    </li>
                    <li className="d-flex align-items-center">
                      <i className="bi bi-clock"></i>
                      <time dateTime={blog.created_at}>
                        {new Date(blog.created_at).toLocaleDateString()}
                      </time>
                    </li>
                  </ul>
                </div>

                <div className="entry-content">
                  <p>{blog.excerpt || blog.content?.substring(0, 150) + '...'}</p>
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
