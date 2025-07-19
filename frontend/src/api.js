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
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    
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
    
    if (error.response?.status === 401 && !originalRequest._retry) {
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
};

export default api;