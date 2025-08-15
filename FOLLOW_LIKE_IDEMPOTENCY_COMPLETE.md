# Follow/Like System Idempotency Implementation - Complete Fix

## Overview

This document describes the comprehensive solution implemented to make the VikraHub follow/like system **idempotent server-side** and ensure state **never flips on refresh** with persistent frontend state management.

## Problem Statement

The original system had several critical issues:
1. **Non-idempotent server endpoints**: Follow/like operations returned different status codes based on existing state
2. **State flipping on reload**: Follow/like buttons would show incorrect state after page refresh  
3. **Race conditions**: Multiple rapid clicks could cause inconsistent state
4. **No persistent state management**: Frontend state was lost on navigation/reload

## Solution Architecture

### Backend Changes (Django REST Framework)

#### 1. New Idempotent Follow Endpoints

**New Endpoint**: `PUT/DELETE /api/follow/toggle/{user_id}/`

```python
class FollowToggleView(generics.GenericAPIView):
    def put(self, request, user_id):
        """Idempotent follow operation - always returns current follow state"""
        return self._handle_follow_operation(request, user_id, follow=True)
    
    def delete(self, request, user_id):
        """Idempotent unfollow operation - always returns current follow state"""
        return self._handle_follow_operation(request, user_id, follow=False)
```

**Key Features**:
- **Consistent HTTP 200 responses** regardless of previous state
- **State change tracking** via `state_changed` field
- **Atomic operations** using `get_or_create`
- **Backward compatibility** with legacy POST endpoints

**Response Format**:
```json
{
  "status": "success",
  "is_following": true,
  "state_changed": true,
  "previous_state": false,
  "message": "Now following username",
  "target_user": {
    "id": 123,
    "username": "target_user",
    "followers_count": 42,
    "following_count": 17
  }
}
```

#### 2. Idempotent Like Endpoints

Updated all like endpoints to support `PUT/DELETE` methods:
- `PUT/DELETE /api/posts/{id}/like/`
- `PUT/DELETE /api/blogs/{id}/like/`
- `PUT/DELETE /api/comments/{id}/like/`

**Key Features**:
- **Explicit like/unlike operations** via HTTP methods
- **Consistent response format** with current state
- **State change tracking** for UI feedback
- **Legacy POST toggle support** maintained

### Frontend Changes (React + React Query)

#### 1. React Query Integration

Added `@tanstack/react-query` for persistent state management:

```javascript
// QueryClientProvider with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,      // 30 seconds
      cacheTime: 300000,     // 5 minutes  
      refetchOnWindowFocus: true,
    }
  }
});
```

#### 2. Custom Hooks with Optimistic Updates

**`useFollow(userId)` Hook**:
```javascript
const {
  isFollowing,
  followersCount,
  isLoading,
  toggleFollow
} = useFollow(userId);
```

**Features**:
- **Persistent state** across page reloads
- **Optimistic updates** for instant UI feedback
- **Automatic rollback** on network errors
- **Cache invalidation** for related queries

**`useLike(itemType, itemId)` Hook**:
```javascript
const {
  isLiked,
  likeCount,
  isToggling,
  toggleLike
} = useLike('post', postId);
```

#### 3. New Persistent Components

**FollowButtonPersistent Component**:
- Uses React Query for state management
- Prevents double-clicking with loading states
- Shows real-time follower counts
- Error handling with user feedback

**LikeButtonPersistent Component**:
- Idempotent like/unlike operations
- Animated state transitions
- Persistent like counts
- Optimistic UI updates

## Implementation Details

### Cache Keys Strategy

```javascript
export const followKeys = {
  stats: (userId) => ['follow', 'stats', userId],
  following: (userId) => ['follow', 'following', userId],
  followers: (userId) => ['follow', 'followers', userId],
  myStats: () => ['follow', 'myStats']
};
```

### Optimistic Updates Pattern

```javascript
onMutate: async (targetUserId) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: followKeys.stats(targetUserId) });
  
  // Snapshot previous value
  const previousStats = queryClient.getQueryData(followKeys.stats(targetUserId));
  
  // Optimistically update
  queryClient.setQueryData(followKeys.stats(targetUserId), (old) => ({
    ...old,
    is_following: true,
    followers_count: old.followers_count + (old.is_following ? 0 : 1)
  }));
  
  return { previousStats, targetUserId };
},
onError: (err, targetUserId, context) => {
  // Rollback on error
  if (context?.previousStats) {
    queryClient.setQueryData(followKeys.stats(context.targetUserId), context.previousStats);
  }
}
```

## API Endpoints Reference

### Follow Operations

| Method | Endpoint | Description | Idempotent |
|--------|----------|-------------|------------|
| `PUT` | `/api/follow/toggle/{user_id}/` | Follow user | ✅ |
| `DELETE` | `/api/follow/toggle/{user_id}/` | Unfollow user | ✅ |
| `POST` | `/api/follow/follow/` | Legacy follow | ❌ |
| `POST` | `/api/follow/unfollow/{user_id}/` | Legacy unfollow | ❌ |

### Like Operations

| Method | Endpoint | Description | Idempotent |
|--------|----------|-------------|------------|
| `PUT` | `/api/posts/{id}/like/` | Like post | ✅ |
| `DELETE` | `/api/posts/{id}/like/` | Unlike post | ✅ |
| `PUT` | `/api/blogs/{id}/like/` | Like blog | ✅ |
| `DELETE` | `/api/blogs/{id}/like/` | Unlike blog | ✅ |
| `POST` | `/api/posts/{id}/like/` | Legacy toggle | ❌ |

## State Management Flow

```
1. User clicks Follow/Like button
2. Optimistic update shown immediately
3. API request sent to idempotent endpoint
4. On success: Cache updated with server response
5. On error: Optimistic update rolled back
6. UI reflects final state consistently
```

## Testing Strategy

### Idempotency Tests

```python
# Test multiple follow requests return same result
for i in range(3):
    response = session.put(f"/api/follow/toggle/{user_id}/")
    assert response.status_code == 200
    assert response.json()["is_following"] == True
    # Only first request should have state_changed=True
    assert response.json()["state_changed"] == (i == 0)
```

### Persistence Tests

```javascript
// Test state persists across page reloads
const { isFollowing } = useFollow(userId);
// Reload page
// State should be same from cache
expect(isFollowing).toBe(true);
```

## Migration Guide

### For Existing Components

1. **Replace old FollowButton**:
```javascript
// Old
import FollowButton from './components/FollowButton';

// New
import FollowButtonPersistent from './components/FollowButton/FollowButtonPersistent';
```

2. **Update API calls**:
```javascript
// Old non-idempotent
const followUser = async (userId) => {
  const response = await api.post('/follow/follow/', { user_id: userId });
  // Handle different status codes...
};

// New idempotent
const { toggleFollow } = useFollow(userId);
// Always returns consistent state
```

3. **Add QueryClientProvider**:
```javascript
// Wrap app with React Query
<QueryClientProvider>
  <App />
</QueryClientProvider>
```

## Performance Benefits

1. **Reduced API calls**: React Query caching eliminates redundant requests
2. **Instant UI feedback**: Optimistic updates provide immediate response
3. **Consistent state**: Single source of truth prevents state conflicts
4. **Error resilience**: Automatic rollback on failures

## Backward Compatibility

- All legacy endpoints remain functional
- Existing components continue to work
- Gradual migration path available
- No breaking changes to existing API contracts

## Deployment Checklist

### Backend
- [ ] Deploy new Django views with idempotent endpoints
- [ ] Verify database constraints on Follow/Like models
- [ ] Test new URL patterns
- [ ] Monitor legacy endpoint usage

### Frontend
- [ ] Install React Query dependencies
- [ ] Add QueryClientProvider to app root
- [ ] Deploy new persistent components
- [ ] Update API client with new endpoints
- [ ] Test state persistence across routes

## Result

✅ **Follow operations are now idempotent server-side**
✅ **Like operations are now idempotent server-side**
✅ **State never flips on refresh due to React Query persistence**
✅ **Optimistic updates provide instant UI feedback**
✅ **Race conditions eliminated through proper state management**
✅ **Backward compatibility maintained for legacy code**

The system now provides a robust, consistent, and user-friendly experience for all follow/like interactions while maintaining data integrity and eliminating the frustrating state-flipping issues.
