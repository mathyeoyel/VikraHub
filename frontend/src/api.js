import axios from "axios";
import { getAccessToken, getRefreshToken, removeTokens, saveToken } from "./auth";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://api.vikrahub.com/api/", // Django API base URL
  headers: {
    "Content-Type": "application/json",
  },   
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  config => {
    // Skip authentication for public routes
    const publicRoutes = [
      'public-profiles/',
      'creative-assets/', // Creative assets should be publicly viewable
      'freelancer-profiles/' // Freelancer profiles should be publicly viewable
    ];
    
    const isPublicRoute = publicRoutes.some(route => config.url.includes(route));
    
    if (!isPublicRoute) {
      const token = getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For FormData uploads, let the browser set the Content-Type automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Skip token refresh for public routes
    const publicRoutes = [
      'public-profiles/',
      'creative-assets/'
    ];
    
    const isPublicRoute = publicRoutes.some(route => originalRequest.url.includes(route));
    
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
  getAll: () => api.get("portfolio/"),
  create: (data) => api.post("portfolio/", data),
  update: (id, data) => api.patch(`portfolio/${id}/`, data),
  delete: (id) => api.delete(`portfolio/${id}/`),
};

export const blogAPI = {
  getAll: () => api.get("blog/"),
  getMyPosts: () => api.get("blog/my_posts/"),
  create: (data) => api.post("blog/", data),
  update: (id, data) => api.patch(`blog/${id}/`, data),
  delete: (id) => api.delete(`blog/${id}/`),
};

export const notificationAPI = {
  getAll: () => api.get("notifications/"),
  markAsRead: (id) => api.post(`notifications/${id}/mark_read/`),
  create: (data) => api.post("notifications/", data),
};

export const publicProfileAPI = {
  getAll: () => api.get("public-profiles/"),
  getByUsername: (username) => api.get(`public-profiles/${username}/`),
  getById: (userId) => api.get(`public-profiles/?user__id=${userId}`),
  search: (params) => api.get("public-profiles/search/", { params }),
};

// Creative Assets Marketplace API
export const assetAPI = {
  // Assets
  getAll: (params) => api.get("creative-assets/", { params }),
  getById: (id) => api.get(`creative-assets/${id}/`),
  create: (data) => api.post("creative-assets/", data),
  update: (id, data) => api.patch(`creative-assets/${id}/`, data),
  delete: (id) => api.delete(`creative-assets/${id}/`),
  getMyAssets: () => api.get("creative-assets/my_assets/"),
  getTrending: (params) => api.get("creative-assets/trending/", { params }),
  getRecommended: (params) => api.get("creative-assets/recommended/", { params }),
  purchase: (id) => api.post(`creative-assets/${id}/purchase/`),
  download: (id) => api.post(`creative-assets/${id}/download/`),
  getSellerStats: () => api.get("creative-assets/seller_stats/"),
  
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

// Messages API
export const messagesAPI = {
  getConversations: () => api.get("conversations/"),
  getMessages: (conversationId) => api.get(`conversations/${conversationId}/messages/`),
  sendMessage: (data) => api.post("messages/", data),
  markAsRead: (conversationId) => api.patch(`conversations/${conversationId}/mark_read/`),
  createConversation: (data) => api.post("conversations/", data),
  deleteConversation: (id) => api.delete(`conversations/${id}/`),
  getUnreadCount: () => api.get("messaging/unread-count/"),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get("notifications/"),
  markAsRead: (id) => api.patch(`notifications/${id}/mark_read/`),
  markAllAsRead: () => api.post("notifications/mark_all_read/"),
  delete: (id) => api.delete(`notifications/${id}/`),
  getUnreadCount: () => api.get("unread-notifications-count/"),
  updateSettings: (data) => api.patch("notifications/settings/", data),
};

// Follow System API
export const followAPI = {
  // Core follow functions - follow and unfollow both expect user_id
  follow: async (userId) => {
    try {
      const response = await api.post("follow/follow/", { user_id: userId });
      return response.data;
    } catch (error) {
      console.error('Follow request failed:', error.response?.data || error.message);
      throw error;
    }
  },
  unfollow: async (userId) => {
    try {
      const response = await api.post(`follow/unfollow/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Unfollow request failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Enhanced follow functions with profile refresh
  followWithRefresh: async (userId, username) => {
    try {
      const followResponse = await api.post("follow/follow/", { user_id: userId });
      
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
        followResult: followResponse.data,
        updatedProfile: updatedProfile
      };
    } catch (error) {
      console.error('Follow with refresh failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  unfollowWithRefresh: async (userId, username) => {
    try {
      const unfollowResponse = await api.post(`follow/unfollow/${userId}/`);
      
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
        unfollowResult: unfollowResponse.data,
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
  getFollowStats: (user_id) => api.get(`follow/stats/${user_id}/`), // Alias for getUserStats
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
  createConversation: async (participant_username, initial_message = null) => {
    try {
      if (!participant_username) {
        throw new Error('Participant username is required');
      }
      
      const response = await api.post("messaging/conversations/create/", { 
        participant_username, 
        initial_message 
      });
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
  
  // Send message with enhanced validation
  sendMessage: async (conversation_id, content, message_type = 'text') => {
    try {
      if (!conversation_id) {
        throw new Error('Conversation ID is required');
      }
      if (!content || !content.trim()) {
        throw new Error('Message content cannot be empty');
      }
      
      const response = await api.post(`messaging/conversations/${conversation_id}/messages/`, { 
        content: content.trim(), 
        message_type 
      });
      console.log('✅ Message sent successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to send message:', error.response?.data || error.message);
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

export default api;