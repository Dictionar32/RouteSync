import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ServiceConfig } from '../types/config'

export class HttpClient {
  private client: AxiosInstance

  constructor(config: ServiceConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers ?? {})
      }
    })

    if (config.token) {
      this.setToken(config.token)
    }

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: any) => {
        const message =
          error.response?.data?.message ??
          error.message ??
          'Unknown error'

        return Promise.reject({
          success: false,
          message,
          status: error.response?.status,
          errors: error.response?.data?.errors
        })
      }
    )
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  removeToken() {
    delete this.client.defaults.headers.common['Authorization']
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, body, config)
    return response.data
  }

  async put<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, body, config)
    return response.data
  }

  async patch<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, body, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  getInstance(): AxiosInstance {
    return this.client
  }
}
