import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogAPI } from '../api';
import LikeButton from './Social/LikeButton';
import CommentSection from './Social/CommentSection';
import SEO from './common/SEO';
import './BlogPost.css';

const BlogPost = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format blog content with proper typography and formatting
  const formatBlogContent = (content) => {
    if (!content) return '';
    
    console.log('Original content:', content);
    
    let formattedContent = content;
    
    // Normalize line endings
    formattedContent = formattedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Handle images with markdown syntax ![alt](url) and convert to responsive images
    formattedContent = formattedContent.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<div class="blog-image-container"><img src="$2" alt="$1" class="blog-image" loading="lazy" /><div class="blog-image-caption">$1</div></div>'
    );
    
    // Handle plain image URLs and make them responsive
    formattedContent = formattedContent.replace(
      /(?:^|\s)(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))(?:\s|$)/gi,
      ' <div class="blog-image-container"><img src="$1" alt="Blog image" class="blog-image" loading="lazy" /></div> '
    );
    
    // Handle links with markdown syntax [text](url)
    formattedContent = formattedContent.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="blog-link" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Handle code blocks with triple backticks
    formattedContent = formattedContent.replace(
      /```([\s\S]*?)```/g,
      '<div class="blog-code-block"><pre><code>$1</code></pre></div>'
    );
    
    // Handle inline code with single backticks
    formattedContent = formattedContent.replace(
      /`([^`]+)`/g,
      '<code class="blog-inline-code">$1</code>'
    );
    
    // Handle blockquotes
    formattedContent = formattedContent.replace(
      /^>\s+(.+)$/gm,
      '<blockquote class="blog-quote">$1</blockquote>'
    );
    
    // Style headers with proper hierarchy FIRST (before other processing)
    formattedContent = formattedContent.replace(
      /^(#{1,6})\s+(.+)$/gm, 
      (match, hashes, text) => {
        const level = hashes.length;
        return `<h${level} class="blog-heading blog-h${level}">${text}</h${level}>`;
      }
    );
    
    // Handle bullet points - MOST COMPREHENSIVE APPROACH
    // Split content into lines and process each potential list
    const lines = formattedContent.split('\n');
    const processedLines = [];
    let inList = false;
    let currentList = [];
    let listType = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if it's a bullet point (•, -, *, or ●)
      const bulletMatch = line.match(/^[•\-*●]\s+(.+)/);
      // Check if it's a numbered list
      const numberMatch = line.match(/^(\d+)\.\s+(.+)/);
      
      if (bulletMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) {
            // Close previous list
            processedLines.push(`</${listType} class="blog-${listType === 'ul' ? 'bullet' : 'numbered'}-list">`);
          }
          // Start new bullet list
          processedLines.push('<ul class="blog-bullet-list">');
          inList = true;
          listType = 'ul';
        }
        processedLines.push(`<li>${bulletMatch[1]}</li>`);
      } else if (numberMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) {
            // Close previous list
            processedLines.push(`</${listType}>`);
          }
          // Start new numbered list
          processedLines.push('<ol class="blog-numbered-list">');
          inList = true;
          listType = 'ol';
        }
        processedLines.push(`<li>${numberMatch[2]}</li>`);
      } else {
        // Not a list item
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        
        if (line) {
          processedLines.push(line);
        } else {
          processedLines.push(''); // Preserve empty lines
        }
      }
    }
    
    // Close any remaining open list
    if (inList) {
      processedLines.push(`</${listType}>`);
    }
    
    formattedContent = processedLines.join('\n');
    
    // Style text formatting
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong class="blog-bold">$1</strong>');
    formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em class="blog-italic">$1</em>');
    formattedContent = formattedContent.replace(/<u>(.*?)<\/u>/g, '<u class="blog-underline">$1</u>');
    formattedContent = formattedContent.replace(/~~(.*?)~~/g, '<del class="blog-strikethrough">$1</del>');
    
    // Handle paragraph breaks - split by double newlines or isolated single newlines
    const paragraphs = formattedContent.split(/\n\s*\n/);
    formattedContent = paragraphs.map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      
      // Don't wrap if it's already a block element
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || 
          trimmed.startsWith('<ol') || trimmed.startsWith('<div') || 
          trimmed.startsWith('<blockquote') || trimmed.includes('</ul>') || 
          trimmed.includes('</ol>')) {
        return trimmed;
      }
      
      return `<p class="blog-paragraph">${trimmed}</p>`;
    }).filter(para => para).join('\n\n');
    
    console.log('Formatted content:', formattedContent);
    
    return formattedContent;
  };

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
      {/* Dynamic SEO meta tags for social sharing */}
      {blog && (
        <SEO
          title={blog.title}
          description={blog.excerpt || blog.content?.substring(0, 160)}
          image={blog.image}
          url={`${window.location.origin}/blog/${blog.slug}`}
          type="article"
          article={{
            author: blog.author?.username || blog.author?.first_name || 'Vikra Hub',
            publishedTime: blog.created_at,
            modifiedTime: blog.updated_at,
            section: blog.category || 'Blog',
            tags: blog.tags_list || []
          }}
        />
      )}
      
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <article className="blog-post-content">
              {/* Breadcrumb */}
              <nav aria-label="breadcrumb" className="mb-4">
                <div className="breadcrumb-nav">
                  <Link to="/" className="breadcrumb-link">Home</Link>
                  <span className="breadcrumb-separator">/</span>
                  <Link to="/blog" className="breadcrumb-link">Blog</Link>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-current">{blog.title}</span>
                </div>
              </nav>

              {/* Featured Image */}
              {blog.image && (
                <div className="blog-post-featured-image mb-4">
                  <img 
                    src={blog.image} 
                    alt={blog.title} 
                    className="img-fluid rounded w-100"
                    style={{ maxHeight: '400px', objectFit: 'cover' }}
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
                  <div className="meta-line">
                    <span className="author-info">
                      <i className="fas fa-user icon"></i>
                      <span>By {blog.author?.username || blog.author?.first_name || 'mathyeoyel'}</span>
                    </span>
                    <span className="meta-separator">|</span>
                    <span className="publish-date">
                      <i className="fas fa-calendar icon"></i>
                      <time dateTime={blog.created_at}>
                        {new Date(blog.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </span>
                    <span className="meta-separator">|</span>
                    <span className="read-time">
                      <i className="fas fa-clock icon"></i>
                      <span>{Math.ceil((blog.content?.length || 0) / 1000)} min read</span>
                    </span>
                  </div>
                </div>
              </header>

              {/* Content */}
              <div className="blog-post-body">
                <div 
                  className="blog-content"
                  dangerouslySetInnerHTML={{ __html: formatBlogContent(blog.content) }}
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
                      <i className="fas fa-share icon"></i> Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="blog-post-comments mt-5 pt-4 border-top">
                <h4 className="mb-4">
                  <i className="fas fa-comment icon"></i> Comments
                </h4>
                <CommentSection 
                  type="blog"
                  id={blog.id}
                  allowComments={blog.allow_comments !== false}
                  className="blog-comments"
                />
              </div>

              {/* Navigation */}
              <div className="blog-post-navigation mt-5 pt-4 border-top">
                <Link to="/blog" className="btn btn-outline-primary">
                  <i className="fas fa-arrow-left icon"></i> Back to Blog
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
