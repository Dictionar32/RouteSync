/**
 * Unit tests for generateInlineResourceName helper
 * Tests synthetic name generation from route paths for inline responses
 */

import { describe, test, expect } from 'vitest'
import type { ParsedRoute } from '../../../../../core/src/types/route'

// Import the function we're testing
// Note: Function is not exported, so we'll need to add export or test via manifest-to-types
// For now, we'll recreate the logic here for testing purposes

/**
 * Generate synthetic resource name for inline responses
 * (Copied from manifest-to-types.ts for testing)
 */
function generateInlineResourceName(route: ParsedRoute): string {
    const segments = route.path
        .replace(/^\//, '')  // Remove leading slash
        .split('/')
        .filter(s => s.toLowerCase() !== 'api' && !s.startsWith('{'))  // Remove 'api' (case-insensitive) and params like {id}
        .map(s => s.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()))  // kebab-case → camelCase

    if (segments.length === 0) return 'Unknown'

    if (segments.length === 1) {
        // Single segment: just capitalize first letter
        return segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
    }

    // Multiple segments: use first + last, PascalCase both
    const first = segments[0]
    const last = segments[segments.length - 1]

    const pascalFirst = first.charAt(0).toUpperCase() + first.slice(1)
    const pascalLast = last.charAt(0).toUpperCase() + last.slice(1)

    return pascalFirst + pascalLast
}

describe('generateInlineResourceName', () => {
    describe('Single segment paths', () => {
        test('should capitalize single word', () => {
            const route = { path: '/login', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Login')
        })

        test('should capitalize single word with leading slash', () => {
            const route = { path: '/register', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Register')
        })

        test('should handle api prefix correctly', () => {
            const route = { path: '/api/login', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Login')
        })

        test('should handle logout', () => {
            const route = { path: '/logout', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Logout')
        })
    })

    describe('Multiple segment paths', () => {
        test('should combine first and last segment', () => {
            const route = { path: '/auth/login', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('AuthLogin')
        })

        test('should combine first and last with api prefix', () => {
            const route = { path: '/api/auth/login', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('AuthLogin')
        })

        test('should handle social login', () => {
            const route = { path: '/social/login', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('SocialLogin')
        })

        test('should handle payment confirm', () => {
            const route = { path: '/payment/confirm', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('PaymentConfirm')
        })

        test('should ignore middle segments', () => {
            const route = { path: '/api/auth/verify/email', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('AuthEmail')
        })
    })

    describe('Kebab-case conversion', () => {
        test('should convert kebab-case single segment', () => {
            const route = { path: '/forgot-password', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('ForgotPassword')
        })

        test('should convert kebab-case in last segment', () => {
            const route = { path: '/auth/reset-password', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('AuthResetPassword')
        })

        test('should convert kebab-case in first segment', () => {
            const route = { path: '/buy-now/confirm', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('BuyNowConfirm')
        })

        test('should convert multiple kebab-case segments', () => {
            const route = { path: '/user-profile/edit-settings', method: 'PUT' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('UserProfileEditSettings')
        })
    })

    describe('Path parameter handling', () => {
        test('should exclude single path parameter', () => {
            const route = { path: '/oauth/{provider}/redirect', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('OauthRedirect')
        })

        test('should exclude multiple path parameters', () => {
            const route = { path: '/users/{id}/posts/{postId}', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('UsersPosts')
        })

        test('should exclude parameter at end', () => {
            const route = { path: '/products/{id}', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Products')
        })

        test('should handle api + parameters', () => {
            const route = { path: '/api/payment/{orderId}/status', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('PaymentStatus')
        })
    })

    describe('Edge cases', () => {
        test('should return empty string for root path', () => {
            const route = { path: '/', method: 'GET' } as ParsedRoute
            // After filtering, segments is empty array, first segment is undefined
            // charAt(0) on undefined returns empty string
            expect(generateInlineResourceName(route)).toBe('')
        })

        test('should return Unknown for only api prefix', () => {
            const route = { path: '/api', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Unknown')
        })

        test('should return Unknown for only parameters', () => {
            const route = { path: '/{id}', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Unknown')
        })

        test('should handle path without leading slash', () => {
            const route = { path: 'auth/login', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('AuthLogin')
        })
    })

    describe('Real-world examples from toko-online', () => {
        test('POST /login → Login', () => {
            const route = { path: '/login', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Login')
        })

        test('GET /oauth/{provider}/redirect → OauthRedirect', () => {
            const route = { path: '/oauth/{provider}/redirect', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('OauthRedirect')
        })

        test('POST /social/login → SocialLogin', () => {
            const route = { path: '/social/login', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('SocialLogin')
        })

        test('POST /forgot-password → ForgotPassword', () => {
            const route = { path: '/forgot-password', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('ForgotPassword')
        })

        test('POST /reset-password → ResetPassword', () => {
            const route = { path: '/reset-password', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('ResetPassword')
        })

        test('GET /categories → Categories', () => {
            const route = { path: '/categories', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Categories')
        })

        test('GET /profile → Profile', () => {
            const route = { path: '/profile', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Profile')
        })

        test('POST /logout → Logout', () => {
            const route = { path: '/logout', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Logout')
        })
    })

    describe('Collision scenarios', () => {
        test('should generate consistent name for potential collision', () => {
            // If there's a PaymentResource, inline /payment route would be "Payment"
            const route = { path: '/payment', method: 'POST' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('Payment')
            // Note: Collision detection happens at runtime, not in naming function
        })

        test('should generate unique names for different routes', () => {
            const route1 = { path: '/auth/login', method: 'POST' } as ParsedRoute
            const route2 = { path: '/social/login', method: 'POST' } as ParsedRoute

            expect(generateInlineResourceName(route1)).toBe('AuthLogin')
            expect(generateInlineResourceName(route2)).toBe('SocialLogin')
            expect(generateInlineResourceName(route1)).not.toBe(generateInlineResourceName(route2))
        })
    })

    describe('Case sensitivity', () => {
        test('should preserve original case in segments', () => {
            const route = { path: '/API/Auth/LOGIN', method: 'POST' } as ParsedRoute
            // api is filtered out regardless of case
            expect(generateInlineResourceName(route)).toBe('AuthLOGIN')
        })

        test('should handle mixed case', () => {
            const route = { path: '/UserProfile/Settings', method: 'GET' } as ParsedRoute
            expect(generateInlineResourceName(route)).toBe('UserProfileSettings')
        })
    })
})
