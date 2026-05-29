export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  meta?: PaginationMeta
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number
  to?: number
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
  status?: number
}
