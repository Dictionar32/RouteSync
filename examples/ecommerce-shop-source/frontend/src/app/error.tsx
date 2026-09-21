/**
 * Global Error Boundary
 * Handles errors in the application
 */
'use client'

import { useEffect } from 'react'
import {
  ErrorContainer, ErrorContent, ErrorTitle, ErrorMessage, ErrorDigest, TryAgainBtn
} from './error.styles'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <ErrorContainer>
      <ErrorContent>
        <ErrorTitle>Something went wrong!</ErrorTitle>
        <ErrorMessage>
          {error.message || 'An unexpected error occurred'}
        </ErrorMessage>
        {error.digest && (
          <ErrorDigest>
            Error ID: {error.digest}
          </ErrorDigest>
        )}
      </ErrorContent>
      <TryAgainBtn onClick={() => reset()}>
        Try again
      </TryAgainBtn>
    </ErrorContainer>
  )
}
