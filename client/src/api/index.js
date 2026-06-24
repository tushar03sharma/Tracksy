import axios from 'axios';

// Central axios instance — all requests go through here
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Keep Render free tier awake — ping every 10 min to prevent cold start during Google OAuth
const pingServer = () => axios.get(`${import.meta.env.VITE_API_URL}/health`).catch(() => {});
pingServer(); // ping immediately on app load
setInterval(pingServer, 10 * 60 * 1000); // then every 10 minutes

// Request interceptor — auto-attaches JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — on 401, clear storage and redirect to login
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
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Jobs 
export const jobsAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getOne: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.patch(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  getStats: () => api.get('/jobs/stats'),
};

export default api;
