import { describe, test, expect } from 'vitest'
import { manifestToSemanticTypes } from '../../cli/src/generators/utils/manifest-to-types'
import { TypeScriptGeneratorPass } from '../../core/src/compiler/passes/TypeScriptGeneratorPass'
import type { RouteManifest } from '../../core/src/types/route'

describe('Nested Resource Field Preservation in api-read.ts', () => {
    test('should preserve nested objects (like promotion or shipping) without flattening', () => {
        const manifest: RouteManifest = {
            routes: [],
            models: [],
            resources: [
                {
                    name: 'OrderResource',
                    fields: {
                        id: { kind: 'primitive', type: 'integer' },
                        status: { kind: 'primitive', type: 'string' },
                        promotion: {
                            kind: 'object',
                            fields: {
                                code: { kind: 'primitive', type: 'string' },
                                discount_minor: { kind: 'primitive', type: 'integer' }
                            }
                        }
                    }
                }
            ]
        }

        const semanticTypes = manifestToSemanticTypes(manifest)
        const pass = new TypeScriptGeneratorPass()
        const [result] = pass.run([semanticTypes])

        // Verify OrderResourceTransformed contains flattened camelCase properties
        expect(result.code).toContain('export interface OrderResourceTransformed {')
        expect(result.code).toContain('promotionCode: string;')
        expect(result.code).toContain('promotionDiscountMinor: number;')
    })
})
