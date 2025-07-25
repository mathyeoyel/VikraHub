import axios from "axios";
import { getAccessToken, getRefreshToken, removeTokens, saveToken } from "./auth";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://vikrahub.onrender.com/api/", // Django API base URL
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
  
  // Project-related endpoints
  getMyProjects: () => api.get("projects/my-projects/"),
  createProject: (data) => api.post("projects/", data),
  updateProject: (id, data) => api.patch(`projects/${id}/`, data),
  deleteProject: (id) => api.delete(`projects/${id}/`),
  getProjectApplications: (projectId) => api.get(`projects/${projectId}/applications/`),
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
  getUnreadCount: () => {
    console.warn('Messages unread count endpoint not implemented on backend - using static response');
    return Promise.resolve({ data: { count: 0 } }); // Set to 0 instead of random
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get("notifications/"),
  markAsRead: (id) => api.patch(`notifications/${id}/mark_read/`),
  markAllAsRead: () => api.post("notifications/mark_all_read/"),
  delete: (id) => api.delete(`notifications/${id}/`),
  getUnreadCount: () => {
    console.warn('Notifications unread count endpoint not implemented on backend - using static response');
    return Promise.resolve({ data: { count: 0 } }); // Set to 0 instead of random
  },
  updateSettings: (data) => api.patch("notifications/settings/", data),
};

// Follow System API
export const followAPI = {
  follow: (user_id) => api.post("follow/follow/", { user_id }),
  unfollow: (user_id) => api.post(`follow/unfollow/${user_id}/`),
  getMyStats: () => api.get("follow/my-stats/"),
  getUserStats: (user_id) => api.get(`follow/stats/${user_id}/`),
  getFollowers: (user_id) => api.get(`follow/followers/${user_id}/`),
  getFollowing: (user_id) => api.get(`follow/following/${user_id}/`),
  getNotifications: () => api.get("follow/notifications/"),
  markNotificationRead: (notification_id) => api.post(`follow/notifications/${notification_id}/read/`),
  markAllNotificationsRead: () => api.post("follow/notifications/read-all/"),
  getSuggestions: () => api.get("follow/suggestions/"),
  searchUsers: (query) => api.get("follow/search/", { params: { q: query } }),
};

// Messaging API
export const messagingAPI = {
  getConversations: () => api.get("messaging/conversations/"),
  createConversation: (participant_username, initial_message = null) => 
    api.post("messaging/conversations/", { participant_username, initial_message }),
  getConversation: (conversation_id) => api.get(`messaging/conversations/${conversation_id}/`),
  getMessages: (conversation_id) => api.get(`messaging/conversations/${conversation_id}/messages/`),
  sendMessage: (conversation_id, content, message_type = 'text') => 
    api.post(`messaging/conversations/${conversation_id}/messages/`, { content, message_type }),
  markConversationRead: (conversation_id) => api.post(`messaging/conversations/${conversation_id}/mark-read/`),
  startTyping: (conversation_id) => api.post(`messaging/conversations/${conversation_id}/typing/start/`),
  stopTyping: (conversation_id) => api.post(`messaging/conversations/${conversation_id}/typing/stop/`),
  getUnreadCount: () => api.get("messaging/unread-count/"),
  getMessage: (message_id) => api.get(`messaging/messages/${message_id}/`),
};

export default api;