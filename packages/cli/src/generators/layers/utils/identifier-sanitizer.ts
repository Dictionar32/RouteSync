/**
 * Identifier Sanitization Utilities
 * 
 * Fixes invalid TypeScript identifiers in generated code:
 * - "forgot-password" → "ForgotPassword" 
 * - "oauth_provider" → "OauthProvider"
 * - "api-v2" → "ApiV2"
 */

export class IdentifierSanitizer {
    /**
     * Sanitize string untuk jadi valid JavaScript identifier
     */
    static sanitizeIdentifier(name: string): string {
        if (!name || typeof name !== 'string') {
            return 'Unknown'
        }

        return name
            .replace(/[-\s]+/g, '_')           // hyphen/space → underscore
            .replace(/[^a-zA-Z0-9_$]/g, '')    // remove invalid chars (keep $ untuk edge cases)
            .replace(/^[0-9]/, '_$&')          // prefix numbers dengan underscore
            .replace(/_{2,}/g, '_')            // collapse multiple underscores
            .replace(/^_+|_+$/g, '')           // trim leading/trailing underscores
            || 'Unknown'                       // fallback jika hasil kosong
    }

    /**
     * Convert to PascalCase untuk type names
     */
    static toPascalCase(name: string): string {
        const sanitized = this.sanitizeIdentifier(name)

        return sanitized
            .split('_')
            .filter(word => word.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('')
    }

    /**
     * Convert to camelCase untuk variable names
     */
    static toCamelCase(name: string): string {
        const sanitized = this.sanitizeIdentifier(name)
        const words = sanitized.split('_').filter(word => word.length > 0)

        if (words.length === 0) return 'unknown'

        const first = words[0].toLowerCase()
        const rest = words.slice(1).map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )

        return first + rest.join('')
    }

    /**
     * Convert to CONSTANT_CASE untuk constants
     */
    static toConstantCase(name: string): string {
        const sanitized = this.sanitizeIdentifier(name)
        return sanitized.toUpperCase()
    }

    /**
     * Extract resource name dari route path atau name
     */
    static extractResourceName(routePath: string, routeName?: string): string {
        // Priority 1: Extract dari route name jika ada
        if (routeName && routeName.includes('.')) {
            const nameParts = routeName.split('.')
            if (nameParts.length >= 2) {
                return this.sanitizeIdentifier(nameParts[0])
            }
        }

        // Priority 2: Extract dari path segments
        const pathSegments = routePath
            .split('/')
            .filter(segment =>
                segment &&
                !segment.includes('{') &&
                !segment.includes(':') &&
                !segment.includes('*')
            )

        if (pathSegments.length > 0) {
            return this.sanitizeIdentifier(pathSegments[0])
        }

        // Fallback: Use route name as-is atau 'api'
        return this.sanitizeIdentifier(routeName || 'api')
    }

    /**
     * Validate jika string adalah valid JavaScript identifier
     */
    static isValidIdentifier(name: string): boolean {
        if (!name || typeof name !== 'string') return false

        // Check JavaScript identifier rules
        const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
        return identifierRegex.test(name)
    }

    /**
     * Generate validator function name
     */
    static getValidatorName(resourceName: string, actionName: string, type: 'payload' | 'response'): string {
        const resource = this.toPascalCase(resourceName)
        const action = this.toPascalCase(actionName)
        const suffix = type === 'payload' ? 'Payload' : 'Response'

        return `validate${resource}${action}${suffix}`
    }

    /**
     * Generate mapper function name
     */
    static getMapperName(resourceName: string, actionName: string, direction: 'toApi' | 'fromApi', isCollection = false): string {
        const resource = this.toPascalCase(resourceName)
        const action = this.toPascalCase(actionName)

        if (direction === 'toApi') {
            return `toApi${resource}${action}`
        } else {
            const suffix = isCollection ? 'ReadList' : 'Read'
            return `to${resource}${suffix}`
        }
    }

    /**
     * Generate type name
     */
    static getTypeName(resourceName: string, suffix: string): string {
        const resource = this.toPascalCase(resourceName)
        return `${resource}${suffix}`
    }

    /**
     * Test function untuk validate semua transformations
     */
    static test(): void {
        const testCases = [
            'forgot-password',
            'oauth_provider_redirect',
            'api-v2',
            'user-profile',
            'admin_dashboard',
            '123-invalid',
            'valid_name',
            'ValidName',
            '',
            null as any,
            undefined as any
        ]

        console.log('🧪 Identifier Sanitization Test Results:')
        console.log('='.repeat(50))

        testCases.forEach(testCase => {
            const sanitized = this.sanitizeIdentifier(testCase)
            const pascalCase = this.toPascalCase(testCase)
            const camelCase = this.toCamelCase(testCase)
            const constantCase = this.toConstantCase(testCase)
            const isValid = this.isValidIdentifier(pascalCase)

            console.log(`Input: "${testCase}"`)
            console.log(`  Sanitized: "${sanitized}"`)
            console.log(`  PascalCase: "${pascalCase}" ${isValid ? '✅' : '❌'}`)
            console.log(`  camelCase: "${camelCase}"`)
            console.log(`  CONSTANT_CASE: "${constantCase}"`)
            console.log('')
        })
    }
}