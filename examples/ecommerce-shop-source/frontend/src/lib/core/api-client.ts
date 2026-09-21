/**
 * API Client with axios - HTTP layer for API communication
 * Using single HTTP client pattern (no duplicate layer)
 */
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { API_URL } from './constants'
import useAuthStore from '../stores/auth-store';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().accessToken
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    // if (error.response?.status === 401) {
    //   // Unauthorized - clear auth data and redirect to login
    //   if (typeof window !== 'undefined') {
    //     localStorage.removeItem('auth_token')
    //     localStorage.removeItem('user')
    //     // Only redirect if not already on login page
    //     if (!window.location.pathname.includes('/login')) {
    //       window.location.href = '/login'
    //     }
    //   }
    // }
    return Promise.reject(error)
  }
)

export default apiClient;

// HTTP Methods
export const Http = {
  /**
   * GET request
   */
  get: async <T>(path: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(path, config)
    return response.data
  },

  /**
   * POST request
   */
  post: async <T>(path: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(path, payload, config)
    return response.data
  },

  /**
   * PUT request
   */
  put: async <T>(path: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<T>(path, payload, config)
    return response.data
  },

  /**
   * PATCH request
   */
  patch: async <T>(path: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<T>(path, payload, config)
    return response.data
  },

  /**
   * DELETE request
   */
  delete: async <T>(path: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(path, config)
    return response.data
  },
}

// Export the axios instance for custom configurations
