import { ApiError } from '@routesync/sdk'

export interface UseFormSetError<TFieldValues extends Record<string, unknown>> {
  (name: keyof TFieldValues | string, error: { type: string; message?: string }): void
}

/**
 * Parses an unknown error and safely pipes 422 Unprocessable Entity
 * validation messages to react-hook-form's setError.
 * 
 * @param error - The error thrown by a RouteSync mutation
 * @param setError - The `setError` function destructured from `useForm()`
 */
export function setFormErrors<TFieldValues extends Record<string, unknown>>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>
) {
  if (error && typeof error === 'object' && 'status' in error && error.status === 422) {
    const apiError = error as ApiError
    const errors = apiError.errors
    if (errors && typeof errors === 'object') {
      for (const [field, messages] of Object.entries(errors)) {
        if (Array.isArray(messages) && messages.length > 0) {
          setError(field as keyof TFieldValues, { type: 'server', message: String(messages[0]) })
        } else if (typeof messages === 'string') {
          setError(field as keyof TFieldValues, { type: 'server', message: messages })
        }
      }
    }
  }
}
