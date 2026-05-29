import { ApiError } from './ApiError'

export class ErrorHandler {
  static handle(error: any): never {
    if (error instanceof ApiError) throw error

    // Axios error shape
    if (error?.response) {
      throw new ApiError(
        error.response.data?.message ?? 'Request failed',
        error.response.status,
        error.response.data?.errors
      )
    }

    if (error?.request) {
      throw new ApiError('No response received from server')
    }

    throw new ApiError(error?.message ?? 'Unknown error occurred')
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
  }
}
