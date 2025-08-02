// Integration Guide for Toggle Button Components
// This file shows how to integrate the new toggle buttons into existing components

import React from 'react';
import FollowButton from '../Social/FollowButton';
import LikeButtonV2 from '../Social/LikeButtonV2';

// 1. Replace existing LikeButton in PostCard component
const PostCard = ({ post, currentUser }) => {
  const handleLikeChange = (data) => {
    // Optional: Update parent state, analytics, etc.
    console.log(`Post ${data.isLiked ? 'liked' : 'unliked'}`);
  };

  return (
    <div className="post-card">
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      <div className="post-actions">
        {/* Replace old LikeButton with LikeButtonV2 */}
        <LikeButtonV2
          type="post"
          id={post.id}
          initialLiked={post.is_liked}
          initialCount={post.like_count}
          size="small"
          showCount={true}
          onLikeChange={handleLikeChange}
        />
        <button className="comment-btn">
          <i className="fas fa-comment icon"></i> {post.comment_count} Comments
        </button>
      </div>
    </div>
  );
};

// 2. Add FollowButton to UserProfile component
const UserProfile = ({ user, currentUser }) => {
  const handleFollowChange = (data) => {
    // Update UI, show notifications, etc.
    if (data.isFollowing) {
      toast.success(`You are now following ${user.username}`);
    } else {
      toast.info(`You unfollowed ${user.username}`);
    }
  };

  const isOwnProfile = currentUser && currentUser.id === user.id;

  return (
    <div className="user-profile">
      <img src={user.avatar} alt={user.username} className="avatar" />
      <div className="user-info">
        <h1>{user.username}</h1>
        <p>{user.bio}</p>
        <div className="stats">
          <span>{user.post_count} Posts</span>
          <span>{user.follower_count} Followers</span>
          <span>{user.following_count} Following</span>
        </div>
        {!isOwnProfile && (
          <FollowButton
            userId={user.id}
            username={user.username}
            initialFollowing={user.is_following}
            initialFollowerCount={user.follower_count}
            size="medium"
            showCount={false}
            onFollowChange={handleFollowChange}
          />
        )}
      </div>
    </div>
  );
};

// 3. Add LikeButton to BlogPost component
const BlogPost = ({ blog, currentUser }) => {
  const handleLikeChange = (data) => {
    console.log(`Blog ${data.isLiked ? 'liked' : 'unliked'}`);
  };

  return (
    <article className="blog-post">
      <h1>{blog.title}</h1>
      <div className="blog-meta">
        <span>By {blog.author.username}</span>
        <span>{blog.created_at}</span>
      </div>
      <div className="blog-content">
        {blog.content}
      </div>
      <div className="blog-actions">
        <LikeButtonV2
          type="blog"
          id={blog.id}
          initialLiked={blog.is_liked}
          initialCount={blog.like_count}
          size="medium"
          showCount={true}
          onLikeChange={handleLikeChange}
        />
      </div>
    </article>
  );
};

// 4. Add LikeButton to Comment component
const Comment = ({ comment, postId, type = 'post' }) => {
  const handleLikeChange = (data) => {
    console.log(`Comment ${data.isLiked ? 'liked' : 'unliked'}`);
  };

  // Determine comment type based on parent content
  const commentType = type === 'blog' ? 'blog-comment' : 'comment';

  return (
    <div className="comment">
      <div className="comment-header">
        <img src={comment.author.avatar} alt={comment.author.username} />
        <span className="username">{comment.author.username}</span>
        <span className="timestamp">{comment.created_at}</span>
      </div>
      <div className="comment-content">
        {comment.content}
      </div>
      <div className="comment-actions">
        <LikeButtonV2
          type={commentType}
          id={comment.id}
          initialLiked={comment.is_liked}
          initialCount={comment.like_count}
          size="small"
          showCount={true}
          onLikeChange={handleLikeChange}
        />
        <button className="reply-btn">Reply</button>
      </div>
    </div>
  );
};

// 5. Add FollowButton to UserCard (for user lists, search results, etc.)
const UserCard = ({ user, currentUser }) => {
  const handleFollowChange = (data) => {
    // Update local user list, refresh data, etc.
    if (data.isFollowing) {
      user.is_following = true;
      user.follower_count = data.followerCount;
    } else {
      user.is_following = false;
      user.follower_count = data.followerCount;
    }
  };

  const isOwnProfile = currentUser && currentUser.id === user.id;

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.username} />
      <div className="user-info">
        <h3>{user.username}</h3>
        <p className="bio">{user.bio}</p>
        <div className="stats">
          <span>{user.follower_count} followers</span>
        </div>
      </div>
      {!isOwnProfile && (
        <FollowButton
          userId={user.id}
          username={user.username}
          initialFollowing={user.is_following}
          initialFollowerCount={user.follower_count}
          size="small"
          showCount={false}
          onFollowChange={handleFollowChange}
        />
      )}
    </div>
  );
};

// 6. Integration with existing Home.js component
const Home = () => {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useAuth();

  // Update post in local state when liked/unliked
  const handlePostLikeChange = (postId, data) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, is_liked: data.isLiked, like_count: data.likeCount }
          : post
      )
    );
  };

  // Update user in local state when followed/unfollowed
  const handleUserFollowChange = (userId, data) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, is_following: data.isFollowing, follower_count: data.followerCount }
          : user
      )
    );
  };

  return (
    <div className="home">
      <div className="posts-section">
        <h2>Recent Posts</h2>
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={currentUser}
            onLikeChange={(data) => handlePostLikeChange(post.id, data)}
          />
        ))}
      </div>
      
      <div className="users-section">
        <h2>Suggested Users</h2>
        {users.map(user => (
          <UserCard 
            key={user.id} 
            user={user} 
            currentUser={currentUser}
            onFollowChange={(data) => handleUserFollowChange(user.id, data)}
          />
        ))}
      </div>
    </div>
  );
};

export {
  PostCard,
  UserProfile,
  BlogPost,
  Comment,
  UserCard,
  Home
};
