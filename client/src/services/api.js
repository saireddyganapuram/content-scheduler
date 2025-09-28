import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Twitter API
export const twitterAPI = {
  getAuthUrl: (clerkId) => api.get(`/twitter/auth/${clerkId}`),
  getStatus: (clerkId) => api.get(`/twitter/status/${clerkId}`),
  disconnect: (clerkId) => api.post(`/twitter/disconnect/${clerkId}`),
};

// Chatbot API
export const chatbotAPI = {
  generateTweet: (prompt, userId, postType = 'static') => 
    api.post('/chatbot/generate', { prompt, userId, postType }),
  generateWithImage: (prompt) => api.post('/chatbot/generate-with-image', { prompt }),
  collectContext: (userId, message) => 
    api.post('/chatbot/collect-context', { userId, message }),
};

// Business API
export const businessAPI = {
  getContext: (userId) => api.get(`/business/${userId}`),
  saveContext: (userId, context) => api.post(`/business/${userId}`, context),
};

// Tweets API
export const tweetsAPI = {
  schedule: (userId, content, scheduledTime, imageUrl = null, hasImage = false, postType = 'static', engagementFeatures = {}) => 
    api.post('/tweets/schedule', { userId, content, scheduledTime, imageUrl, hasImage, postType, engagementFeatures }),
  getScheduled: (userId) => api.get(`/tweets/scheduled/${userId}`),
  update: (tweetId, content, scheduledTime) => 
    api.put(`/tweets/${tweetId}`, { content, scheduledTime }),
  delete: (tweetId) => api.delete(`/tweets/${tweetId}`),
};

export default api;