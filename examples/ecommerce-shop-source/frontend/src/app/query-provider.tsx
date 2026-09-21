'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createClient } from 'routesync';
import { API_URL } from '@/api';
import useAuthStore from '@/lib/stores/auth-store';
import { toast } from 'sonner';

// Initialize RouteSync client globally
const client = createClient({
  baseURL: API_URL,
  toast: {
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg),
  },
});

// Add dynamic authorization header interceptor
client.getInstance().interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Add response interceptor to handle 401 Unauthorized globally and sync auth state
client.getInstance().interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;
    if (data) {
      if (data.user && data.token) {
        useAuthStore.getState().setAuth(data.user, data.token);
      } else if (data.data && data.data.user && data.data.token) {
        useAuthStore.getState().setAuth(data.data.user, data.data.token);
      }
    }
    if (response.config.url?.endsWith('/logout')) {
      useAuthStore.getState().logout();
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error?.status || error?.response?.status;
    // if (status === 401) {
    //   if (typeof window !== 'undefined') {
    //     localStorage.removeItem('auth_token');
    //     localStorage.removeItem('user');
    //     if (!window.location.pathname.includes('/login')) {
    //       window.location.href = '/login';
    //     }
    //   }
    // }
    return Promise.reject(error);
  }
);

interface QueryProviderProps {
  children: ReactNode;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
