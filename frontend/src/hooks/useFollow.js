// frontend/src/hooks/useFollow.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followAPI } from '../api';

// Query keys for consistent cache management
export const followKeys = {
  stats: (userId) => ['follow', 'stats', userId],
  following: (userId) => ['follow', 'following', userId],
  followers: (userId) => ['follow', 'followers', userId],
  myStats: () => ['follow', 'myStats'],
  suggestions: () => ['follow', 'suggestions'],
  notifications: () => ['follow', 'notifications']
};

/**
 * Hook for follow operations with persistent state
 */
export const useFollow = (userId) => {
  const queryClient = useQueryClient();

  // Get follow stats for a user
  const {
    data: followStats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: followKeys.stats(userId),
    queryFn: async () => {
      console.log(`🔍 Fetching follow stats for user ${userId}`);
      const response = await followAPI.getFollowStats(userId);
      console.log(`📊 Follow stats response:`, response.data);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5000, // 5 seconds - shorter to ensure fresh data
    cacheTime: 60000, // 1 minute 
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Follow mutation with optimistic updates
  const followMutation = useMutation({
    mutationFn: async (targetUserId) => {
      console.log(`➡️ Following user ${targetUserId}`);
      // Use new idempotent endpoint
      const response = await fetch(`/api/follow/toggle/${targetUserId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      console.log(`✅ Follow response:`, data);
      return data;
    },
    onMutate: async (targetUserId) => {
      console.log(`🔄 Optimistically updating follow state for user ${targetUserId}`);
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: followKeys.stats(targetUserId) });
      
      // Snapshot the previous value
      const previousStats = queryClient.getQueryData(followKeys.stats(targetUserId));
      
      // Optimistically update to the new value
      queryClient.setQueryData(followKeys.stats(targetUserId), (old) => {
        if (!old) return {
          is_following: true,
          followers_count: 1,
          following_count: 0,
          is_followed_by: false
        };
        return {
          ...old,
          is_following: true,
          followers_count: old.followers_count + (old.is_following ? 0 : 1)
        };
      });
      
      // Return a context object with the snapshotted value
      return { previousStats, targetUserId };
    },
    onSuccess: (data, targetUserId) => {
      console.log(`🎉 Follow mutation succeeded, updating cache with server data`);
      // Update cache with actual server response
      queryClient.setQueryData(followKeys.stats(targetUserId), data.target_user ? {
        is_following: data.is_following,
        followers_count: data.target_user.followers_count,
        following_count: data.target_user.following_count,
        is_followed_by: false // This would need to be included in server response
      } : (old) => ({
        ...old,
        is_following: data.is_following
      }));
    },
    onError: (err, targetUserId, context) => {
      console.error(`❌ Follow mutation failed:`, err);
      // Roll back to previous state on error
      if (context?.previousStats) {
        queryClient.setQueryData(followKeys.stats(context.targetUserId), context.previousStats);
      }
    },
    onSettled: (data, error, targetUserId) => {
      console.log(`🔄 Follow mutation settled, invalidating queries`);
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: followKeys.stats(targetUserId) });
      queryClient.invalidateQueries({ queryKey: followKeys.myStats() });
    }
  });

  // Unfollow mutation with optimistic updates
  const unfollowMutation = useMutation({
    mutationFn: async (targetUserId) => {
      console.log(`➡️ Unfollowing user ${targetUserId}`);
      // Use new idempotent endpoint
      const response = await fetch(`/api/follow/toggle/${targetUserId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      console.log(`✅ Unfollow response:`, data);
      return data;
    },
    onMutate: async (targetUserId) => {
      console.log(`🔄 Optimistically updating unfollow state for user ${targetUserId}`);
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: followKeys.stats(targetUserId) });
      
      // Snapshot the previous value
      const previousStats = queryClient.getQueryData(followKeys.stats(targetUserId));
      
      // Optimistically update to the new value
      queryClient.setQueryData(followKeys.stats(targetUserId), (old) => {
        if (!old) return {
          is_following: false,
          followers_count: 0,
          following_count: 0,
          is_followed_by: false
        };
        return {
          ...old,
          is_following: false,
          followers_count: Math.max(0, old.followers_count - (old.is_following ? 1 : 0))
        };
      });
      
      // Return a context object with the snapshotted value
      return { previousStats, targetUserId };
    },
    onSuccess: (data, targetUserId) => {
      console.log(`🎉 Unfollow mutation succeeded, updating cache with server data`);
      // Update cache with actual server response
      queryClient.setQueryData(followKeys.stats(targetUserId), data.target_user ? {
        is_following: data.is_following,
        followers_count: data.target_user.followers_count,
        following_count: data.target_user.following_count,
        is_followed_by: false // This would need to be included in server response
      } : (old) => ({
        ...old,
        is_following: data.is_following
      }));
    },
    onError: (err, targetUserId, context) => {
      console.error(`❌ Unfollow mutation failed:`, err);
      // Roll back to previous state on error
      if (context?.previousStats) {
        queryClient.setQueryData(followKeys.stats(context.targetUserId), context.previousStats);
      }
    },
    onSettled: (data, error, targetUserId) => {
      console.log(`🔄 Unfollow mutation settled, invalidating queries`);
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: followKeys.stats(targetUserId) });
      queryClient.invalidateQueries({ queryKey: followKeys.myStats() });
    }
  });

  // Toggle follow function
  const toggleFollow = (targetUserId) => {
    const isCurrentlyFollowing = followStats?.is_following;
    
    if (isCurrentlyFollowing) {
      return unfollowMutation.mutate(targetUserId);
    } else {
      return followMutation.mutate(targetUserId);
    }
  };

  return {
    // State
    followStats,
    isFollowing: followStats?.is_following ?? false,
    followersCount: followStats?.followers_count ?? 0,
    followingCount: followStats?.following_count ?? 0,
    
    // Loading states
    isLoading: statsLoading,
    isFollowingUser: followMutation.isPending,
    isUnfollowingUser: unfollowMutation.isPending,
    
    // Error states
    error: statsError || followMutation.error || unfollowMutation.error,
    
    // Actions
    follow: (targetUserId) => followMutation.mutate(targetUserId),
    unfollow: (targetUserId) => unfollowMutation.mutate(targetUserId),
    toggleFollow,
    
    // Helper to force refresh
    refreshFollowStatus: () => {
      queryClient.invalidateQueries({ queryKey: followKeys.stats(userId) });
    }
  };
};

/**
 * Hook for like operations with persistent state
 */
export const useLike = (itemType, itemId) => {
  const queryClient = useQueryClient();
  
  // Query keys for likes
  const likeKeys = {
    status: (type, id) => ['like', type, id],
    count: (type, id) => ['like', 'count', type, id]
  };

  // Get like status and count
  const {
    data: likeData,
    isLoading: likeLoading,
    error: likeError
  } = useQuery({
    queryKey: likeKeys.status(itemType, itemId),
    queryFn: async () => {
      // This would need to be implemented in the API
      // For now, we'll use the existing endpoints to check like status
      const endpoints = {
        post: () => fetch(`/api/posts/${itemId}/`).then(r => r.json()),
        blog: () => fetch(`/api/blogs/${itemId}/`).then(r => r.json()),
        comment: () => fetch(`/api/comments/${itemId}/`).then(r => r.json())
      };
      
      return endpoints[itemType]?.() || Promise.reject('Unknown item type');
    },
    enabled: !!itemId && !!itemType,
    staleTime: 10000, // 10 seconds
    cacheTime: 60000, // 1 minute
    select: (response) => ({
      isLiked: response.data?.is_liked || false,
      likeCount: response.data?.like_count || 0
    })
  });

  // Like mutation with optimistic updates
  const likeMutation = useMutation({
    mutationFn: ({ type, id, action }) => {
      const endpoints = {
        post: (id, method) => fetch(`/api/posts/${id}/like/`, { method, headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' } }),
        blog: (id, method) => fetch(`/api/blogs/${id}/like/`, { method, headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' } }),
        comment: (id, method) => fetch(`/api/comments/${id}/like/`, { method, headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' } })
      };
      
      const method = action === 'like' ? 'PUT' : 'DELETE';
      return endpoints[type]?.(id, method).then(r => r.json()) || Promise.reject('Unknown item type');
    },
    onMutate: async ({ type, id, action }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: likeKeys.status(type, id) });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(likeKeys.status(type, id));
      
      // Optimistically update to the new value
      queryClient.setQueryData(likeKeys.status(type, id), (old) => {
        if (!old) return { isLiked: action === 'like', likeCount: action === 'like' ? 1 : 0 };
        
        const countChange = action === 'like' ? 
          (old.isLiked ? 0 : 1) : 
          (old.isLiked ? -1 : 0);
          
        return {
          isLiked: action === 'like',
          likeCount: Math.max(0, old.likeCount + countChange)
        };
      });
      
      return { previousData, type, id };
    },
    onError: (err, variables, context) => {
      // Roll back to previous state on error
      if (context?.previousData) {
        queryClient.setQueryData(likeKeys.status(context.type, context.id), context.previousData);
      }
    },
    onSettled: (data, error, { type, id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: likeKeys.status(type, id) });
    }
  });

  // Toggle like function
  const toggleLike = () => {
    const action = likeData?.isLiked ? 'unlike' : 'like';
    return likeMutation.mutate({ type: itemType, id: itemId, action });
  };

  return {
    // State
    isLiked: likeData?.isLiked ?? false,
    likeCount: likeData?.likeCount ?? 0,
    
    // Loading states
    isLoading: likeLoading,
    isToggling: likeMutation.isPending,
    
    // Error states
    error: likeError || likeMutation.error,
    
    // Actions
    like: () => likeMutation.mutate({ type: itemType, id: itemId, action: 'like' }),
    unlike: () => likeMutation.mutate({ type: itemType, id: itemId, action: 'unlike' }),
    toggleLike
  };
};
