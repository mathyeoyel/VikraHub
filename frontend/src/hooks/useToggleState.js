import { useState, useCallback } from 'react';
import { useAuth } from '../components/Auth/AuthContext';

/**
 * Custom hook for managing toggle button states (like, follow, subscribe, etc.)
 * Provides reusable logic for optimistic updates, error handling, and state management
 */
export const useToggleState = ({
  initialState = false,
  initialCount = 0,
  requireAuth = true,
  onStateChange,
  onError
}) => {
  const { isAuthenticated } = useAuth();
  const [isActive, setIsActive] = useState(initialState);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = useCallback(async (
    id,
    activateAPI,
    deactivateAPI,
    options = {}
  ) => {
    const {
      authMessage = 'Please log in to perform this action',
      updateCount = true,
      optimistic = true
    } = options;

    // Check authentication if required
    if (requireAuth && !isAuthenticated) {
      alert(authMessage);
      return false;
    }

    if (isLoading) return false;

    // Store previous state for rollback
    const previousState = isActive;
    const previousCount = count;
    const newState = !isActive;

    // Optimistic UI update
    if (optimistic) {
      setIsActive(newState);
      if (updateCount) {
        setCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));
      }
    }

    setIsLoading(true);

    try {
      // Choose the appropriate API function
      const apiFunction = newState ? activateAPI : deactivateAPI;
      
      if (!apiFunction) {
        throw new Error(`API function not provided for ${newState ? 'activation' : 'deactivation'}`);
      }

      const response = await apiFunction(id);
      
      // Parse response for actual state and count
      let actualState = newState;
      let actualCount = count;

      if (response && typeof response === 'object') {
        // Handle different response formats
        if (response.status) {
          actualState = response.status === 'liked' || 
                       response.status === 'followed' || 
                       response.status === 'subscribed' ||
                       response.status === 'active';
        }
        
        // Extract count from various possible fields
        const countFields = ['count', 'like_count', 'follow_count', 'subscriber_count'];
        for (const field of countFields) {
          if (typeof response[field] === 'number') {
            actualCount = response[field];
            break;
          }
        }

        // Handle nested data responses
        if (response.data) {
          if (response.data.status) {
            actualState = response.data.status === 'liked' || 
                         response.data.status === 'followed' || 
                         response.data.status === 'subscribed' ||
                         response.data.status === 'active';
          }
          
          for (const field of countFields) {
            if (typeof response.data[field] === 'number') {
              actualCount = response.data[field];
              break;
            }
          }
        }
      }

      // Update final state
      setIsActive(actualState);
      if (updateCount) {
        setCount(actualCount);
      }

      // Notify parent component
      if (onStateChange) {
        onStateChange({
          id,
          isActive: actualState,
          count: actualCount,
          previousState,
          previousCount,
          response
        });
      }

      return true;

    } catch (error) {
      console.error('Toggle state error:', error);
      
      // Rollback optimistic updates only if they were applied
      if (optimistic) {
        setIsActive(previousState);
        if (updateCount) {
          setCount(previousCount);
        }
      }

      // Handle error
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          `Failed to ${newState ? 'activate' : 'deactivate'}. Please try again.`;
      
      if (onError) {
        onError(error, errorMessage);
      } else {
        console.error('Toggle error:', errorMessage);
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    isActive, count, isLoading, requireAuth, isAuthenticated, onStateChange, onError
  ]);

  // Utility functions
  const activate = useCallback((id, activateAPI, options) => {
    if (isActive) return Promise.resolve(true);
    return toggle(id, activateAPI, () => Promise.resolve(), options);
  }, [isActive, toggle]);

  const deactivate = useCallback((id, deactivateAPI, options) => {
    if (!isActive) return Promise.resolve(true);
    return toggle(id, () => Promise.resolve(), deactivateAPI, options);
  }, [isActive, toggle]);

  const reset = useCallback((newState = initialState, newCount = initialCount) => {
    setIsActive(newState);
    setCount(newCount);
    setIsLoading(false);
  }, [initialState, initialCount]);

  const setStateWithoutAPI = useCallback((newState, newCount) => {
    setIsActive(newState);
    if (typeof newCount === 'number') {
      setCount(newCount);
    }
  }, []);

  return {
    // State
    isActive,
    count,
    isLoading,
    
    // Actions
    toggle,
    activate,
    deactivate,
    reset,
    setStateWithoutAPI,
    
    // Computed
    canToggle: !isLoading && (!requireAuth || isAuthenticated)
  };
};

/**
 * Specialized hook for like functionality
 */
export const useLikeState = (options = {}) => {
  return useToggleState({
    requireAuth: true,
    ...options
  });
};

/**
 * Specialized hook for follow functionality
 */
export const useFollowState = (options = {}) => {
  return useToggleState({
    requireAuth: true,
    ...options
  });
};

/**
 * Specialized hook for subscription functionality
 */
export const useSubscribeState = (options = {}) => {
  return useToggleState({
    requireAuth: true,
    ...options
  });
};

export default useToggleState;
