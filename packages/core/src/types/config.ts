export interface ServiceConfig {
  baseURL: string
  token?: string
  headers?: Record<string, string>
  timeout?: number
  retry?: RetryConfig
  cache?: boolean
  validateResponse?: boolean
  onValidationError?: (
    error: unknown,
    context: {
      endpoint: string
      method: string
      path: string
      request: unknown
      response: unknown
    }
  ) => void
  toast?: {
    success?: (message: string) => void
    error?: (message: string) => void
  }
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
