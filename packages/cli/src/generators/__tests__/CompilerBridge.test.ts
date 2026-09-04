/**
 * CompilerBridge.test.ts - REFACTORED
 * Tests for CompilerBridge orchestration
 * 
 * Focus: Verify Bridge orchestrates correctly, not implementation details
 * Implementation logic tested in:
 * - PrimitiveTypeFactory.test.ts
 * - resource-flattening.test.ts
 * - TypeScriptGeneratorPass.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CompilerBridge } from '../CompilerBridge'
import type { RouteManifest } from '../../../../core/src/types/route'

// Mock dependencies
// CompilerBridge memanggil `new TypeScriptGeneratorPass()` — mock harus
// berupa class, bukan vi.fn().mockImplementation(() => ({...})) yang
// tidak bisa dipakai dengan `new` di Vitest 4. Semua instance berbagi satu
// mock function `run` sehingga test bisa override-nya (mockImplementationOnce)
// per test.
const mockPassRun = vi.fn().mockReturnValue([{
    typeId: 'GeneratedTypeScript',
    code: 'export interface User { id: number; name: string; }',
    imports: [{ from: './types', names: ['User'] }],
    interfaces: [{ name: 'User', properties: [] }],
    generationMetadata: {
        typeCount: 1,
        interfaceCount: 1,
        linesOfCode: 1,
        warnings: []
    },
    metadata: {
        hash: 'test-hash',
        producer: 'TypeScriptGeneratorPass',
        dependencies: [],
        timestamp: Date.now(),
        revision: '1.0.0'
    }
}])

vi.mock('../../../../core/src/compiler/passes/TypeScriptGeneratorPass', () => ({
    TypeScriptGeneratorPass: class {
        run = mockPassRun
    }
}))

describe('CompilerBridge - Refactored', () => {
    let mockManifest: RouteManifest

    beforeEach(() => {
        mockManifest = {
            version: '1.0',
            baseURL: 'http://localhost',
            routes: [],
            models: [
                {
                    name: 'User',
                    table: 'users',
                    columns: [
                        { name: 'id', type: 'bigint', nullable: false },
                        { name: 'user_name', type: 'varchar', nullable: false }
                    ]
                }
            ],
            resources: [
                {
                    name: 'UserResource',
                    fields: {
                        id: { kind: 'primitive', type: 'number' },
                        name: { kind: 'primitive', type: 'string' }
                    }
                }
            ],
            routeGroups: [],
            requestTypes: [],
            semanticTypes: [
                {
                    name: 'UserResource',
                    properties: [
                        { name: 'id', type: { kind: 'primitive', type: 'number' }, required: true, nullable: false },
                        { name: 'name', type: { kind: 'primitive', type: 'string' }, required: true, nullable: false }
                    ]
                }
            ],
            generatedAt: new Date().toISOString()
        }
    })

    describe('generateTypeScript', () => {
        it('should orchestrate manifest → types → pass → output', async () => {
            const result = await CompilerBridge.generateTypeScript(mockManifest)

            expect(result).toBeDefined()
            expect(result.code).toBeDefined()
            expect(result.imports).toBeDefined()
            expect(result.interfaces).toBeDefined()
            expect(result.metadata).toBeDefined()
        })

        it('should return CompilerOutput with correct structure', async () => {
            const result = await CompilerBridge.generateTypeScript(mockManifest)

            // Verify top-level structure
            expect(result).toBeDefined()
            expect(typeof result.code).toBe('string')
            expect(Array.isArray(result.imports)).toBe(true)
            expect(Array.isArray(result.interfaces)).toBe(true)
            expect(result.metadata).toBeDefined()

            // Verify metadata structure
            expect(typeof result.metadata.typeCount).toBe('number')
            expect(typeof result.metadata.interfaceCount).toBe('number')
            expect(typeof result.metadata.linesOfCode).toBe('number')
            expect(Array.isArray(result.metadata.warnings)).toBe(true)
        })

        it('should add warning when no models in manifest', async () => {
            mockManifest.models = []

            const result = await CompilerBridge.generateTypeScript(mockManifest)

            expect(result.metadata.warnings).toContain('No models found in manifest')
        })

        it('should add warning when no resources in manifest', async () => {
            mockManifest.resources = []

            const result = await CompilerBridge.generateTypeScript(mockManifest)

            expect(result.metadata.warnings).toContain('No resources found in manifest')
        })

        it('should handle manifest with both models and resources', async () => {
            const result = await CompilerBridge.generateTypeScript(mockManifest)

            expect(result.metadata.typeCount).toBeGreaterThanOrEqual(1)
            expect(result.metadata.warnings).not.toContain('No models found in manifest')
            expect(result.metadata.warnings).not.toContain('No resources found in manifest')
        })

        it('should throw error if Pass execution fails', async () => {
            // Override mock Pass untuk melempar error pada pemanggilan berikutnya
            mockPassRun.mockImplementationOnce(() => {
                throw new Error('Pass execution failed')
            })

            await expect(
                CompilerBridge.generateTypeScript(mockManifest)
            ).rejects.toThrow('CompilerBridge generation failed')
        })
    })

    describe('Architecture Compliance', () => {
        it('should only orchestrate, not implement business logic', () => {
            // Verify Bridge delegates to utilities
            const bridgeSource = require('fs').readFileSync(
                require('path').resolve(__dirname, '../CompilerBridge.ts'),
                'utf-8'
            )

            // Should delegate to lowering utilities, not implement them inline
            expect(bridgeSource).toContain('manifestToSemanticTypes')
            expect(bridgeSource).toContain('manifestToRequestTypes')
            expect(bridgeSource).toContain('manifestToContractInput')
            expect(bridgeSource).toContain('TypeScriptGeneratorPass')

            // Should NOT have inline business logic (all moved to utils)
            expect(bridgeSource).not.toContain('function flattenResourceField')
            expect(bridgeSource).not.toContain('function primitiveStringToSemanticType')
            expect(bridgeSource).not.toContain('function parseValidationRules')
            expect(bridgeSource).not.toContain('function processResources')
        })

        it('should be significantly smaller than original', () => {
            const fs = require('fs')
            const path = require('path')

            const currentSize = fs.readFileSync(
                path.resolve(__dirname, '../CompilerBridge.ts'),
                'utf-8'
            ).split('\n').length

            const originalSize = 516 // From Phase 2 report

            expect(currentSize).toBeLessThan(originalSize)
            expect(currentSize).toBeLessThan(300) // Should be under 300 lines
        })
    })
})
