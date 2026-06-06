import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ServiceConfig } from '../types/config'
import { snakeCaseKeys, camelCaseKeys } from '../utils'

export class HttpClient {
  private client: AxiosInstance
  public readonly config: ServiceConfig

  constructor(config: ServiceConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(config.headers ?? {})
      }
    })

    if (config.token) {
      this.setToken(config.token)
    }

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (config.data && !(config.data instanceof FormData)) {
          config.data = snakeCaseKeys(config.data)
        }
        if (config.params) {
          config.params = snakeCaseKeys(config.params)
        }
        return config
      }
    )

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
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

  private isFileOrBlob(val: any): boolean {
    return (
      (typeof File !== 'undefined' && val instanceof File) ||
      (typeof Blob !== 'undefined' && val instanceof Blob)
    )
  }

  private hasFiles(body: any): boolean {
    if (!body || typeof body !== 'object') return false
    
    if (this.isFileOrBlob(body)) return true
    
    if (Array.isArray(body)) {
      return body.some(item => this.hasFiles(item))
    }
    
    for (const key of Object.keys(body)) {
      if (this.hasFiles(body[key])) return true
    }
    
    return false
  }

  private toFormData(body: any, formData = new FormData(), parentKey = ''): FormData {
    if (body === null || body === undefined) return formData

    if (this.isFileOrBlob(body)) {
      formData.append(parentKey, body)
    } else if (Array.isArray(body)) {
      body.forEach((item, index) => {
        this.toFormData(item, formData, `${parentKey}[${index}]`)
      })
    } else if (typeof body === 'object') {
      Object.keys(body).forEach((key) => {
        const propName = parentKey ? `${parentKey}[${key}]` : key
        this.toFormData(body[key], formData, propName)
      })
    } else {
      formData.append(parentKey, String(body))
    }

    return formData
  }

  private prepareRequest(body?: any, config?: AxiosRequestConfig): { processedBody: any, processedConfig: AxiosRequestConfig | undefined } {
    let finalBody = body;
    if (finalBody && typeof finalBody === 'object' && !(finalBody instanceof FormData)) {
      finalBody = snakeCaseKeys(finalBody);
    }

    if (!finalBody || !this.hasFiles(finalBody)) {
      return { processedBody: finalBody, processedConfig: config }
    }

    const formData = this.toFormData(finalBody)
    const newConfig = { ...config }
    
    if (!newConfig.headers) {
      newConfig.headers = {}
    }
    
    // Let browser set the boundary for multipart/form-data automatically
    newConfig.headers['Content-Type'] = 'multipart/form-data'
    
    return { processedBody: formData, processedConfig: newConfig }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    const { processedBody, processedConfig } = this.prepareRequest(body, config)
    const response = await this.client.post<T>(url, processedBody, processedConfig)
    return response.data
  }

  async put<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    const { processedBody, processedConfig } = this.prepareRequest(body, config)
    const response = await this.client.put<T>(url, processedBody, processedConfig)
    return response.data
  }

  async patch<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    const { processedBody, processedConfig } = this.prepareRequest(body, config)
    const response = await this.client.patch<T>(url, processedBody, processedConfig)
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
