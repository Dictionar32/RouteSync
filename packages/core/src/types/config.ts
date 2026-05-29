export interface ServiceConfig {
  baseURL: string
  token?: string
  headers?: Record<string, string>
  timeout?: number
  retry?: RetryConfig
  cache?: boolean
}

export interface RetryConfig {
  attempts: number
  delay?: number
  statusCodes?: number[]
}

export interface AuthConfig {
  type: 'bearer' | 'basic' | 'api-key'
  token?: string
  apiKey?: string
  apiKeyHeader?: string
}
