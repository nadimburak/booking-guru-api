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

const DEFAULT_TIMEOUT = 10000;
const UNAUTHORIZED_STATUS = 401;
const AUTH_ERROR_MESSAGE = 'Session expired. Please login again.';

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
            timeout: DEFAULT_TIMEOUT,
        });

        this.initializeInterceptors();
    }

    private initializeInterceptors(): void {
        // Request interceptor
        this.instance.interceptors.request.use(this.handleRequest.bind(this));
        
        // Response interceptor
        this.instance.interceptors.response.use(
            (response: AxiosResponse) => response,
            this.handleResponseError.bind(this)
        );
    }

    private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
        const token = this.req.cookies.token;
        if (!token) {
            throw {
                status: UNAUTHORIZED_STATUS,
                message: AUTH_ERROR_MESSAGE
            };
        }

        return {
            ...config,
            headers: new AxiosHeaders({
                ...config.headers,
                Authorization: `Bearer ${token}`
            })
        };
    }

    private async handleResponseError(error: AxiosError): Promise<AxiosResponse> {
        const originalRequest = error.config as RetryConfig;
        const refreshToken = this.req.cookies.refreshToken;

        if (error.response?.status === UNAUTHORIZED_STATUS && 
            refreshToken && 
            !originalRequest._retry) {
            return this.handleTokenRefresh(originalRequest);
        }

        return Promise.reject(error);
    }

    private async handleTokenRefresh(originalRequest: RetryConfig): Promise<AxiosResponse> {
        originalRequest._retry = true;
        const refreshToken = this.req.cookies.refreshToken;

        try {
            const authResponse = await generateRefreshToken(refreshToken);

            if (!authResponse?.token) {
                throw new Error('Authentication failed: Invalid token response');
            }

            this.res.cookie('token', authResponse.token, ACCESS_TOKEN_COOKIE_CONFIG);

            const retryConfig: InternalAxiosRequestConfig = {
                ...originalRequest,
                headers: new AxiosHeaders({
                    ...originalRequest.headers,
                    Authorization: `Bearer ${authResponse.token}`
                })
            };

            return this.instance(retryConfig);
        } catch (refreshError) {
            this.clearAuthCookies();
            return Promise.reject({
                status: UNAUTHORIZED_STATUS,
                message: AUTH_ERROR_MESSAGE
            });
        }
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