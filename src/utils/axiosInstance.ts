import axios, {
    AxiosError,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosInstance,
    InternalAxiosRequestConfig,
    AxiosHeaders
} from "axios";
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
    private readonly instance: AxiosInstance;

    constructor(
        private readonly req: Request,
        private readonly res: Response,
        baseURL: string = process.env.FETCH_URL || ''
    ) {
        if (!baseURL) {
            throw new Error("No base URL provided and FETCH_URL environment variable is not defined");
        }

        this.instance = axios.create({
            baseURL,
            timeout: 10000,
        });

        this.initializeInterceptors();
    }

    private initializeInterceptors(): void {
        // Request interceptor
        this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
            const token = this.req.cookies.token;
            if (token) {
                // Create new config with proper headers typing
                return {
                    ...config,
                    headers: new AxiosHeaders({
                        ...config.headers,
                        Authorization: `Bearer ${token}`
                    })
                };
            } else {
                return Promise.reject({
                    status: 401,
                    message: 'Session expired. Please login again.'
                });
            }
            return config;
        });

        // Response interceptor
        this.instance.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as RetryConfig;
                const refreshToken = await this.req.cookies.refreshToken;
                console.log("refreshToken", refreshToken, error.response?.status, originalRequest._retry)

                if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const authResponse = await generateRefreshToken(refreshToken);

                        // Verify the responses contain the expected properties
                        if (!authResponse?.token) {
                            throw new Error('Authentication failed: Invalid token response');
                        }

                        const token = authResponse?.token

                        this.res.cookie('token', token, ACCESS_TOKEN_COOKIE_CONFIG);

                        // Create new config with proper headers for retry
                        const retryConfig: InternalAxiosRequestConfig = {
                            ...originalRequest,
                            headers: new AxiosHeaders({
                                ...originalRequest.headers,
                                Authorization: `Bearer ${token}`
                            })
                        };

                        return this.instance(retryConfig);
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

    private clearAuthCookies(): void {
        this.res.clearCookie('token');
        this.res.clearCookie('refreshToken');
    }

    public get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.get<T>(url, config);
    }

    public post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.post<T>(url, data, config);
    }

    public put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.put<T>(url, data, config);
    }

    public delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.delete<T>(url, config);
    }

    public patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.patch<T>(url, data, config);
    }
}

export default AxiosClient;