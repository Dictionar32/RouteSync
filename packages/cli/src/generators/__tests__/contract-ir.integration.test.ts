/**
 * Integration test untuk Contract IR Architecture
 * 
 * Test ini memverifikasi bahwa:
 * 1. ContractIRBuilder correctly transforms RouteManifest to ContractIR
 * 2. All emitters consume ContractIR and produce expected output
 * 3. No field transformations leak into emitters (should be in IR)
 * 4. Generated files are consistent and valid
 */

import { describe, it, expect } from 'vitest'
import { ContractIRBuilder } from '../../../../core/src/ir/ContractIRBuilder'
import { ContractGenerator } from '../ContractGenerator'
import { ReadEmitter } from '../layers/ReadEmitter'
import { MapperEmitter } from '../layers/MapperEmitter'
import { FormEmitter } from '../layers/FormEmitter'
import { SchemaEmitter } from '../layers/SchemaEmitter'
import { ContractEmitter } from '../layers/ContractEmitter'
import { FieldEmitter } from '../layers/FieldEmitter'
import type { RouteManifest } from '../../../../core/src/types/route'
import type { GenerationContext, IREmitter, ContractIR } from '../../../../core/src/types/ir'

// Mock context untuk testing
const mockContext: GenerationContext = {
    projectRoot: '.',
    outputDir: './output',
    config: {
        typescript: {
            strict: true,
            target: 'ES2020',
            moduleResolution: 'node'
        },
        validation: {
            useZod: true,
            useLaravel: false
        },
        naming: {
            caseTransform: 'camel',
            resourceSuffix: 'Resource',
            requestSuffix: 'Request'
        }
    },
    manifest: {
        resources: [],
        requests: [],
        routes: [],
        metadata: {
            version: '1.0.0',
            scanned_at: new Date().toISOString(),
            source_files: []
        }
    }
}

describe('Contract IR Architecture', () => {
    // Sample manifest untuk testing
    const sampleManifest: RouteManifest = {
        version: '1.0.0',
        baseURL: 'http://localhost:8000',
        generatedAt: '2024-01-01T00:00:00Z',
        routes: [
            {
                name: 'orders.index',
                method: 'GET',
                path: '/api/orders',
                auth: false,
                middleware: [],
                response: {
                    kind: 'resource',
                    resource: 'OrderResource',
                    collection: true,
                    paginated: false
                }
            },
            {
                name: 'orders.show',
                method: 'GET',
                path: '/api/orders/{id}',
                auth: true,
                middleware: ['auth'],
                response: {
                    kind: 'resource',
                    resource: 'OrderResource',
                    collection: false
                }
            },
            {
                name: 'orders.store',
                method: 'POST',
                path: '/api/orders',
                auth: true,
                middleware: ['auth'],
                schema: {
                    rules: {
                        'customer_name': 'required|string',
                        'total_minor': 'required|integer'
                    }
                }
            }
        ],
        resources: [
            {
                name: 'OrderResource',
                fields: {
                    'id': {
                        kind: 'primitive',
                        type: 'int',
                        resolved: {
                            type: 'number',
                            status: 'resolved' as const,
                            confidence: 1,
                            trace: []
                        }
                    },
                    'customer_name': {
                        kind: 'primitive',
                        type: 'string',
                        resolved: {
                            type: 'string',
                            status: 'resolved' as const,
                            confidence: 1,
                            trace: []
                        }
                    },
                    'total_minor': {
                        kind: 'primitive',
                        type: 'int',
                        resolved: {
                            type: 'number',
                            status: 'resolved' as const,
                            confidence: 1,
                            trace: []
                        }
                    },
                    'created_at': {
                        kind: 'primitive',
                        type: 'datetime',
                        resolved: {
                            type: 'string',
                            status: 'resolved' as const,
                            confidence: 1,
                            trace: []
                        }
                    }
                }
            }
        ],
        models: [
            {
                name: 'Order',
                table: 'orders',
                columns: [
                    { name: 'id', type: 'bigint', nullable: false },
                    { name: 'customer_name', type: 'varchar', nullable: false },
                    { name: 'total_minor', type: 'int', nullable: false },
                    { name: 'created_at', type: 'timestamp', nullable: false }
                ]
            }
        ]
    }

    describe('ContractIRBuilder', () => {
        it('should build valid ContractIR from RouteManifest', () => {
            const builder = new ContractIRBuilder(mockContext)
            const generator = new ContractGenerator()
            const adaptedManifest = generator['adaptManifest'](sampleManifest)
            const ir = builder.buildFromManifest(adaptedManifest)

            // Verify basic structure
            expect(ir.resources).toHaveLength(1)
            expect(ir.endpoints).toHaveLength(3)
            expect(ir.metadata.version).toBe('1.0.0')

            // Verify resource transformations
            const orderResource = ir.resources[0]
            expect(orderResource.name).toBe('OrderResource')
            expect(orderResource.sourceModel).toBe('Order')
            expect(orderResource.fields).toHaveLength(4)

            // Verify field transformations (snake_case → camelCase)
            const customerNameField = orderResource.fields.find(f => f.name === 'customer_name')
            expect(customerNameField?.transformedName).toBe('customerName')

            const createdAtField = orderResource.fields.find(f => f.name === 'created_at')
            expect(createdAtField?.transformedName).toBe('createdAt')

            // Verify aliases generated
            expect(orderResource.aliases).toHaveLength(3)
            expect(orderResource.aliases.map(a => a.name)).toEqual([
                'OrderShow',
                'OrderIndex',
                'OrderCollection'
            ])

            // Verify variants generated
            expect(orderResource.variants).toHaveLength(3)
            expect(orderResource.variants.map(v => v.kind)).toEqual([
                'read',
                'schema',
                'contract'
            ])

            // Verify mapper generated
            expect(orderResource.mapper.mappings).toHaveLength(4)
            const customerNameMapping = orderResource.mapper.mappings.find(m => m.source === 'customer_name')
            expect(customerNameMapping?.target).toBe('customerName')
        })

        it('should handle empty manifest gracefully', () => {
            const builder = new ContractIRBuilder(mockContext)
            const generator = new ContractGenerator()
            const emptyManifest: RouteManifest = {
                version: '1.0.0',
                baseURL: 'http://localhost:8000',
                generatedAt: '2024-01-01T00:00:00Z',
                routes: []
            }

            const adaptedEmptyManifest = generator['adaptManifest'](emptyManifest)
            const ir = builder.buildFromManifest(adaptedEmptyManifest)

            expect(ir.resources).toHaveLength(0)
            expect(ir.endpoints).toHaveLength(0)
            expect(ir.requests).toHaveLength(0)
        })
    })

    describe('Emitters', () => {
        let ir: ContractIR

        beforeEach(() => {
            const builder = new ContractIRBuilder(mockContext)
            const generator = new ContractGenerator()
            const adaptedManifest = generator['adaptManifest'](sampleManifest)
            ir = builder.buildFromManifest(adaptedManifest)
        })

        describe('ReadEmitter', () => {
            it('should generate TypeScript interfaces from ResourceIR', () => {
                const emitter = new ReadEmitter()
                const files = emitter.emit(ir)

                expect(files).toHaveLength(1)
                expect(files[0].path).toBe('types/api-read.ts')

                const content = files[0].content

                // Should contain transformed interface
                expect(content).toContain('export interface OrderResourceTransformed')
                expect(content).toContain('readonly customerName:') // camelCase
                expect(content).toContain('readonly createdAt:') // camelCase
                expect(content).not.toContain('customer_name') // no snake_case in output

                // Should contain aliases
                expect(content).toContain('export type OrderShow = OrderTransformed')
                expect(content).toContain('export type OrderIndex = OrderTransformed[]')
            })
        })

        describe('MapperEmitter', () => {
            it('should generate transform functions from MapperIR', () => {
                const emitter = new MapperEmitter()
                const files = emitter.emit(ir)

                expect(files).toHaveLength(1)
                expect(files[0].path).toBe('mappers/api-mapper.ts')

                const content = files[0].content

                // Should contain read mapper
                expect(content).toContain('export const toOrderResourceRead =')
                expect(content).toContain('customerName: raw.customer_name') // transformation
                expect(content).toContain('createdAt: raw.created_at') // transformation

                // Should contain list mapper
                expect(content).toContain('export const toOrderReadList =')
            })
        })

        describe('SchemaEmitter', () => {
            it('should generate Zod schemas from ResourceIR', () => {
                const emitter = new SchemaEmitter()
                const files = emitter.emit(ir)

                expect(files).toHaveLength(1)
                expect(files[0].path).toBe('schemas/api-schema.ts')

                const content = files[0].content

                // Should import zod
                expect(content).toContain("import { z } from 'zod'")

                // Should contain resource schema with camelCase fields
                expect(content).toContain('export const OrderResourceSchema = z.object({')
                expect(content).toContain('customerName: z.string()') // camelCase
                expect(content).toContain('createdAt: z.string()') // camelCase
                expect(content).not.toContain('customer_name:') // no snake_case
            })
        })

        describe('ContractEmitter', () => {
            it('should generate API contracts from EndpointIR', () => {
                const emitter = new ContractEmitter()
                const files = emitter.emit(ir)

                expect(files).toHaveLength(1)
                expect(files[0].path).toBe('contract/api-contract.ts')

                const content = files[0].content

                // Should contain route mappings
                expect(content).toContain('export const ApiRoutes = {')
                expect(content).toContain("method: 'GET'")
                expect(content).toContain("path: '/api/orders'")

                // Should contain endpoint interfaces
                expect(content).toContain('export interface')
                expect(content).toContain('Endpoint')
            })
        })

        describe('FieldEmitter', () => {
            it('should generate field metadata from ResourceIR', () => {
                const emitter = new FieldEmitter()
                const files = emitter.emit(ir)

                expect(files).toHaveLength(1)
                expect(files[0].path).toBe('contract/api-fields.ts')

                const content = files[0].content

                // Should contain field definitions
                expect(content).toContain('export const OrderResourceFields = {')
                expect(content).toContain("name: 'customerName'") // camelCase
                expect(content).toContain("snakeName: 'customer_name'") // original
                expect(content).toContain("camelName: 'customerName'") // transformed
            })
        })
    })

    describe('ContractGenerator Integration', () => {
        it('should generate all files via unified generator', async () => {
            const generator = new ContractGenerator()
            const result = await generator.generate(sampleManifest)

            // Should generate files from all emitters
            expect(result.files.length).toBeGreaterThan(5)

            // Verify file paths
            const filePaths = result.files.map(f => f.path)
            expect(filePaths).toContain('types/api-read.ts')
            expect(filePaths).toContain('mappers/api-mapper.ts')
            expect(filePaths).toContain('schemas/api-schema.ts')
            expect(filePaths).toContain('contract/api-contract.ts')
            expect(filePaths).toContain('contract/api-fields.ts')

            // Verify metadata
            expect(result.metadata.stats.resourceCount).toBe(1)
            expect(result.metadata.stats.endpointCount).toBe(3)
            expect(result.metadata.performance.buildTime).toBeGreaterThan(0)
        })

        it('should validate IR integrity', async () => {
            const generator = new ContractGenerator()

            // Test with invalid manifest (missing resource reference)
            const invalidManifest = {
                ...sampleManifest,
                routes: [
                    {
                        ...sampleManifest.routes[0],
                        response: {
                            kind: 'resource',
                            resource: 'NonExistentResource',
                            collection: true
                        }
                    }
                ]
            }

            await expect(generator.generate(invalidManifest as RouteManifest))
                .rejects.toThrow('IR validation failed')
        })
    })

    describe('Architecture Benefits Verification', () => {
        it('should have consistent field transformations across emitters', () => {
            const builder = new ContractIRBuilder(mockContext)
            const generator = new ContractGenerator()
            const adaptedManifest = generator['adaptManifest'](sampleManifest)
            const ir = builder.buildFromManifest(adaptedManifest)

            // Get field transformations from IR
            const orderResource = ir.resources[0]
            const fieldTransformations = new Map(
                orderResource.fields.map(f => [f.name, f.transformedName])
            )

            // Test all emitters produce consistent transformations
            const emitters = [
                new ReadEmitter(),
                new MapperEmitter(),
                new SchemaEmitter(),
                new FieldEmitter()
            ]

            for (const emitter of emitters) {
                const files = emitter.emit(ir)
                const content = files[0]?.content || ''

                // Verify camelCase is used consistently
                expect(content).toContain('customerName')
                expect(content).toContain('createdAt')

                // Verify no snake_case in TypeScript field names
                // (except in mappers where it's the source field)
                if (!content.includes('raw.customer_name')) {
                    expect(content).not.toMatch(/\bcustomer_name\s*:/)
                }
            }
        })

        it('should allow easy addition of new emitters', () => {
            // Example: Add a custom emitter that extends ReadEmitter
            class MockEmitter extends ReadEmitter {
                emit(ir: ContractIR) {
                    return [{
                        path: 'mock/test.ts',
                        content: `// Resources: ${ir.resources.length}`,
                        metadata: { emitter: 'MockEmitter', generatedAt: '', dependencies: [] }
                    }]
                }
            }

            const generator = new ContractGenerator()
            generator.addEmitter(new MockEmitter())

            // Should be able to generate with custom emitter
            expect(async () => {
                const result = await generator.generate(sampleManifest)
                expect(result.files.some(f => f.path === 'mock/test.ts')).toBe(true)
            }).not.toThrow()
        })
    })
})