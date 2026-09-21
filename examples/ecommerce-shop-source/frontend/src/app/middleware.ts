/**
 * Next.js Middleware
 * Auth protection is handled at the page level via useAuthStore.
 * Middleware is kept minimal to avoid SSR/cookie mismatch issues.
 */
import { NextResponse } from 'next/server'

export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
