// frontend/src/contexts/QueryClientProvider.js
import React from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client with optimized settings for follow/like operations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Consider data stale after 5 seconds for better consistency
      staleTime: 5000,
      
      // Keep data in cache for 1 minute 
      cacheTime: 60000,
      
      // Refetch on window focus for critical data
      refetchOnWindowFocus: true,
      
      // Refetch when reconnecting to the internet
      refetchOnReconnect: true,
      
      // Refetch on mount to ensure fresh data
      refetchOnMount: true,
      
      // Background refetch interval for active queries
      refetchInterval: false, // Disabled by default, can be enabled per query
    },
    mutations: {
      // Retry failed mutations
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for network errors
        return failureCount < 2;
      },
    },
  },
});

export const QueryClientProvider = ({ children }) => {
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </TanstackQueryClientProvider>
  );
};

export default QueryClientProvider;
