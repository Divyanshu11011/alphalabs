import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiOptions {
    method?: RequestMethod;
    body?: any;
    headers?: Record<string, string>;
}

export interface ApiClient {
    request: <T>(endpoint: string, options?: ApiOptions) => Promise<T>;
    get: <T>(endpoint: string, options?: ApiOptions) => Promise<T>;
    post: <T>(endpoint: string, body?: any, options?: ApiOptions) => Promise<T>;
    put: <T>(endpoint: string, body?: any, options?: ApiOptions) => Promise<T>;
    del: <T = void>(endpoint: string, options?: ApiOptions) => Promise<T>;
}

export async function apiRequest<T>(
    endpoint: string,
    token: string | null,
    options: ApiOptions = {}
): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    // Get frontend base URL (for certificate generation and other features)
    const frontendUrl = typeof window !== "undefined" 
        ? `${window.location.protocol}//${window.location.host}`
        : process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

    const config: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Frontend-URL": frontendUrl,  // Explicitly send frontend URL
            ...headers,
        },
    };

    if (token) {
        (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    if (body !== undefined) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API request failed: ${response.statusText}`);
    }

    return response.json();
}

export const useApiClient = (): ApiClient => {
    const { getToken } = useAuth();

    const request = useCallback(async <T,>(endpoint: string, options: ApiOptions = {}) => {
        const token = await getToken();
        return apiRequest<T>(endpoint, token, options);
    }, [getToken]);

    const get = useCallback(<T,>(endpoint: string, options: ApiOptions = {}) => {
        return request<T>(endpoint, { ...options, method: "GET" });
    }, [request]);

    const post = useCallback(<T,>(endpoint: string, body?: any, options: ApiOptions = {}) => {
        return request<T>(endpoint, { ...options, method: "POST", body });
    }, [request]);

    const put = useCallback(<T,>(endpoint: string, body?: any, options: ApiOptions = {}) => {
        return request<T>(endpoint, { ...options, method: "PUT", body });
    }, [request]);

    const del = useCallback(<T,>(endpoint: string, options: ApiOptions = {}) => {
        return request<T>(endpoint, { ...options, method: "DELETE" });
    }, [request]);

    return { request, get, post, put, del };
};

export const useApi = () => {
    const client = useApiClient();
    return { request: client.request };
};
