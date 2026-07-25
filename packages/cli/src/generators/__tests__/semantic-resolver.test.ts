/**
 * semantic-resolver.test.ts
 * 
 * Unit tests untuk SemanticResolver class
 * Note: Using 'any' for test fixtures to avoid strict type compatibility issues
 */

import { describe, it, expect } from 'vitest'
import { SemanticResolver, type CompilerIR } from '../semantic-resolver'

describe('SemanticResolver', () => {
    describe('resolve()', () => {
        it('should accept empty manifest', () => {
            const manifest: any = {
                version: '1.0',
                routes: [],
                models: [],
                resources: [],
            }
            const ir = SemanticResolver.resolve(manifest)

            expect(ir).toBeDefined()
            expect(ir.responseTypes.size).toBe(0)
            expect(ir.resolvedRoutes).toHaveLength(0)
            expect(ir.metadata.errors).toHaveLength(0)
        })

        it('should populate metadata correctly', () => {
            const manifest: any = {
                version: '1.0',
                routes: [{ name: 'test.get', method: 'GET', path: '/test', auth: false, middleware: [] }],
                models: [{ name: 'Test', table: 'tests', columns: [] }],
                resources: [],
            }

            const ir = SemanticResolver.resolve(manifest)

            expect(ir.metadata.totalRoutes).toBe(1)
            expect(ir.metadata.totalModels).toBe(1)
            expect(ir.metadata.computedAt).toBeInstanceOf(Date)
        })
    })

    describe('Resource Aliasing', () => {
        it('should recognize resource alias (no fields)', () => {
            const manifest: any = {
                version: '1.0',
                routes: [
                    {
                        name: 'orders.get',
                        method: 'GET',
                        path: '/orders/:id',
                        auth: false,
                        middleware: [],
                        response: {
                            kind: 'resource',
                            resource: 'OrderResource',
                            collection: false,
                        },
                    },
                ],
                models: [],
                resources: [],
            }

            const ir = SemanticResolver.resolve(manifest)
            const response = ir.responseTypes.get('orders.getResponse')

            expect(response?.name).toBe('OrderResource')
            expect(response?.kind).toBe('resource')
        })

        it('should generate fallback name for custom response', () => {
            const manifest: any = {
                version: '1.0',
                routes: [
                    {
                        name: 'checkout.create',
                        method: 'POST',
                        path: '/checkout',
                        auth: false,
                        middleware: [],
                        response: {
                            kind: 'custom',
                            type: 'object',
                            collection: false,
                            fields: {
                                order_id: { kind: 'primitive', type: 'bigint' },
                            },
                        },
                    },
                ],
                models: [],
                resources: [],
            }

            const ir = SemanticResolver.resolve(manifest)
            const response = ir.responseTypes.get('checkout.createResponse')

            expect(response?.name).toContain('CheckoutCreate')
            expect(response?.kind).toBe('custom')
        })
    })

    describe('Action Name Derivation', () => {
        it('should map HTTP methods to actions', () => {
            const manifest: any = {
                version: '1.0',
                routes: [
                    { name: 'items.create', method: 'POST', path: '/items', auth: false, middleware: [] },
                    { name: 'items.update', method: 'PUT', path: '/items/:id', auth: false, middleware: [] },
                    { name: 'items.delete', method: 'DELETE', path: '/items/:id', auth: false, middleware: [] },
                    { name: 'items.get', method: 'GET', path: '/items/:id', auth: false, middleware: [] },
                ],
                models: [],
                resources: [],
            }

            const ir = SemanticResolver.resolve(manifest)

            expect(ir.resolvedRoutes.find(r => r.name === 'items.create')?.action).toBe('Create')
            expect(ir.resolvedRoutes.find(r => r.name === 'items.update')?.action).toBe('Update')
            expect(ir.resolvedRoutes.find(r => r.name === 'items.delete')?.action).toBe('Delete')
            expect(ir.resolvedRoutes.find(r => r.name === 'items.get')?.action).toBe('Get')
        })
    })

    describe('Response Composition', () => {
        it('should detect collection responses', () => {
            const manifest: any = {
                version: '1.0',
                routes: [
                    {
                        name: 'items.list',
                        method: 'GET',
                        path: '/items',
                        auth: false,
                        middleware: [],
                        response: {
                            kind: 'resource',
                            resource: 'ItemResource',
                            collection: true,
                        },
                    },
                ],
                models: [],
                resources: [],
            }

            const ir = SemanticResolver.resolve(manifest)
            const response = ir.responseTypes.get('items.listResponse')

            expect(response?.isCollection).toBe(true)
        })

        it('should detect paginated responses', () => {
            const manifest: any = {
                version: '1.0',
                routes: [
                    {
                        name: 'items.list',
                        method: 'GET',
                        path: '/items',
                        auth: false,
                        middleware: [],
                        response: {
                            kind: 'resource',
                            resource: 'ItemResource',
                            collection: true,
                            paginated: true,
                        },
                    },
                ],
                models: [],
                resources: [],
            }

            const ir = SemanticResolver.resolve(manifest)
            const response = ir.responseTypes.get('items.listResponse')

            expect(response?.isPaginated).toBe(true)
        })
    })

    describe('Generated File Names', () => {
        it('should generate correct file names', () => {
            const manifest: any = {
                version: '1.0',
                routes: [
                    {
                        name: 'orders.get',
                        method: 'GET',
                        path: '/orders/:id',
                        auth: false,
                        middleware: [],
                        response: {
                            kind: 'resource',
                            resource: 'OrderResource',
                            collection: false,
                        },
                    },
                ],
                models: [],
                resources: [],
            }

            const ir = SemanticResolver.resolve(manifest)
            const response = ir.responseTypes.get('orders.getResponse')

            expect(response?.contractName).toBe('OrderResourceSchema')
            expect(response?.mapperName).toBe('toOrderResourceRead')
        })
    })

    describe('Edge Cases', () => {
        it('should handle missing method gracefully', () => {
            const manifest: any = {
                version: '1.0',
                routes: [{ name: 'test', path: '/test', auth: false, middleware: [] }],
                models: [],
                resources: [],
            }

            const ir = SemanticResolver.resolve(manifest)
            expect(ir).toBeDefined()
        })
    })
})
