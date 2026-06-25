import axios from 'axios';

// Set base URL from environment or fallback to the production Railway backend
const API_URL = import.meta.env.VITE_API_URL || 'https://to-do-app-production-ab9c.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle automatic Access Token Refreshing on 401 Expiry errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and the request hasn't been retried already
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      // If token expired specifically, handle rotation
      const isExpired = error.response.data && error.response.data.code === 'TOKEN_EXPIRED';
      const refreshToken = localStorage.getItem('refreshToken');

      if (isExpired && refreshToken) {
        if (isRefreshing) {
          // If a refresh is already in progress, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Call the refresh token endpoint directly (not using the main api instance to avoid interceptor loop)
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            token: refreshToken,
          });

          if (response.data && response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

            processQueue(null, accessToken);
            isRefreshing = false;

            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Clear credentials and force redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login?session_expired=true';
          
          return Promise.reject(refreshError);
        }
      } else {
        // If not token expiration but generic 401, clear tokens and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
