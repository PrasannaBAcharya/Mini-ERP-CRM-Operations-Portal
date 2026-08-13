import axios from 'axios';

// VITE_API_URL must include the /api path, e.g.:
//   https://your-service.onrender.com/api   (production)
//   http://localhost:3001/api               (local dev)
const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://mini-erp-crm-operations-portal-1-vw5d.onrender.com/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15s — gives Render's free tier time to wake up
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force-redirect on 401 for authenticated routes, not on the login call itself
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login')
    ) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
