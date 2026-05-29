export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
  signal?: AbortSignal
}

export interface RouteDefinition {
  method: HttpMethod
  path: string
  auth?: boolean
  body?: Record<string, any>
  params?: Record<string, any>
  query?: Record<string, any>
}

export interface ApiDefinition {
  [group: string]: {
    [action: string]: RouteDefinition
  }
}
