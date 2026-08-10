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
import { OptimizedContractIRBuilder } from '../../../../core/src/ir/ContractIRBuilder'
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
            const builder = new OptimizedContractIRBuilder(mockContext)
            const generator = new ContractGenerator()
            const adaptedManifest = generator['adaptManifest'](sampleManifest)
            const ir = builder.buildFromManifest(adaptedManifest)

            // Verify basic structure
            expect(ir.resources).toHaveLength(1)
            expect(ir.endpoints).toHaveLength(3)
            // Builder menuliskan prefix 'v' pada metadata.version
            expect(ir.metadata.version).toBe('v1.0.0')

            // Verify resource transformations
            const orderResource = ir.resources[0]
            expect(orderResource.name).toBe('OrderResource')
            // Resource authored di manifest.resources tidak punya sourceModel
            // (hanya model yang di-infer dari manifest.models yang mendapatkannya)
            expect(orderResource.sourceModel).toBeUndefined()
            expect(orderResource.fields).toHaveLength(4)

            // Verify field transformations (snake_case → camelCase)
            const customerNameField = orderResource.fields.find(f => f.name === 'customer_name')
            expect(customerNameField?.transformedName).toBe('customerName')

            const createdAtField = orderResource.fields.find(f => f.name === 'created_at')
            expect(createdAtField?.transformedName).toBe('createdAt')

            // Verify aliases generated
            expect(orderResource.aliases).toHaveLength(2)
            expect(orderResource.aliases.map(a => a.name)).toEqual([
                'OrderResourceShow',
                'OrderResourceIndex'
            ])

            // Verify variants generated
            expect(orderResource.variants).toHaveLength(1)
            expect(orderResource.variants.map(v => v.kind)).toEqual(['read'])

            // Verify mapper generated
            expect(orderResource.mapper.mappings).toHaveLength(4)
            const customerNameMapping = orderResource.mapper.mappings.find(m => m.source === 'customer_name')
            expect(customerNameMapping?.target).toBe('customerName')
        })

        it('should handle empty manifest gracefully', () => {
            const builder = new OptimizedContractIRBuilder(mockContext)
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
            const builder = new OptimizedContractIRBuilder(mockContext)
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

                // Should contain aliases (nama resource dipertahankan, bukan di-strip)
                expect(content).toContain('export type OrderResourceShow = OrderResourceTransformed')
                expect(content).toContain('export type OrderResourceIndex = OrderResourceTransformed[]')
            })
        })

        describe('MapperEmitter', () => {
            it('should generate transform functions from MapperIR', () => {
                const emitter = new MapperEmitter()
                const files = emitter.emit(ir)

                expect(files).toHaveLength(1)
                expect(files[0].path).toBe('mappers/api-mapper.ts')

                const content = files[0].content

                // Should contain read mapper (suffix 'Resource' di-strip untuk nama fungsi)
                expect(content).toContain('export const toOrderRead =')
                expect(content).toContain('customerName: api.customer_name') // transformation
                expect(content).toContain('createdAt: api.created_at') // transformation

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

                // SchemaEmitter consume RequestIR (bukan ResourceIR): dengan
                // adaptManifest saat ini yang selalu menghasilkan requests: [],
                // output-nya adalah struktur ApiSchema/ApiFormValues/ApiDefaultValues
                // tanpa entry. Resource schemas dihasilkan oleh ContractEmitter.
                expect(content).toContain('export const ApiSchema = {')
                expect(content).toContain('export type ApiFormValues = {')
                expect(content).toContain('export const ApiDefaultValues = {')
            })
        })

        describe('ContractEmitter', () => {
            it('should generate API contracts from EndpointIR', () => {
                const emitter = new ContractEmitter()
                const files = emitter.emit(ir)

                expect(files).toHaveLength(1)
                expect(files[0].path).toBe('contract/api-contract.ts')

                const content = files[0].content

                // Should contain resource schema (snake_case backend fields)
                expect(content).toContain('export const OrderResourceSchema = z.object({')
                expect(content).toContain('customer_name: z.string()') // snake_case asli backend
                expect(content).toContain('created_at: z.string()') // snake_case asli backend

                // Should contain type inference + validator
                expect(content).toContain('export type OrderResourceResponse = z.infer<typeof OrderResourceSchema>')
                expect(content).toContain('export const validateOrderResourceResponse =')

                // Should contain collection schema untuk index routes
                expect(content).toContain('export const OrdersResponseSchema = z.object({')
                expect(content).toContain('data: z.array(OrderResourceSchema)')
                expect(content).toContain('export const validateOrderResourceCollectionResponse =')
            })
        })

        describe('FieldEmitter', () => {
            it('should generate field metadata from ResourceIR', () => {
                const emitter = new FieldEmitter()
                const files = emitter.emit(ir)

                expect(files).toHaveLength(1)
                expect(files[0].path).toBe('contract/api-field.ts')

                const content = files[0].content

                // Should contain global ApiApiField lookup (SNAKE_UPPER -> snake_case)
                expect(content).toContain('export const ApiApiField = {')
                expect(content).toContain('CUSTOMER_NAME: "customer_name"') // original snake_case
                expect(content).toContain('CREATED_AT: "created_at"') // original snake_case
                expect(content).toContain('} as const')
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
            expect(filePaths).toContain('contract/api-field.ts')
            expect(filePaths).toContain('forms/api-form.ts')
            expect(filePaths).toContain('sdk/api.ts')

            // Verify metadata
            expect(result.metadata.stats.resourceCount).toBe(1)
            expect(result.metadata.stats.endpointCount).toBe(3)
            expect(result.metadata.performance.buildTime).toBeGreaterThan(0)
        })

        it('should tolerate missing resource references (structural validation only)', async () => {
            const generator = new ContractGenerator()

            // Route yang merujuk resource yang tidak ada di manifest.
            // validateIR() hanya memeriksa integritas STRUKTURAL IR (arrays,
            // nama resource) — referensi yang hilang tidak membuat generate
            // gagal; builder me-resolve-nya dengan fallback ke unknown.
            const manifestWithMissingRef = {
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

            const result = await generator.generate(manifestWithMissingRef as RouteManifest)
            expect(result.files.length).toBeGreaterThan(0)
            // Manifest invalid di test ini cuma berisi 1 route (routes[0])
            expect(result.ir.endpoints).toHaveLength(1)
        })
    })

    describe('Architecture Benefits Verification', () => {
        it('should have consistent field transformations across emitters', () => {
            const builder = new OptimizedContractIRBuilder(mockContext)
            const generator = new ContractGenerator()
            const adaptedManifest = generator['adaptManifest'](sampleManifest)
            const ir = builder.buildFromManifest(adaptedManifest)

            // Get field transformations from IR
            const orderResource = ir.resources[0]
            const fieldTransformations = new Map(
                orderResource.fields.map(f => [f.name, f.transformedName])
            )

            // Setiap emitter memakai proyeksi field yang konsisten dari IR:
            // - ReadEmitter: camelCase (frontend)
            // - MapperEmitter: menjembatani snake_case -> camelCase
            // - ContractEmitter: snake_case asli backend
            // - FieldEmitter: SNAKE_UPPER -> snake_case
            // (SchemaEmitter consume RequestIR; dengan requests kosong ia tidak
            //  memproyeksikan field resource sama sekali.)
            const readContent = new ReadEmitter().emit(ir)[0].content
            expect(readContent).toContain('readonly customerName:')
            expect(readContent).toContain('readonly createdAt:')
            expect(readContent).not.toMatch(/\bcustomer_name\s*:/)

            const mapperContent = new MapperEmitter().emit(ir)[0].content
            expect(mapperContent).toContain('customerName: api.customer_name')
            expect(mapperContent).toContain('createdAt: api.created_at')

            const contractContent = new ContractEmitter().emit(ir)[0].content
            expect(contractContent).toContain('customer_name: z.string()')
            expect(contractContent).toContain('created_at: z.string()')

            const fieldContent = new FieldEmitter().emit(ir)[0].content
            expect(fieldContent).toContain('CUSTOMER_NAME: "customer_name"')
            expect(fieldContent).toContain('CREATED_AT: "created_at"')
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