import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance } from "axios";
import { Request, Response } from "express";
import { generateRefreshToken } from "../utils/auth";

interface RetryConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

// Cookie configuration constants
const ACCESS_TOKEN_COOKIE_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000, // 1 hour
    sameSite: 'strict' as const
};

class AxiosClient {
    private instance: AxiosInstance;
    private req: Request;
    private res: Response;

    constructor(req: Request, res: Response, baseURL?: string) {
        this.req = req;
        this.res = res;

        const resolvedBaseURL = baseURL || process.env.FETCH_URL;
        if (!resolvedBaseURL) {
            throw new Error("No base URL provided and FETCH_URL environment variable is not defined");
        }

        this.instance = axios.create({
            baseURL: resolvedBaseURL,
            timeout: 10000,
        });

        this.initializeInterceptors();
    }

    private initializeInterceptors() {
        // Request interceptor
        this.instance.interceptors.request.use((config: any) => {
            const accessToken = this.req.cookies.accessToken;
            if (accessToken) {
                config.headers = {
                    ...config.headers,
                    Authorization: `Bearer ${accessToken}`
                };
            }
            return config;
        });

        // Response interceptor
        this.instance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as RetryConfig;
                const refreshToken = this.req.cookies.refreshToken;

                if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const { token: newAccessToken } = await generateRefreshToken(refreshToken);
                        this.res.cookie('accessToken', newAccessToken, ACCESS_TOKEN_COOKIE_CONFIG);

                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        }

                        return this.instance(originalRequest);
                    } catch (refreshError) {
                        this.clearAuthCookies();
                        return Promise.reject({
                            status: 401,
                            message: 'Session expired. Please login again.'
                        });
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private clearAuthCookies() {
        this.res.clearCookie('accessToken');
        this.res.clearCookie('refreshToken');
    }

    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.get<T>(url, config);
    }

    public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.post<T>(url, data, config);
    }

    public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.put<T>(url, data, config);
    }

    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.delete<T>(url, config);
    }

    public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.patch<T>(url, data, config);
    }
}

export default AxiosClient;