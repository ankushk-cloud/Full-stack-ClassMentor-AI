import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests; let browser set Content-Type for FormData (e.g. voice)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle 401 - logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (name) => api.put('/auth/profile', { name }),
  deleteAccount: () => api.delete('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Chats
export const chatAPI = {
  createChat: () => api.post('/chats'),
  getChats: (search) => api.get('/chats', { params: search ? { search } : {} }),
  getChat: (id) => api.get(`/chats/${id}`),
  sendMessage: (chatId, content) => api.post(`/chats/${chatId}/messages`, { content }),
  deleteChat: (id) => api.delete(`/chats/${id}`),
};

// Voice (speech-to-text)
export const voiceAPI = {
  transcribe: (formData) =>
    api.post('/voice/transcribe', formData, {
      timeout: 30000,
    }),
};

export default api;
