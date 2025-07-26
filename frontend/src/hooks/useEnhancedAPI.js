import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { assetAPI, blogAPI, notificationAPI } from '../api';
import websocketManager from '../websocketManager';

// Enhanced API hook with memory optimization and error handling
export const useEnhancedAPI = (apiCall, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  
  const {
    immediate = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    staleTime = 60 * 1000, // 1 minute stale time
    onSuccess,
    onError,
    retry = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  // Cleanup function
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchData = useCallback(async (retryCount = 0) => {
    if (!mountedRef.current) return;

    // Check if data is still fresh
    if (data && lastFetch && (Date.now() - lastFetch < staleTime)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const result = await apiCall();
      
      if (!mountedRef.current) return;

      if (result && result.error) {
        throw new Error(result.message || 'API Error');
      }

      setData(result);
      setLastFetch(Date.now());
      setError(null);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err.name === 'AbortError') {
        return; // Request was cancelled
      }

      console.error('API fetch error:', err);
      
      if (retry && retryCount < retryAttempts) {
        setTimeout(() => {
          fetchData(retryCount + 1);
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setError(err.message || 'Failed to fetch data');
        if (onError) {
          onError(err);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, data, lastFetch, staleTime, onSuccess, onError, retry, retryAttempts, retryDelay]);

  // Fetch data when dependencies change
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, ...dependencies]);

  const refetch = useCallback(() => {
    setLastFetch(null); // Force refetch
    return fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    setData(null);
    setLastFetch(null);
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isStale: lastFetch && (Date.now() - lastFetch > staleTime),
    isCached: lastFetch && (Date.now() - lastFetch < cacheTime)
  };
};

// Hook for user's assets with optimized memory usage
export const useMyAssets = (options = {}) => {
  const fetchAssets = useCallback(() => assetAPI.getMyAssets(), []);
  
  return useEnhancedAPI(fetchAssets, [], {
    ...options,
    onError: (error) => {
      console.error('Failed to fetch user assets:', error);
      if (options.onError) options.onError(error);
    }
  });
};

// Hook for user's blog posts
export const useMyBlogPosts = (options = {}) => {
  const fetchPosts = useCallback(() => blogAPI.getMyPosts(), []);
  
  return useEnhancedAPI(fetchPosts, [], {
    ...options,
    onError: (error) => {
      console.error('Failed to fetch user blog posts:', error);
      if (options.onError) options.onError(error);
    }
  });
};

// Hook for notifications with real-time updates
export const useNotificationsData = (options = {}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const fetchNotifications = useCallback(() => notificationAPI.getAll(), []);
  const fetchUnreadCount = useCallback(() => notificationAPI.getUnreadCount(), []);
  
  const notificationsResult = useEnhancedAPI(fetchNotifications, [], options);
  const unreadCountResult = useEnhancedAPI(fetchUnreadCount, [], {
    ...options,
    staleTime: 30 * 1000 // 30 seconds for unread count
  });

  // WebSocket integration for real-time updates
  useEffect(() => {
    const handleUnreadCount = (data) => {
      setUnreadCount(data.notification_count || 0);
    };

    const handleNewNotification = () => {
      notificationsResult.refetch();
      unreadCountResult.refetch();
    };

    websocketManager.addEventListener('unread_count', handleUnreadCount);
    websocketManager.addEventListener('notification', handleNewNotification);

    return () => {
      websocketManager.removeEventListener('unread_count', handleUnreadCount);
      websocketManager.removeEventListener('notification', handleNewNotification);
    };
  }, [notificationsResult.refetch, unreadCountResult.refetch]);

  return {
    ...notificationsResult,
    unreadCount: unreadCount || unreadCountResult.data?.unread_count || 0,
    refetchUnreadCount: unreadCountResult.refetch
  };
};

// Hook for optimized asset browsing with pagination
export const useAssets = (filters = {}, options = {}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [allAssets, setAllAssets] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchAssets = useCallback(() => {
    return assetAPI.getAll({ 
      ...filters, 
      page: currentPage,
      page_size: 20 
    });
  }, [filters, currentPage]);
  
  const result = useEnhancedAPI(fetchAssets, [filters, currentPage], {
    ...options,
    onSuccess: (data) => {
      if (currentPage === 1) {
        setAllAssets(data.results || []);
      } else {
        setAllAssets(prev => [...prev, ...(data.results || [])]);
      }
      setHasMore(!!data.next);
      if (options.onSuccess) options.onSuccess(data);
    }
  });

  const loadMore = useCallback(() => {
    if (hasMore && !result.loading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, result.loading]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setAllAssets([]);
    setHasMore(true);
    result.invalidate();
  }, [result.invalidate]);

  return {
    ...result,
    data: allAssets,
    hasMore,
    loadMore,
    reset,
    currentPage
  };
};

// Hook for WebSocket connection management
export const useWebSocketConnection = (options = {}) => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { autoConnect = true, onMessage, onConnect, onDisconnect } = options;

  useEffect(() => {
    const handleConnectionChange = () => {
      setConnectionState(websocketManager.getConnectionState());
    };

    const handleMessage = (data) => {
      setLastMessage(data);
      if (onMessage) onMessage(data);
    };

    const handleConnect = (data) => {
      setConnectionState('connected');
      if (onConnect) onConnect(data);
    };

    const handleDisconnect = (data) => {
      setConnectionState('disconnected');
      setIsAuthenticated(false);
      if (onDisconnect) onDisconnect(data);
    };

    const handleAuthenticated = (data) => {
      setIsAuthenticated(true);
    };

    // Add event listeners
    websocketManager.addEventListener('connected', handleConnect);
    websocketManager.addEventListener('disconnected', handleDisconnect);
    websocketManager.addEventListener('message', handleMessage);
    websocketManager.addEventListener('authenticated', handleAuthenticated);

    // Connect if auto-connect is enabled
    if (autoConnect && connectionState === 'disconnected') {
      websocketManager.connect();
    }

    // Initial state
    handleConnectionChange();

    return () => {
      websocketManager.removeEventListener('connected', handleConnect);
      websocketManager.removeEventListener('disconnected', handleDisconnect);
      websocketManager.removeEventListener('message', handleMessage);
      websocketManager.removeEventListener('authenticated', handleAuthenticated);
    };
  }, [autoConnect, connectionState, onMessage, onConnect, onDisconnect]);

  const connect = useCallback(() => {
    websocketManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketManager.disconnect();
  }, []);

  const sendMessage = useCallback((message) => {
    return websocketManager.send(message);
  }, []);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isAuthenticated,
    lastMessage,
    connect,
    disconnect,
    sendMessage
  };
};

// Memory optimization hook for large lists
export const useVirtualList = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll
  };
};

// Debounced search hook
export const useDebounceSearch = (searchTerm, delay = 500) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return debouncedTerm;
};
