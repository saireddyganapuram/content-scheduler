import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Twitter API
export const twitterAPI = {
  getAuthUrl: (clerkId) => api.get(`/twitter/auth/${clerkId}`),
  getStatus: (clerkId) => api.get(`/twitter/status/${clerkId}`),
};

// Chatbot API
export const chatbotAPI = {
  generateTweet: (prompt) => api.post('/chatbot/generate', { prompt }),
};

// Tweets API
export const tweetsAPI = {
  schedule: (userId, content, scheduledTime) => 
    api.post('/tweets/schedule', { userId, content, scheduledTime }),
  getScheduled: (userId) => api.get(`/tweets/scheduled/${userId}`),
  update: (tweetId, content, scheduledTime) => 
    api.put(`/tweets/${tweetId}`, { content, scheduledTime }),
  delete: (tweetId) => api.delete(`/tweets/${tweetId}`),
};

export default api;