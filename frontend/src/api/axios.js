import axios from 'axios';

// One configured axios instance used by the whole app.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says the token is invalid/expired, clear it and go to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthPage = ['/login', '/signup'].includes(window.location.pathname);
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      if (!isAuthPage) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
