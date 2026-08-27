import { describe, it, expect } from 'vitest'

/**
 * Regression test for mergeAssignmentShape trailing comma fix in LaravelRouteParser:
 *
 * $response = ['message' => 'Link reset password telah dibuat.',];
 * $response['reset_token'] = $token;
 *
 * When base array has a trailing comma inside brackets [...], mergeAssignmentShape
 * must strip the trailing comma so implode(', ', $parts) does not create double commas (,,)
 * which previously injected a bogus numeric key "0": z.unknown().
 */

function mergeAssignmentShape(base: string | null, incremental: string[]): string | null {
    let baseInner = ''
    if (base !== null) {
        const trimmed = base.trim()
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            baseInner = trimmed.slice(1, -1).trim()
            baseInner = baseInner.replace(/,$/, '').trim()
        }
    }

    const parts: string[] = []
    if (baseInner !== '') {
        parts.push(baseInner)
    }
    for (const entry of incremental) {
        const cleaned = entry.trim().replace(/,$/, '').trim()
        if (cleaned !== '') {
            parts.push(cleaned)
        }
    }

    if (parts.length === 0) return null
    return '[' + parts.join(', ') + ']'
}

describe('LaravelRouteParser: mergeAssignmentShape trailing comma handling', () => {
    it('should strip trailing comma from baseInner to prevent double commas (,,) and bogus 0 key', () => {
        const base = "[ 'message' => 'Link reset password telah dibuat.', ]"
        const incremental = ["'reset_token' => $token"]

        const merged = mergeAssignmentShape(base, incremental)

        expect(merged).toBe("['message' => 'Link reset password telah dibuat.', 'reset_token' => $token]")
        expect(merged).not.toContain(',,')
    })
})
