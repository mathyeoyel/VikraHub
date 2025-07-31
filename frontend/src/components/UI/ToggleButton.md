# Toggle Button Components Documentation

## Overview

This documentation covers the reusable toggle button system implemented for VikraHub, including components for follow/unfollow and like/unlike functionality.

## Components

### 1. ToggleButton (Base Component)

A highly reusable, configurable toggle button component that can be used for any binary state action.

```jsx
import ToggleButton from '../UI/ToggleButton';

<ToggleButton
  id="123"
  initialState={false}
  initialCount={42}
  activeText="Following"
  inactiveText="Follow"
  activeIcon="✓"
  inactiveIcon="+"
  activateAPI={followUser}
  deactivateAPI={unfollowUser}
  size="medium"
  variant="primary"
  showCount={true}
  onStateChange={handleChange}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | string/number | - | Unique identifier for the item |
| `initialState` | boolean | false | Initial active state |
| `initialCount` | number | 0 | Initial count value |
| `activeText` | string | "Active" | Text when active |
| `inactiveText` | string | "Inactive" | Text when inactive |
| `activeIcon` | string | "✓" | Icon when active |
| `inactiveIcon` | string | "○" | Icon when inactive |
| `activateAPI` | function | - | Function to call when activating |
| `deactivateAPI` | function | - | Function to call when deactivating |
| `size` | string | "medium" | Size variant (small, medium, large) |
| `variant` | string | "default" | Style variant (default, primary, secondary, outline) |
| `showCount` | boolean | false | Whether to show count |
| `showIcon` | boolean | true | Whether to show icon |
| `showText` | boolean | true | Whether to show text |
| `onStateChange` | function | - | Callback when state changes |
| `onError` | function | - | Callback when error occurs |

### 2. FollowButton

Specialized follow/unfollow button built on ToggleButton.

```jsx
import FollowButton from '../Social/FollowButton';

<FollowButton
  userId="123"
  username="john_doe"
  initialFollowing={false}
  initialFollowerCount={150}
  size="medium"
  showCount={true}
  onFollowChange={handleFollowChange}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userId` | string/number | - | ID of user to follow |
| `username` | string | - | Username for accessibility |
| `initialFollowing` | boolean | false | Whether currently following |
| `initialFollowerCount` | number | 0 | Current follower count |
| `onFollowChange` | function | - | Callback when follow state changes |

### 3. LikeButtonV2

Enhanced like/unlike button supporting multiple content types.

```jsx
import LikeButtonV2 from '../Social/LikeButtonV2';

<LikeButtonV2
  type="post"
  id="456"
  initialLiked={false}
  initialCount={24}
  size="small"
  showCount={true}
  onLikeChange={handleLikeChange}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | "post" | Content type (post, blog, comment, blog-comment) |
| `id` | string/number | - | ID of content to like |
| `initialLiked` | boolean | false | Whether currently liked |
| `initialCount` | number | 0 | Current like count |
| `onLikeChange` | function | - | Callback when like state changes |

## Hooks

### useToggleState

Custom hook for managing toggle button state with optimistic updates.

```jsx
import { useToggleState } from '../hooks/useToggleState';

const MyComponent = ({ itemId }) => {
  const {
    isActive,
    count,
    isLoading,
    toggle,
    activate,
    deactivate
  } = useToggleState({
    initialState: false,
    initialCount: 0,
    onStateChange: (data) => console.log('State changed:', data)
  });

  const handleToggle = () => {
    toggle(itemId, activateAPI, deactivateAPI);
  };

  return (
    <button onClick={handleToggle} disabled={isLoading}>
      {isActive ? 'Active' : 'Inactive'} ({count})
    </button>
  );
};
```

### Specialized Hooks

```jsx
import { useLikeState, useFollowState } from '../hooks/useToggleState';

// For like functionality
const likeState = useLikeState({
  initialState: false,
  initialCount: 10
});

// For follow functionality
const followState = useFollowState({
  initialState: false,
  initialCount: 150
});
```

## Usage Examples

### Basic Follow Button

```jsx
const UserCard = ({ user, currentUser }) => {
  const handleFollowChange = (data) => {
    console.log(`${data.isFollowing ? 'Followed' : 'Unfollowed'} ${user.username}`);
    // Update local state, refresh user data, etc.
  };

  if (user.id === currentUser.id) return null; // Don't show follow button for self

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.username} />
      <h3>{user.username}</h3>
      <FollowButton
        userId={user.id}
        username={user.username}
        initialFollowing={user.is_following}
        initialFollowerCount={user.follower_count}
        onFollowChange={handleFollowChange}
      />
    </div>
  );
};
```

### Post with Like Button

```jsx
const PostCard = ({ post }) => {
  const handleLikeChange = (data) => {
    console.log(`Post ${data.isLiked ? 'liked' : 'unliked'}`);
    // Update post data, show animations, etc.
  };

  return (
    <article className="post-card">
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <div className="post-actions">
        <LikeButtonV2
          type="post"
          id={post.id}
          initialLiked={post.is_liked}
          initialCount={post.like_count}
          size="small"
          showCount={true}
          onLikeChange={handleLikeChange}
        />
      </div>
    </article>
  );
};
```

### Custom Toggle Button

```jsx
const SubscribeButton = ({ channelId, isSubscribed, subscriberCount }) => {
  const subscribeAPI = async (id) => {
    const response = await api.post(`/channels/${id}/subscribe/`);
    return { status: 'subscribed', subscriber_count: response.data.subscriber_count };
  };

  const unsubscribeAPI = async (id) => {
    const response = await api.post(`/channels/${id}/unsubscribe/`);
    return { status: 'unsubscribed', subscriber_count: response.data.subscriber_count };
  };

  return (
    <ToggleButton
      id={channelId}
      initialState={isSubscribed}
      initialCount={subscriberCount}
      activeText="Subscribed"
      inactiveText="Subscribe"
      activeIcon="🔔"
      inactiveIcon="🔔"
      activateAPI={subscribeAPI}
      deactivateAPI={unsubscribeAPI}
      variant="primary"
      showCount={true}
      className="toggle-button--subscribe"
    />
  );
};
```

## Error Handling

All components include comprehensive error handling:

```jsx
const handleError = (error, message) => {
  // Log error for debugging
  console.error('Toggle error:', error);
  
  // Show user-friendly message
  toast.error(message);
  
  // Track error for analytics
  analytics.track('toggle_error', {
    error: error.message,
    action: 'follow',
    userId: currentUser.id
  });
};

<FollowButton
  userId={targetUser.id}
  onError={handleError}
/>
```

## Styling

The components use CSS custom properties for easy theming:

```css
:root {
  --toggle-primary-color: #3b82f6;
  --toggle-success-color: #10b981;
  --toggle-danger-color: #ef4444;
  --toggle-border-radius: 0.375rem;
  --toggle-transition: all 0.2s ease-in-out;
}

/* Custom follow button styling */
.custom-follow-button {
  --toggle-primary-color: #8b5cf6;
  border-radius: 2rem;
  font-weight: 600;
}
```

## Accessibility Features

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Focus management

## Best Practices

1. **Always provide meaningful callbacks** for state changes
2. **Handle errors gracefully** with user-friendly messages
3. **Use optimistic updates** for better UX
4. **Provide loading states** for better feedback
5. **Use appropriate sizes and variants** for different contexts
6. **Test with screen readers** and keyboard navigation

## API Integration

The components expect API functions that return specific response formats:

```javascript
// Expected API response format
{
  status: 'liked' | 'unliked' | 'followed' | 'unfollowed',
  count: number, // or like_count, follow_count, etc.
  data: any // additional response data
}
```

For existing APIs that don't match this format, you can create wrapper functions:

```javascript
const wrapperFollowAPI = async (userId) => {
  const response = await userAPI.follow(userId);
  return {
    status: 'followed',
    follow_count: response.followers_count,
    data: response
  };
};
```
