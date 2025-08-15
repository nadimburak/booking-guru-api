import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosRequestHeaders } from "axios";
import { Request, Response } from "express";
import { generateRefreshToken } from "../utils/auth";

const modelTitle = "City";

// Define a custom interface to extend AxiosRequestConfig with _retry property
interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export const getCities = async (req: Request, res: Response) => {
  // Create axios instance with interceptors
  const apiClient = axios.create({
    baseURL: process.env.FETCH_URL,
    timeout: 10000, // 10 seconds timeout
  });

  // Get tokens from cookies
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // Request interceptor to add token
  apiClient.interceptors.request.use((config) => {
    if (accessToken) {
      config.headers = config.headers || {} as AxiosRequestHeaders;
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  // Response interceptor to handle token refresh
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryConfig;

      // Check if error is 401 and we have a refresh token
      if (error.response?.status === 401 && refreshToken && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true; // Mark this request as retried

        try {
          // Attempt to refresh tokens
          const { token: newAccessToken } = await generateRefreshToken(refreshToken);

          // Update the access token in cookies
          res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000, // 1 hour
            sameSite: 'strict'
          });

          // Update the Authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          // Retry the original request with new token
          return apiClient(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear cookies and send 401
          res.clearCookie('accessToken');
          res.clearCookie('refreshToken');
          return Promise.reject({
            status: 401,
            message: 'Session expired. Please login again.'
          });
        }
      }

      return Promise.reject(error);
    }
  );

  try {
    const response = await apiClient.get(`/pollution?country=FR&page=1&limit=50`);

    const data = {
      cities: response.data,
      status: 'success'
    };

    res.status(200).json(data);
  } catch (error: any) {
    console.error(`Error fetching ${modelTitle}:`, error);

    const status = error.response?.status || error.status || 500;
    const message = error.response?.data?.message || error.message || `Error ${modelTitle}`;

    res.status(status).json({
      status: 'error',
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};