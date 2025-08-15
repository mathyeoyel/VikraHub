import axios from "axios";
import { getAccessToken, getRefreshToken, removeTokens, saveToken } from "./auth";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/", // Use local development API by default
  headers: {
    "Content-Type": "application/json",
  },   
});

// Debug: Log the API base URL being used
console.log('🌐 API Configuration:', {
  baseURL: api.defaults.baseURL,
  env: process.env.NODE_ENV,
  apiUrl: process.env.REACT_APP_API_URL
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  config => {
    // Skip authentication for public routes
    const publicRoutes = [
      'public-profiles/',
      'freelancer-profiles/', // Freelancer profiles should be publicly viewable
      'creator-profiles/', // Creator profiles should be publicly viewable
    ];
    
    // Special handling for portfolio: GET requests with username parameter are public (public profiles)
    // Only authenticated access needed for user's own portfolio or write operations
    const isPortfolioPublic = config.method === 'get' && 
      config.url.includes('portfolio/') && 
      config.url.includes('username=') && 
      !config.url.includes('mine/');
    
    // Special handling for creative-assets: only GET requests to marketplace listings are public
    const isCreativeAssetsPublic = config.method === 'get' && 
      config.url.includes('creative-assets/') && 
      !config.url.includes('my_assets/') && 
      !config.url.includes('my-assets/') &&
      !config.url.includes('purchase/') &&
      !config.url.includes('review/') &&
      !config.url.includes('recommended/'); // Recommended endpoint requires authentication
    
    // Special handling for posts: only GET requests to view posts are public
    const isPostsPublic = config.method === 'get' && 
      config.url.includes('posts/') && 
      !config.url.includes('/like/') &&
      !config.url.includes('/add_comment/') &&
      !config.url.includes('/increment_view/');
    
    // Special handling for blog: only GET requests to view blog posts are public
    const isBlogPublic = config.method === 'get' && 
      config.url.includes('blog/') && 
      !config.url.includes('/like/') &&
      !config.url.includes('/comments/') &&
      !config.url.includes('my_posts/');
    
    // Special handling for follow stats: GET requests to view follow stats are public
    // BUT we still want to send the auth token if available to get relationship info
    const isFollowStatsPublic = false; // Changed to false so auth token is always sent
    
    const isPublicRoute = publicRoutes.some(route => config.url.includes(route)) || 
                         isPortfolioPublic ||
                         isCreativeAssetsPublic || 
                         isPostsPublic ||
                         isBlogPublic ||
                         isFollowStatsPublic;

    // Debug route classification for blog endpoints
    if (config.url.includes('blog')) {
      console.log('🔍 Blog route classification:', {
        url: config.url,
        method: config.method,
        isBlogPublic: isBlogPublic,
        isPublicRoute: isPublicRoute,
        includesMyPosts: config.url.includes('my_posts/')
      });
    }

    if (!isPublicRoute) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Debug follow/portfolio/blog requests
        if (config.url.includes('follow')) {
          console.log('🤝 Follow request authentication:', {
            method: config.method,
            url: config.url,
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            headers: config.headers
          });
        } else if (config.url.includes('portfolio')) {
          console.log('🎯 Portfolio request authentication:', {
            method: config.method,
            url: config.url,
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            headers: config.headers
          });
        } else if (config.url.includes('blog')) {
          console.log('📝 Blog request authentication:', {
            method: config.method,
            url: config.url,
            baseURL: config.baseURL,
            fullURL: config.baseURL + config.url,
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
            headers: config.headers,
            authHeader: config.headers.Authorization
          });
        }
      } else {
        console.warn('⚠️ No token available for authenticated route:', config.url);
      }
    }
    
    // For FormData uploads, let the browser set the Content-Type automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle token expiration and errors
api.interceptors.response.use(
  response => {
    // Log successful API responses for debugging
    if (response.config.url.includes('blog')) {
      console.log('✅ Blog API response success:', {
        status: response.status,
        url: response.config.url,
        method: response.config.method
      });
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;
    
    // Enhanced logging for blog API errors
    if (originalRequest?.url?.includes('blog')) {
      console.error('❌ Blog API response error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: originalRequest.url,
        baseURL: originalRequest.baseURL,
        fullURL: (originalRequest.baseURL || '') + (originalRequest.url || ''),
        method: originalRequest.method,
        headers: originalRequest.headers,
        responseData: error.response?.data
      });
    }
    
    // Skip token refresh for public routes
    const publicRoutes = [
      'public-profiles/'
    ];
    
    // Special handling for creative-assets: only GET requests to marketplace listings are public
    const isCreativeAssetsPublic = originalRequest.method === 'get' && 
      originalRequest.url.includes('creative-assets/') && 
      !originalRequest.url.includes('my_assets/') && 
      !originalRequest.url.includes('my-assets/') &&
      !originalRequest.url.includes('purchase/') &&
      !originalRequest.url.includes('review/') &&
      !originalRequest.url.includes('recommended/'); // Recommended endpoint requires authentication
    
    const isPublicRoute = publicRoutes.some(route => originalRequest.url.includes(route)) || isCreativeAssetsPublic;
    
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicRoute) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await api.post('auth/token/refresh/', { refresh: refreshToken });
          const { access } = response.data;
          
          saveToken({ access, refresh: refreshToken });
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        removeTokens();
        // Let the auth context handle the logout
      }
    }
    
    return Promise.reject(error);
  }
);

// Enhanced error handling helper
const handleAPIError = (error, defaultMessage = "An error occurred") => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    if (status === 401) {
      return { 
        error: true, 
        message: data.detail || "Authentication required",
        status: 401,
        authError: true
      };
    } else if (status === 403) {
      return { 
        error: true, 
        message: data.detail || "Permission denied",
        status: 403
      };
    } else if (status === 404) {
      return { 
        error: true, 
        message: data.detail || "Resource not found",
        status: 404
      };
    } else if (status === 500) {
      return { 
        error: true, 
        message: data.detail || "Server error occurred",
        status: 500
      };
    } else {
      return { 
        error: true, 
        message: data.error || data.detail || defaultMessage,
        status
      };
    }
  } else if (error.request) {
    // Network error
    return { 
      error: true, 
      message: "Network error - please check your connection",
      networkError: true
    };
  } else {
    // Other error
    return { 
      error: true, 
      message: error.message || defaultMessage
    };
  }
};

// API endpoints
export const authAPI = {
  login: (credentials) => api.post("auth/token/", credentials),
  refresh: (refreshToken) => api.post("auth/token/refresh/", { refresh: refreshToken }),
  register: (userData) => api.post("users/", userData),
};

export const userAPI = {
  getProfile: () => api.get("users/me/"),
  updateProfile: (data) => {
    // Since we're now sending URLs instead of files, use JSON
    return api.patch("profiles/update_profile/", data);
  },
  getMyProfile: () => api.get("profiles/my_profile/"),
  changePassword: (data) => api.post("auth/change-password/", data),
  updatePreferences: (data) => api.patch("profiles/preferences/", data),
  deleteAccount: () => api.delete("users/me/"),
  
  // Follow/unfollow functions for compatibility with existing components
  follow: async (userId) => {
    try {
      // Send user_id as expected by backend FollowCreateSerializer
      const response = await api.post("follow/follow/", { user_id: userId });
      return response.data;
    } catch (error) {
      console.error('Follow request failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  unfollow: async (userId) => {
    try {
      // Unfollow using the user ID in URL, no body
      const response = await api.post(`follow/unfollow/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Unfollow request failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Project-related endpoints
  getMyProjects: () => api.get("projects/my-projects/"),
  createProject: (data) => api.post("projects/", data),
  updateProject: (id, data) => api.patch(`projects/${id}/`, data),
  deleteProject: (id) => api.delete(`projects/${id}/`),
  getProjectApplications: (projectId) => api.get(`projects/${projectId}/applications/`),
  
  // User lookup by username
  getUserByUsername: (username) => api.get(`users/username/${username}/`),
};

export const teamAPI = {
  getAll: () => api.get("team/"),
  create: (data) => api.post("team/", data),
  update: (id, data) => api.patch(`team/${id}/`, data),
  delete: (id) => api.delete(`team/${id}/`),
};

export const serviceAPI = {
  getAll: () => api.get("services/"),
  create: (data) => api.post("services/", data),
  update: (id, data) => api.patch(`services/${id}/`, data),
  delete: (id) => api.delete(`services/${id}/`),
};

export const portfolioAPI = {
  // Get all portfolios (defaults to current user's if authenticated, or requires username param)
  getAll: () => api.get("portfolio/"),
  
  // Get current user's portfolio items (authenticated endpoint)
  getMine: () => api.get("portfolio/mine/"),
  
  // Get portfolio items by username (public profile view)
  getByUsername: (username) => api.get(`portfolio/?username=${username}`),
  
  // Get specific portfolio item
  getById: (id) => api.get(`portfolio/${id}/`),
  
  // Create new portfolio item (auto-assigned to current user)
  create: (data) => {
    // For FormData uploads, let axios set Content-Type automatically
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.post("portfolio/", data, config);
  },
  
  // Update portfolio item (only owner can update)
  update: (id, data) => {
    // For FormData uploads, let axios set Content-Type automatically
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.patch(`portfolio/${id}/`, data, config);
  },
  
  // Delete portfolio item (only owner can delete)
  delete: (id) => api.delete(`portfolio/${id}/`),
};

// Works API - alias for portfolio with cleaner naming
export const worksAPI = {
  // Get current user's works (authenticated endpoint)
  getMine: () => api.get("works/mine/"),
  
  // Get works by username (public profile view)
  getByUsername: (username) => api.get(`works/?username=${username}`),
  
  // Get specific work item
  getById: (id) => api.get(`works/${id}/`),
  
  // Create new work item (auto-assigned to current user)
  create: (data) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.post("works/", data, config);
  },
  
  // Update work item (only owner can update)
  update: (id, data) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.patch(`works/${id}/`, data, config);
  },
  
  // Delete work item (only owner can delete)
  delete: (id) => api.delete(`works/${id}/`),
};

export const blogAPI = {
  getAll: async () => {
    try {
      const response = await api.get("blog/");
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch blog posts");
    }
  },
  getMyPosts: async () => {
    try {
      // Ensure we have a valid token before making the request
      const token = getAccessToken();
      if (!token) {
        console.error("❌ No access token found for blog/my_posts/ request");
        throw new Error("Authentication required - please login again");
      }
      
      console.log('🔐 Making authenticated blog request:', {
        hasToken: !!token,
        tokenLength: token.length,
        tokenStart: token.substring(0, 10) + '...',
        endpoint: 'blog/my_posts/'
      });
      
      // Force authentication header for this specific request
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await api.get("blog/my_posts/", config);
      console.log('✅ Blog API request successful:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ Blog API error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: (error.config?.baseURL || '') + (error.config?.url || ''),
        headers: error.config?.headers,
        responseData: error.response?.data
      });
      
      // If 401, clear tokens and suggest re-login
      if (error.response?.status === 401) {
        console.warn('🔄 401 Unauthorized - may need to refresh token or re-login');
      }
      
      return handleAPIError(error, "Failed to fetch your blog posts");
    }
  },
  create: async (data) => {
    try {
      // Check if data is FormData (for file uploads)
      const config = {};
      if (data instanceof FormData) {
        config.headers = {
          'Content-Type': 'multipart/form-data',
        };
      }
      
      const response = await api.post("blog/", data, config);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to create blog post");
    }
  },
  update: async (id, data) => {
    try {
      // Ensure we have a valid token before making the request
      const token = getAccessToken();
      if (!token) {
        console.error("❌ No access token found for blog update request");
        throw new Error("Authentication required - please login again");
      }
      
      console.log('🔐 Making authenticated blog update request:', {
        id: id,
        hasToken: !!token,
        tokenLength: token.length,
        isFormData: data instanceof FormData,
        endpoint: `blog/${id}/`
      });

      // Check if data is FormData (for file uploads)
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      if (data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
      } else {
        config.headers['Content-Type'] = 'application/json';
      }
      
      const response = await api.patch(`blog/${id}/`, data, config);
      console.log('✅ Blog update request successful:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ Blog update error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: (error.config?.baseURL || '') + (error.config?.url || ''),
        headers: error.config?.headers,
        responseData: error.response?.data,
        blogId: id
      });
      
      // Special handling for 500 errors
      if (error.response?.status === 500) {
        console.error('🚨 Server error while updating blog post:', {
          blogId: id,
          possibleCauses: [
            'Blog post does not exist',
            'Invalid data format',
            'Database constraint violation',
            'Server-side permission error'
          ]
        });
      }
      
      return handleAPIError(error, "Failed to update blog post");
    }
  },
  delete: async (id) => {
    try {
      // Ensure we have a valid token before making the request
      const token = getAccessToken();
      if (!token) {
        console.error("❌ No access token found for blog delete request");
        throw new Error("Authentication required - please login again");
      }
      
      console.log('🔐 Making authenticated blog delete request:', {
        id: id,
        hasToken: !!token,
        tokenLength: token.length,
        endpoint: `blog/${id}/`
      });

      // Force authentication header for this specific request
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await api.delete(`blog/${id}/`, config);
      console.log('✅ Blog delete request successful:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ Blog delete error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: (error.config?.baseURL || '') + (error.config?.url || ''),
        headers: error.config?.headers,
        responseData: error.response?.data,
        blogId: id
      });
      
      // Special handling for 500 errors
      if (error.response?.status === 500) {
        console.error('🚨 Server error while deleting blog post:', {
          blogId: id,
          possibleCauses: [
            'Blog post does not exist',
            'Database constraint violation', 
            'Server-side permission error',
            'Related data dependencies'
          ]
        });
      }
      
      return handleAPIError(error, "Failed to delete blog post");
    }
  },
  getBySlug: async (slug) => {
    try {
      const response = await api.get(`blog/${slug}/`);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch blog post");
    }
  },
};

export const notificationAPI = {
  getAll: async () => {
    try {
      const response = await api.get("notifications/");
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch notifications");
    }
  },
  markAsRead: async (id) => {
    try {
      const response = await api.post(`notifications/${id}/mark_read/`);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to mark notification as read");
    }
  },
  create: async (data) => {
    try {
      const response = await api.post("notifications/", data);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to create notification");
    }
  },
  getUnreadCount: async () => {
    try {
      const response = await api.get("notifications/unread_count/");
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch unread count");
    }
  },
};

export const publicProfileAPI = {
  getAll: () => api.get("public-profiles/"),
  getByUsername: (username) => api.get(`public-profiles/${username}/`),
  getById: (userId) => api.get(`public-profiles/?user__id=${userId}`),
  search: (params) => api.get("public-profiles/search/", { params }),
};

// Creative Assets Marketplace API with enhanced error handling
export const assetAPI = {
  // Assets
  getAll: async (params) => {
    try {
      const response = await api.get("creative-assets/", { params });
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch assets");
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`creative-assets/${id}/`);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch asset details");
    }
  },
  create: async (data) => {
    try {
      const response = await api.post("creative-assets/", data);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to create asset");
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.patch(`creative-assets/${id}/`, data);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to update asset");
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`creative-assets/${id}/`);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to delete asset");
    }
  },
  getMyAssets: async () => {
    try {
      const response = await api.get("creative-assets/my_assets/");
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch your assets");
    }
  },
  getTrending: async (params) => {
    try {
      const response = await api.get("creative-assets/trending/", { params });
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch trending assets");
    }
  },
  getRecommended: async (params) => {
    try {
      const response = await api.get("creative-assets/recommended/", { params });
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch recommended assets");
    }
  },
  purchase: async (id) => {
    try {
      const response = await api.post(`creative-assets/${id}/purchase/`);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to purchase asset");
    }
  },
  download: async (id) => {
    try {
      const response = await api.post(`creative-assets/${id}/download/`);
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to download asset");
    }
  },
  getSellerStats: async () => {
    try {
      const response = await api.get("creative-assets/seller_stats/");
      return response.data;
    } catch (error) {
      return handleAPIError(error, "Failed to fetch seller statistics");
    }
  },
  
  // Categories
  getCategories: () => api.get("asset-categories/"),
  
  // Purchases
  getPurchases: () => api.get("asset-purchases/"),
  downloadPurchased: (purchaseId) => api.post(`asset-purchases/${purchaseId}/download/`),
  getDownloadHistory: () => api.get("asset-purchases/download_history/"),
  
  // Reviews
  getReviews: (params) => api.get("asset-reviews/", { params }),
  createReview: (data) => api.post("asset-reviews/", data),
  updateReview: (id, data) => api.patch(`asset-reviews/${id}/`, data),
  deleteReview: (id) => api.delete(`asset-reviews/${id}/`),
  
  // Creators/Freelancers
  getCreators: (params) => api.get("creator-profiles/", { params }),
  getCreator: (id) => api.get(`creator-profiles/${id}/`),
  getFeaturedCreators: () => api.get("creator-profiles/featured/"),
  getFreelancers: (params) => api.get("freelancer-profiles/", { params }),
  getFreelancer: (id) => api.get(`freelancer-profiles/${id}/`),
};

// Messages API - Enhanced with idempotent conversation creation
export const messagesAPI = {
  // Get all conversations for authenticated user
  getConversations: () => api.get("messaging/conversations/"),
  
  // Get or create conversation with target user (idempotent)
  getOrCreateConversation: async (targetUserId) => {
    try {
      const response = await api.post("messaging/conversations/", {
        target_user_id: targetUserId
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get/create conversation:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get conversation details
  getConversation: (conversationId) => api.get(`messaging/conversations/${conversationId}/`),
  
  // Get messages in conversation (paginated)
  getMessages: (conversationId, page = 1) => {
    const params = page > 1 ? `?page=${page}` : '';
    return api.get(`messaging/conversations/${conversationId}/messages/${params}`);
  },
  
  // Send message to conversation
  sendMessage: async (conversationId, messageData) => {
    try {
      const response = await api.post(`messaging/conversations/${conversationId}/messages/`, messageData);
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Mark conversation as read (legacy)
  markAsRead: (conversationId) => api.post(`messaging/conversations/${conversationId}/mark-read/`),
  
  // Delete conversation (soft delete for user)
  deleteConversation: (conversationId) => api.delete(`messaging/conversations/${conversationId}/`),
  
  // Get total unread messages count
  getUnreadCount: () => api.get("messaging/unread-count/"),
  
  // Legacy endpoints for backward compatibility
  legacy: {
    createConversation: (data) => api.post("messaging/conversations/legacy/", data),
    getMessagesBetweenUsers: (userId) => api.get(`messaging/messages/?user_id=${userId}`),
    getUnreadMessagesCount: (userId) => api.get(`messaging/messages/user/${userId}/unread/`),
  },
  
  // Typing indicators
  startTyping: (conversationId) => api.post(`messaging/conversations/${conversationId}/typing/start/`),
  stopTyping: (conversationId) => api.post(`messaging/conversations/${conversationId}/typing/stop/`),
  
  // Message reactions
  addReaction: (messageId, reaction) => api.post(`messaging/messages/${messageId}/reactions/`, { reaction }),
  removeReaction: (messageId) => api.post(`messaging/messages/${messageId}/reactions/remove/`),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get("notifications/"),
  markAsRead: (id) => api.patch(`notifications/${id}/mark_read/`),
  markAllAsRead: () => api.post("notifications/mark_all_read/"),
  delete: (id) => api.delete(`notifications/${id}/`),
  getUnreadCount: () => api.get("notifications/unread_count/"),
  updateSettings: (data) => api.patch("notifications/settings/", data),
};

// Follow System API
export const followAPI = {
  // New idempotent endpoints
  toggleFollow: async (userId, action = 'follow') => {
    try {
      const method = action === 'follow' ? 'PUT' : 'DELETE';
      const response = await api.request({
        method,
        url: `follow/toggle/${userId}/`,
      });
      return response.data;
    } catch (error) {
      console.error(`${action} request failed:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Explicit follow/unfollow methods using idempotent endpoints
  follow: async (userId) => {
    return followAPI.toggleFollow(userId, 'follow');
  },
  
  unfollow: async (userId) => {
    return followAPI.toggleFollow(userId, 'unfollow');
  },
  
  // Legacy follow functions with profile refresh (backward compatibility)
  followWithRefresh: async (userId, username) => {
    try {
      const followResponse = await followAPI.follow(userId);
      
      // Refetch the user's profile to get updated follow status
      let updatedProfile = null;
      if (username) {
        try {
          const profileResponse = await api.get(`public-profiles/${username}/`);
          updatedProfile = profileResponse.data;
        } catch (profileError) {
          console.warn('Failed to refresh profile after follow:', profileError);
        }
      }
      
      return {
        followResult: followResponse,
        updatedProfile: updatedProfile
      };
    } catch (error) {
      console.error('Follow with refresh failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  unfollowWithRefresh: async (userId, username) => {
    try {
      const unfollowResponse = await followAPI.unfollow(userId);
      
      // Refetch the user's profile to get updated follow status
      let updatedProfile = null;
      if (username) {
        try {
          const profileResponse = await api.get(`public-profiles/${username}/`);
          updatedProfile = profileResponse.data;
        } catch (profileError) {
          console.warn('Failed to refresh profile after unfollow:', profileError);
        }
      }
      
      return {
        unfollowResult: unfollowResponse,
        updatedProfile: updatedProfile
      };
    } catch (error) {
      console.error('Unfollow with refresh failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Username-based follow function for backwards compatibility
  followByUsername: async (username) => {
    try {
      // First get user ID from username since backend expects user_id
      const userResponse = await api.get(`public-profiles/${username}/`);
      const userId = userResponse.data.user.id;
      const response = await api.post("follow/follow/", { user_id: userId });
      return response.data;
    } catch (error) {
      console.error('Follow by username failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Profile refresh helper
  refreshUserProfile: async (username) => {
    try {
      const response = await api.get(`public-profiles/${username}/`);
      return response.data;
    } catch (error) {
      console.error('Profile refresh failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Stats and data functions
  getMyStats: () => api.get("follow/my-stats/"),
  getMyFollowStats: () => api.get("follow/my-stats/"), // Alias for compatibility
  getUserStats: (user_id) => api.get(`follow/stats/${user_id}/`),
  getFollowStats: async (user_id) => {
    try {
      console.log(`📡 Fetching follow stats for user ${user_id}`);
      const response = await api.get(`follow/stats/${user_id}/`);
      console.log(`📊 Follow stats API response:`, response.data);
      return response;
    } catch (error) {
      console.error(`❌ Follow stats API error:`, error.response?.data || error.message);
      throw error;
    }
  },
  getFollowers: (user_id) => api.get(`follow/followers/${user_id}/`),
  getFollowing: (user_id) => api.get(`follow/following/${user_id}/`),
  
  // Notifications
  getNotifications: () => api.get("follow/notifications/"),
  getFollowNotifications: () => api.get("follow/notifications/"), // Alias for compatibility
  markNotificationRead: (notification_id) => api.post(`follow/notifications/${notification_id}/read/`),
  markAllNotificationsRead: () => api.post("follow/notifications/read-all/"),
  
  // Suggestions and search
  getSuggestions: () => api.get("follow/suggestions/"),
  getFollowSuggestions: () => api.get("follow/suggestions/"), // Alias for compatibility
  searchUsers: (query) => api.get("follow/search/", { params: { q: query } }),
};

// 🚀 Enhanced Messaging API with proper error handling and validation
export const messagingAPI = {
  // Get conversations with enhanced error handling
  getConversations: async () => {
    try {
      const response = await api.get("messaging/conversations/");
      console.log('✅ Conversations fetched successfully:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch conversations:', error.response?.data || error.message);
      
      // Return empty data structure to prevent crashes
      if (error.response?.status === 500) {
        console.warn('🔧 Server error detected, returning empty conversations list');
        return { data: [] };
      }
      throw error;
    }
  },
  
  // Create conversation with validation
  createConversation: async (participant_username, initial_message) => {
    try {
      if (!participant_username) {
        throw new Error('Participant username is required');
      }
      
      // Build payload conditionally - only include initial_message if it's a non-empty string
      const payload = { participant_username };
      if (initial_message && initial_message.trim()) {
        payload.initial_message = initial_message.trim();
      }
      
      const response = await api.post("messaging/conversations/create/", payload);
      console.log('✅ Conversation created successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to create conversation:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get specific conversation
  getConversation: async (conversation_id) => {
    try {
      if (!conversation_id) {
        throw new Error('Conversation ID is required');
      }
      return await api.get(`messaging/conversations/${conversation_id}/`);
    } catch (error) {
      console.error('❌ Failed to fetch conversation:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get messages with validation
  getMessages: async (conversation_id) => {
    try {
      if (!conversation_id) {
        throw new Error('Conversation ID is required');
      }
      
      const response = await api.get(`messaging/conversations/${conversation_id}/messages/`);
      console.log('✅ Messages fetched successfully:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error.response?.data || error.message);
      
      // Return empty messages array to prevent crashes
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn('🔧 Returning empty messages list due to error');
        return { data: [] };
      }
      throw error;
    }
  },
  
  // Send message with enhanced validation and reply support
  sendMessage: async (conversation_id, content, reply_to_id = null, message_type = 'text') => {
    try {
      if (!conversation_id) {
        throw new Error('Conversation ID is required');
      }
      if (!content || !content.trim()) {
        throw new Error('Message content cannot be empty');
      }
      
      const payload = { 
        content: content.trim(), 
        message_type 
      };
      
      // Add reply_to_id if provided
      if (reply_to_id) {
        payload.reply_to_id = reply_to_id;
      }
      
      const response = await api.post(`messaging/conversations/${conversation_id}/messages/`, payload);
      console.log('✅ Message sent successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to send message:', error.response?.data || error.message);
      throw error;
    }
  },

  // Add message reaction
  addReaction: async (message_id, reaction_type) => {
    try {
      if (!message_id) {
        throw new Error('Message ID is required');
      }
      if (!reaction_type) {
        throw new Error('Reaction type is required');
      }
      
      const response = await api.post(`messaging/messages/${message_id}/reactions/`, { 
        reaction_type 
      });
      console.log('✅ Reaction added successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to add reaction:', error.response?.data || error.message);
      throw error;
    }
  },

  // Remove message reaction
  removeReaction: async (message_id) => {
    try {
      if (!message_id) {
        throw new Error('Message ID is required');
      }
      
      const response = await api.delete(`messaging/messages/${message_id}/reactions/remove/`);
      console.log('✅ Reaction removed successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to remove reaction:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get user status/presence
  getUserStatus: async (user_id) => {
    try {
      if (!user_id) {
        throw new Error('User ID is required');
      }
      
      const response = await api.get(`messaging/users/${user_id}/status/`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get user status:', error.response?.data || error.message);
      throw error;
    }
  },

  // Mark specific messages as read
  markMessagesRead: async (conversation_id, message_ids) => {
    try {
      if (!conversation_id) {
        throw new Error('Conversation ID is required');
      }
      if (!message_ids || !Array.isArray(message_ids)) {
        throw new Error('Message IDs array is required');
      }
      
      const response = await api.post(`messaging/conversations/${conversation_id}/mark-messages-read/`, { 
        message_ids 
      });
      console.log('✅ Messages marked as read successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Mark conversation as read
  markConversationRead: async (conversation_id) => {
    try {
      if (!conversation_id) {
        console.warn('⚠️ Conversation ID missing for mark read');
        return;
      }
      return await api.post(`messaging/conversations/${conversation_id}/mark-read/`);
    } catch (error) {
      console.error('❌ Failed to mark conversation as read:', error.response?.data || error.message);
      // Don't throw error for mark as read failures
    }
  },
  
  // Typing indicators
  startTyping: (conversation_id) => api.post(`messaging/conversations/${conversation_id}/typing/start/`),
  stopTyping: (conversation_id) => api.post(`messaging/conversations/${conversation_id}/typing/stop/`),
  
  // Utility functions
  getUnreadCount: () => api.get("messaging/unread-count/"),
  getMessage: (message_id) => api.get(`messaging/messages/${message_id}/`),
  getMessagesWithUser: (user_id) => api.get(`messaging/messages/?user_id=${user_id}`),
  getUnreadMessagesCount: () => api.get("messaging/unread-count/"),
};

// Export individual follow functions for compatibility with React components
// Functions as requested by the user specifications:

// follow(userId: number) – sends a POST request to /api/follow/follow/ with a JSON body { user_id: <id> }
export const follow = async (userId) => {
  try {
    const response = await api.post("follow/follow/", { user_id: userId });
    return response.data;
  } catch (error) {
    console.error('Follow request failed:', error.response?.data || error.message);
    throw error;
  }
};

// unfollow(userId: number) – sends a POST request to /api/follow/unfollow/{user_id}/
export const unfollow = async (userId) => {
  try {
    const response = await api.post(`follow/unfollow/${userId}/`);
    return response.data;
  } catch (error) {
    console.error('Unfollow request failed:', error.response?.data || error.message);
    throw error;
  }
};

// Enhanced follow with profile refresh
export const followWithRefresh = async (userId, username = null) => {
  try {
    const followResult = await follow(userId);
    
    // Optionally refetch profile data
    let updatedProfile = null;
    if (username) {
      try {
        updatedProfile = await publicProfileAPI.getByUsername(username);
        updatedProfile = updatedProfile.data;
      } catch (profileError) {
        console.warn('Failed to refresh profile after follow:', profileError);
      }
    }
    
    return { followResult, updatedProfile };
  } catch (error) {
    console.error('Follow with refresh failed:', error);
    throw error;
  }
};

// Enhanced unfollow with profile refresh  
export const unfollowWithRefresh = async (userId, username = null) => {
  try {
    const unfollowResult = await unfollow(userId);
    
    // Optionally refetch profile data
    let updatedProfile = null;
    if (username) {
      try {
        updatedProfile = await publicProfileAPI.getByUsername(username);
        updatedProfile = updatedProfile.data;
      } catch (profileError) {
        console.warn('Failed to refresh profile after unfollow:', profileError);
      }
    }
    
    return { unfollowResult, updatedProfile };
  } catch (error) {
    console.error('Unfollow with refresh failed:', error);
    throw error;
  }
};

// getMyFollowStats() – GET /api/follow/my-stats/
export const getMyFollowStats = async () => {
  try {
    const response = await api.get("follow/my-stats/");
    return response.data;
  } catch (error) {
    console.error('Get my follow stats failed:', error.response?.data || error.message);
    throw error;
  }
};

// getFollowNotifications() – GET /api/follow/notifications/
export const getFollowNotifications = async () => {
  try {
    const response = await api.get("follow/notifications/");
    return response.data;
  } catch (error) {
    console.error('Get follow notifications failed:', error.response?.data || error.message);
    throw error;
  }
};

// getFollowSuggestions() – GET /api/follow/suggestions/
export const getFollowSuggestions = async () => {
  try {
    const response = await api.get("follow/suggestions/");
    return response.data;
  } catch (error) {
    console.error('Get follow suggestions failed:', error.response?.data || error.message);
    throw error;
  }
};

// 🔍 Universal Search API - Search across all VikraHub content
export const searchAPI = {
  // Universal search across all content types
  universal: async (query, filters = {}) => {
    try {
      console.log('🔍 Starting universal search for:', query);
      const results = {};
      
      // Search all available endpoints in parallel
      console.log('📡 Making parallel API calls...');
      const [usersResponse, freelancersResponse, creatorsResponse, assetsResponse, servicesResponse, portfoliosResponse] = await Promise.allSettled([
        api.get(`/public-profiles/search/?q=${encodeURIComponent(query)}`),
        // For freelancers, try both skills search and getting all then filtering
        Promise.race([
          api.get(`/freelancer-profiles/?skills=${encodeURIComponent(query)}`),
          api.get(`/freelancer-profiles/`)
        ]),
        // For creators, get all and let frontend filter
        api.get(`/creator-profiles/`),
        api.get(`/creative-assets/?search=${encodeURIComponent(query)}`),
        api.get(`/services/?search=${encodeURIComponent(query)}`),
        api.get(`/portfolio/?search=${encodeURIComponent(query)}`)
      ]);

      // Process successful responses
      if (usersResponse.status === 'fulfilled') {
        const userData = usersResponse.value.data;
        // Handle both single result and array results
        if (Array.isArray(userData)) {
          results.users = userData;
        } else if (userData && typeof userData === 'object') {
          results.users = [userData];
        } else if (userData && userData.results) {
          results.users = userData.results;
        } else {
          results.users = [];
        }
        console.log('👥 Users found:', results.users.length);
      } else {
        console.warn('⚠️ User search failed:', usersResponse.reason);
        results.users = [];
      }

      if (freelancersResponse.status === 'fulfilled') {
        const freelancerData = freelancersResponse.value.data;
        let freelancers = [];
        if (Array.isArray(freelancerData)) {
          freelancers = freelancerData;
        } else if (freelancerData && freelancerData.results) {
          freelancers = freelancerData.results;
        }
        
        // Filter freelancers by name if we have the query
        if (query && freelancers.length > 0) {
          results.freelancers = freelancers.filter(freelancer => {
            const fullName = `${freelancer.user?.first_name || ''} ${freelancer.user?.last_name || ''}`.toLowerCase();
            const username = freelancer.user?.username?.toLowerCase() || '';
            const title = freelancer.title?.toLowerCase() || '';
            const skills = freelancer.skills?.toLowerCase() || '';
            const queryLower = query.toLowerCase();
            
            return fullName.includes(queryLower) || 
                   username.includes(queryLower) || 
                   title.includes(queryLower) ||
                   skills.includes(queryLower);
          });
        } else {
          results.freelancers = freelancers;
        }
        console.log('💼 Freelancers found:', results.freelancers.length);
      } else {
        console.warn('⚠️ Freelancer search failed:', freelancersResponse.reason);
        results.freelancers = [];
      }

      if (creatorsResponse.status === 'fulfilled') {
        const creatorData = creatorsResponse.value.data;
        let creators = [];
        if (Array.isArray(creatorData)) {
          creators = creatorData;
        } else if (creatorData && creatorData.results) {
          creators = creatorData.results;
        }
        
        // Filter creators by name if we have the query
        if (query && creators.length > 0) {
          results.creators = creators.filter(creator => {
            const fullName = `${creator.user?.first_name || ''} ${creator.user?.last_name || ''}`.toLowerCase();
            const username = creator.user?.username?.toLowerCase() || '';
            const artisticStyle = creator.artistic_style?.toLowerCase() || '';
            const specialization = creator.specialization?.toLowerCase() || '';
            const queryLower = query.toLowerCase();
            
            return fullName.includes(queryLower) || 
                   username.includes(queryLower) || 
                   artisticStyle.includes(queryLower) ||
                   specialization.includes(queryLower);
          });
        } else {
          results.creators = creators;
        }
        console.log('🎨 Creators found:', results.creators.length);
      } else {
        console.warn('⚠️ Creator search failed:', creatorsResponse.reason);
        results.creators = [];
      }

      if (assetsResponse.status === 'fulfilled') {
        const assetData = assetsResponse.value.data;
        if (Array.isArray(assetData)) {
          results.assets = assetData;
        } else if (assetData && assetData.results) {
          results.assets = assetData.results;
        } else {
          results.assets = [];
        }
        console.log('🎭 Assets found:', results.assets.length);
      } else {
        console.warn('⚠️ Asset search failed:', assetsResponse.reason);
        results.assets = [];
      }

      if (servicesResponse.status === 'fulfilled') {
        const serviceData = servicesResponse.value.data;
        if (Array.isArray(serviceData)) {
          results.services = serviceData;
        } else if (serviceData && serviceData.results) {
          results.services = serviceData.results;
        } else {
          results.services = [];
        }
        console.log('⚙️ Services found:', results.services.length);
      } else {
        console.warn('⚠️ Service search failed:', servicesResponse.reason);
        results.services = [];
      }

      if (portfoliosResponse.status === 'fulfilled') {
        const portfolioData = portfoliosResponse.value.data;
        if (Array.isArray(portfolioData)) {
          results.portfolios = portfolioData;
        } else if (portfolioData && portfolioData.results) {
          results.portfolios = portfolioData.results;
        } else {
          results.portfolios = [];
        }
        console.log('📁 Portfolios found:', results.portfolios.length);
      } else {
        console.warn('⚠️ Portfolio search failed:', portfoliosResponse.reason);
        results.portfolios = [];
      }

      // Collections are typically part of assets for now
      results.collections = [];

      console.log('✅ Universal search results:', results);
      return results;
    } catch (error) {
      console.error('❌ Universal search error:', error);
      return {
        users: [],
        freelancers: [],
        creators: [],
        assets: [],
        collections: [],
        services: [],
        portfolios: []
      };
    }
  },

  // Search specific content types
  users: async (query, filters = {}) => {
    try {
      const response = await api.get(`/public-profiles/search/?q=${encodeURIComponent(query)}`);
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('User search failed:', error.response?.data || error.message);
      return [];
    }
  },

  freelancers: async (query, filters = {}) => {
    try {
      // Get all freelancers and filter on frontend
      const response = await api.get(`/freelancer-profiles/`);
      const freelancers = response.data.results || response.data || [];
      
      if (!query) return freelancers;
      
      return freelancers.filter(freelancer => {
        const fullName = `${freelancer.user?.first_name || ''} ${freelancer.user?.last_name || ''}`.toLowerCase();
        const username = freelancer.user?.username?.toLowerCase() || '';
        const title = freelancer.title?.toLowerCase() || '';
        const skills = freelancer.skills?.toLowerCase() || '';
        const queryLower = query.toLowerCase();
        
        return fullName.includes(queryLower) || 
               username.includes(queryLower) || 
               title.includes(queryLower) ||
               skills.includes(queryLower);
      });
    } catch (error) {
      console.error('Freelancer search failed:', error.response?.data || error.message);
      return [];
    }
  },

  creators: async (query, filters = {}) => {
    try {
      // Get all creators and filter on frontend
      const response = await api.get(`/creator-profiles/`);
      const creators = response.data.results || response.data || [];
      
      if (!query) return creators;
      
      return creators.filter(creator => {
        const fullName = `${creator.user?.first_name || ''} ${creator.user?.last_name || ''}`.toLowerCase();
        const username = creator.user?.username?.toLowerCase() || '';
        const artisticStyle = creator.artistic_style?.toLowerCase() || '';
        const specialization = creator.specialization?.toLowerCase() || '';
        const queryLower = query.toLowerCase();
        
        return fullName.includes(queryLower) || 
               username.includes(queryLower) || 
               artisticStyle.includes(queryLower) ||
               specialization.includes(queryLower);
      });
    } catch (error) {
      console.error('Creator search failed:', error.response?.data || error.message);
      return [];
    }
  },

  assets: async (query, filters = {}) => {
    try {
      const response = await api.get(`/creative-assets/?search=${encodeURIComponent(query)}`);
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Asset search failed:', error.response?.data || error.message);
      return [];
    }
  },

  collections: async (query, filters = {}) => {
    try {
      // Collections might be part of assets or have their own endpoint
      const response = await api.get(`/asset-categories/?search=${encodeURIComponent(query)}`);
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Collection search failed:', error.response?.data || error.message);
      return [];
    }
  },

  services: async (query, filters = {}) => {
    try {
      const response = await api.get(`/services/?search=${encodeURIComponent(query)}`);
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Service search failed:', error.response?.data || error.message);
      return [];
    }
  },

  portfolios: async (query, filters = {}) => {
    try {
      const response = await api.get(`/portfolio/?search=${encodeURIComponent(query)}`);
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Portfolio search failed:', error.response?.data || error.message);
      return [];
    }
  },

  // Quick search suggestions (for autocomplete)
  suggestions: async (query) => {
    try {
      // Try follow search first as it's most likely to work
      const response = await api.get(`/follow/search/?q=${encodeURIComponent(query)}`);
      return response.data || [];
    } catch (error) {
      console.error('Search suggestions failed:', error.response?.data || error.message);
      return [];
    }
  },

  // Trending searches
  trending: async () => {
    // For now, return empty array since trending endpoint might not exist
    // TODO: Implement actual trending API call when backend is ready
    // try {
    //   const response = await api.get('search/trending/');
    //   return response.data;
    // } catch (error) {
    //   console.error('Trending search failed:', error.response?.data || error.message);
    //   return [];
    // }
    return [];
  }
};

// Social Media API - Posts, Likes, and Comments
export const postsAPI = {
  // Get all posts with optional filters
  getAll: (params = {}) => api.get('posts/', { params }),
  
  // Get a specific post
  get: (id) => api.get(`posts/${id}/`),
  
  // Get a specific post by ID (alias for get)
  getById: (id) => api.get(`posts/${id}/`),
  
  // Create a new post
  create: (postData) => api.post('posts/', postData),
  
  // Update a post
  update: (id, postData) => api.put(`posts/${id}/`, postData),
  
  // Delete a post
  delete: (id) => api.delete(`posts/${id}/`),
  
  // Like/unlike a post
  like: (id) => api.post(`posts/${id}/like/`),
  
  // Get comments for a post
  getComments: (id) => api.get(`posts/${id}/comments/`),
  
  // Add a comment to a post
  addComment: (id, commentData) => api.post(`posts/${id}/add_comment/`, commentData),
  
  // Increment view count
  incrementView: (id) => api.post(`posts/${id}/increment_view/`),
  
  // Get posts by user
  getByUser: (username) => api.get('posts/', { params: { user: username } }),
  
  // Get posts by category
  getByCategory: (category) => api.get('posts/', { params: { category } }),
  
  // Get posts by tag
  getByTag: (tag) => api.get('posts/', { params: { tag } })
};

export const commentsAPI = {
  // Get all comments
  getAll: () => api.get('comments/'),
  
  // Get a specific comment
  get: (id) => api.get(`comments/${id}/`),
  
  // Create a new comment
  create: (commentData) => api.post('comments/', commentData),
  
  // Update a comment
  update: (id, commentData) => api.put(`comments/${id}/`, commentData),
  
  // Delete a comment
  delete: (id) => api.delete(`comments/${id}/`),
  
  // Like/unlike a comment
  like: (id) => api.post(`comments/${id}/like/`),
  
  // Reply to a comment
  reply: (id, replyData) => api.post(`comments/${id}/reply/`, replyData)
};

export const blogEngagementAPI = {
  // Like/unlike a blog post
  likeBlog: (blogId) => api.post(`blog/${blogId}/like/`),
  
  // Get comments for a blog post
  getBlogComments: (blogId) => api.get(`blog/${blogId}/comments/`),
  
  // Add a comment to a blog post
  addBlogComment: (blogId, commentData) => api.post(`blog/${blogId}/comments/`, commentData),
  
  // Like/unlike a blog comment
  likeBlogComment: (commentId) => api.post(`blog/comments/${commentId}/like/`)
};

export default api;