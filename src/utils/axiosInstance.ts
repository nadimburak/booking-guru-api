import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.FETCH_URL,
  withCredentials: true // Important for cookies
});

// Request interceptor - no need to manually set token as it's in cookies
axiosInstance.interceptors.request.use(
  (config) => {
    // Cookies are automatically included via withCredentials
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        await axiosInstance.post('/auth/refresh');
        
        // Retry the original request with new cookies
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Handle refresh failure (redirect to login, etc.)
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;