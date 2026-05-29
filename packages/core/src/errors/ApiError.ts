export class ApiError extends Error {
  public readonly status?: number
  public readonly errors?: Record<string, string[]>
  public readonly success = false

  constructor(
    message: string,
    status?: number,
    errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  isUnauthorized(): boolean {
    return this.status === 401
  }

  isForbidden(): boolean {
    return this.status === 403
  }

  isNotFound(): boolean {
    return this.status === 404
  }

  isValidationError(): boolean {
    return this.status === 422
  }

  isServerError(): boolean {
    return (this.status ?? 0) >= 500
  }

  getFirstError(field: string): string | undefined {
    return this.errors?.[field]?.[0]
  }

  getAllErrors(): string[] {
    if (!this.errors) return []
    return Object.values(this.errors).flat()
  }
}
