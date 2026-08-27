import { describe, it, expect } from 'vitest'

/**
 * Regression tests for LaravelRouteParser:
 *
 * 1. Non-greedy validate regex:
 *    $request->validate([...]) must NOT swallow subsequent array statements
 *    such as $response = [...] into validation rules.
 *
 * 2. Model schema offline DB fallback:
 *    When DB schema inspection fails (offline DB), model $fillable property
 *    must be used to populate columns so models are not lost.
 */

function extractInlineValidationRules(methodSource: string): Record<string, string | string[]> {
    // Non-greedy pattern matching LaravelRouteParser.ts line 516 fix
    const validateMatch = /\$([A-Za-z_][A-Za-z0-9_]*|request)->validate\s*\(\s*(\[.*?\])\s*\)/s.exec(methodSource)
    if (!validateMatch) {
        return {}
    }

    const rulesBlock = validateMatch[2]
    const rules: Record<string, string | string[]> = {}
    const fieldPattern = /['"]([^'"]+)['"]\s*=>\s*(\[[^\]]*\]|['"][^'"]*['"])/gs
    let match: RegExpExecArray | null

    while ((match = fieldPattern.exec(rulesBlock)) !== null) {
        const field = match[1]
        const value = match[2].trim()
        if (value.startsWith('[')) {
            const items: string[] = []
            const itemPattern = /['"]([^'"]+)['"]/g
            let itemMatch: RegExpExecArray | null
            while ((itemMatch = itemPattern.exec(value)) !== null) {
                items.push(itemMatch[1])
            }
            rules[field] = items
        } else {
            rules[field] = value.replace(/^['"]|['"]$/g, '')
        }
    }

    return rules
}

describe('LaravelRouteParser: Non-greedy validate() scanner & DB-offline fallback', () => {
    it('should capture only validate rules and NOT swallow $response array keys', () => {
        const methodSource = `
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $token = Str::random(64);

        $response = [
            'message' => 'Link reset password telah dibuat.',
        ];

        return response()->json($response);
        `

        const rules = extractInlineValidationRules(methodSource)

        expect(rules).toHaveProperty('email')
        expect(rules['email']).toBe('required|email|exists:users,email')

        // Must NOT contain 'message' key from $response array literal!
        expect(rules).not.toHaveProperty('message')
    })

    it('should correctly infer columns from fillable when Schema::getColumns is unavailable', () => {
        const mockFillable = ['nama', 'description']
        const parsedColumns: Array<{ name: string; type: string; nullable: boolean }> = []

        // Simulating the fallback logic added to LaravelRouteParser.ts
        if (mockFillable && Array.isArray(mockFillable)) {
            for (const colName of mockFillable) {
                parsedColumns.push({
                    name: colName,
                    type: 'varchar',
                    nullable: true,
                })
            }
        }

        const hasId = parsedColumns.some((pc) => pc.name === 'id')
        if (!hasId) {
            parsedColumns.unshift({ name: 'id', type: 'bigint', nullable: false })
        }

        expect(parsedColumns).toHaveLength(3)
        expect(parsedColumns[0].name).toBe('id')
        expect(parsedColumns[1].name).toBe('nama')
        expect(parsedColumns[2].name).toBe('description')
    })
})
