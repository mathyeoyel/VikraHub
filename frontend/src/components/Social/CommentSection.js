import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import LikeButton from './LikeButton';
import './CommentSection.css';

const CommentSection = ({ 
  type = 'post', // 'post' or 'blog'
  id, 
  allowComments = true,
  initialComments = [],
  onCommentAdded,
  className = ''
}) => {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Load comments on component mount
  useEffect(() => {
    if (id && allowComments) {
      loadComments();
    }
  }, [id, allowComments]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const { postsAPI, blogEngagementAPI } = await import('../../api');
      
      let response;
      if (type === 'post') {
        response = await postsAPI.getComments(id);
      } else if (type === 'blog') {
        response = await blogEngagementAPI.getBlogComments(id);
      }
      
      setComments(response.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please log in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { postsAPI, blogEngagementAPI } = await import('../../api');
      
      const commentData = { content: newComment.trim() };
      
      let response;
      if (type === 'post') {
        response = await postsAPI.addComment(id, commentData);
      } else if (type === 'blog') {
        response = await blogEngagementAPI.addBlogComment(id, commentData);
      }
      
      console.log('Comment API response:', response);
      
      // Add new comment to the list - handle different response structures
      const newCommentData = response.data || response;
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
      
      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded(response.data);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Comment data sent:', commentData);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      const { commentsAPI } = await import('../../api');
      
      const replyData = { content: replyText.trim() };
      const response = await commentsAPI.reply(commentId, replyData);
      
      // Update the comments to include the new reply
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, replies: [...(comment.replies || []), response.data] }
            : comment
        )
      );
      
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
    }
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

  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`comment ${isReply ? 'comment--reply' : ''}`}>
      <div className="comment__avatar">
        {comment.user?.avatar ? (
          <img src={comment.user.avatar} alt={comment.user.username} />
        ) : (
          <div className="comment__avatar-placeholder">
            {comment.user?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      
      <div className="comment__content">
        <div className="comment__header">
          <span className="comment__author">
            {comment.user?.first_name && comment.user?.last_name 
              ? `${comment.user.first_name} ${comment.user.last_name}`
              : comment.user?.username || 'Unknown User'
            }
          </span>
          <span className="comment__time">
            {comment.time_since_posted || formatTimeAgo(comment.created_at)}
          </span>
        </div>
        
        <div className="comment__text">
          {comment.content}
        </div>
        
        <div className="comment__actions">
          <LikeButton
            type={type === 'post' ? 'comment' : 'blog-comment'}
            id={comment.id}
            initialLiked={comment.is_liked}
            initialCount={comment.like_count}
            size="small"
            showCount={true}
          />
          
          {!isReply && (
            <button
              className="comment__reply-btn"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              💬 Reply
            </button>
          )}
        </div>
        
        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="comment__reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="comment__reply-input"
              rows="2"
            />
            <div className="comment__reply-actions">
              <button
                onClick={() => setReplyingTo(null)}
                className="btn btn-secondary btn-small"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReplySubmit(comment.id)}
                className="btn btn-primary btn-small"
                disabled={!replyText.trim()}
              >
                Reply
              </button>
            </div>
          </div>
        )}
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="comment__replies">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  if (!allowComments) {
    return (
      <div className={`comment-section comment-section--disabled ${className}`}>
        <p className="comment-section__disabled-message">
          Comments are disabled for this content.
        </p>
      </div>
    );
  }

  return (
    <div className={`comment-section ${className}`}>
      <div className="comment-section__header">
        <h3>Comments ({comments.length})</h3>
      </div>
      
      {/* Comment form */}
      {isAuthenticated && (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="comment-form__avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <div className="comment-form__avatar-placeholder">
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          
          <div className="comment-form__input-container">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="comment-form__input"
              rows="3"
              disabled={isSubmitting}
            />
            <div className="comment-form__actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      {!isAuthenticated && (
        <div className="comment-section__login-prompt">
          <p>Please <a href="/login">log in</a> to join the conversation.</p>
        </div>
      )}
      
      {/* Comments list */}
      <div className="comment-section__list">
        {isLoading ? (
          <div className="comment-section__loading">
            <div className="loading-spinner"></div>
            <p>Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => renderComment(comment))
        ) : (
          <div className="comment-section__empty">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
