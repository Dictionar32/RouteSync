import { InternalAxiosRequestConfig } from 'axios'
import { TokenManager } from './TokenManager'

export class AuthMiddleware {
  constructor(private tokenManager: TokenManager) {}

  inject(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const token = this.tokenManager.get()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  }

  getAuthHeader(): Record<string, string> {
    const token = this.tokenManager.get()
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  }
}
