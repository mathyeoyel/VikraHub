import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import { postsAPI } from '../../api';
import './PostCard.css';

const PostCard = ({ 
  post, 
  showComments = false, 
  onPostUpdate,
  className = '' 
}) => {
  const [showCommentSection, setShowCommentSection] = useState(showComments);
  const [postData, setPostData] = useState(post);

  // Early return if post data is invalid
  if (!post || !postData) {
    return (
      <div className="post-card__error">
        <p>Unable to load post data</p>
      </div>
    );
  }

  const handleViewPost = async () => {
    if (!post?.id) return;
    
    try {
      await postsAPI.incrementView(post.id);
      setPostData(prev => ({ 
        ...prev, 
        view_count: (prev.view_count || 0) + 1 
      }));
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleLikeChange = (likeData) => {
    setPostData(prev => ({
      ...prev,
      like_count: likeData.likeCount,
      is_liked: likeData.isLiked
    }));
    
    if (onPostUpdate) {
      onPostUpdate({ ...postData, ...likeData });
    }
  };

  const handleCommentAdded = (newComment) => {
    setPostData(prev => ({
      ...prev,
      comment_count: (prev.comment_count || 0) + 1
    }));
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (category) => {
    const icons = {
      art: '🎨',
      music: '🎵',
      photography: '📸',
      writing: '✍️',
      tech: '💻',
      business: '💼',
      lifestyle: '🌟',
      education: '📚',
      entertainment: '🎬',
      general: '💭'
    };
    return icons[category] || '💭';
  };

  const getPrivacyIcon = () => {
    return postData.is_public ? '🌍' : '🔒';
  };

  return (
    <article className={`post-card ${className}`}>
      {/* Post Header */}
      <div className="post-card__header">
        <div className="post-card__author">
          <div className="post-card__avatar">
            {postData.user?.avatar ? (
              <img src={postData.user.avatar} alt={postData.user.username} />
            ) : (
              <div className="post-card__avatar-placeholder">
                {postData.user?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          
          <div className="post-card__author-info">
            <Link 
              to={`/profile/${postData.user?.username}`} 
              className="post-card__author-name"
            >
              {postData.user?.first_name && postData.user?.last_name 
                ? `${postData.user.first_name} ${postData.user.last_name}`
                : postData.user?.username || 'Unknown User'
              }
            </Link>
            <div className="post-card__meta">
              <span className="post-card__time">
                {postData.time_since_posted || formatTimeAgo(postData.created_at)}
              </span>
              <span className="post-card__category">
                {getCategoryIcon(postData.category)} {postData.category}
              </span>
              <span className="post-card__privacy">
                {getPrivacyIcon()} {postData.is_public ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="post-card__actions">
          <button className="post-card__menu-btn" title="More options">
            ⋯
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-card__content">
        <h2 className="post-card__title">{postData.title}</h2>
        <div className="post-card__text">
          {postData.content}
        </div>
        
        {/* Post Image */}
        {postData.image && (
          <div className="post-card__image">
            <img src={postData.image} alt="Post content" />
          </div>
        )}
        
        {/* Tags */}
        {postData.tags_list && postData.tags_list.length > 0 && (
          <div className="post-card__tags">
            {postData.tags_list.map((tag, index) => (
              <span key={index} className="post-card__tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Engagement */}
      <div className="post-card__engagement">
        <div className="post-card__stats">
          {postData.id && (
            <LikeButton
              type="post"
              id={postData.id}
              initialLiked={postData.is_liked}
              initialCount={postData.like_count}
              onLikeChange={handleLikeChange}
              size="medium"
              showCount={true}
            />
          )}
          
          <button
            className={`post-card__comment-btn ${showCommentSection ? 'post-card__comment-btn--active' : ''}`}
            onClick={() => setShowCommentSection(!showCommentSection)}
            disabled={!postData.allow_comments}
            title={postData.allow_comments ? 'View comments' : 'Comments disabled'}
          >
            <i className="fas fa-comment icon"></i> {postData.comment_count || 0}
          </button>
          
          {postData.allow_sharing && (
            <button className="post-card__share-btn" title="Share post">
              <i className="fas fa-share icon"></i> {postData.share_count || 0}
            </button>
          )}
          
          <span className="post-card__views" title="Views">
            <i className="fas fa-eye icon"></i> {postData.view_count || 0}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      {showCommentSection && postData.allow_comments && postData.id && (
        <CommentSection
          type="post"
          id={postData.id}
          allowComments={postData.allow_comments}
          onCommentAdded={handleCommentAdded}
          className="post-card__comments"
        />
      )}
    </article>
  );
};

export default PostCard;
