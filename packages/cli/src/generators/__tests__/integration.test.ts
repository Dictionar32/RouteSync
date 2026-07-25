/**
 * integration.test.ts
 * 
 * Integration tests untuk SemanticResolver
 * Note: Using 'any' for test fixtures to avoid strict type compatibility
 */

import { describe, it, expect } from 'vitest'
import { SemanticResolver, type CompilerIR } from '../semantic-resolver'
import { CANONICAL_ACTION_MAP } from '../canonical-names'

const createRealWorldManifest = (): any => ({
    version: '1.0',
    routes: [
        {
            name: 'orders.list',
            method: 'GET',
            path: '/api/orders',
            auth: false,
            middleware: [],
            response: {
                kind: 'resource',
                resource: 'OrderResource',
                collection: true,
                paginated: true,
            },
        },
        {
            name: 'orders.get',
            method: 'GET',
            path: '/api/orders/:id',
            auth: false,
            middleware: [],
            response: {
                kind: 'resource',
                resource: 'OrderResource',
                collection: false,
            },
        },
        {
            name: 'orders.create',
            method: 'POST',
            path: '/api/orders',
            auth: false,
            middleware: [],
            response: {
                kind: 'resource',
                resource: 'OrderResource',
                collection: false,
            },
        },
        {
            name: 'items.list',
            method: 'GET',
            path: '/api/items',
            auth: false,
            middleware: [],
            response: {
                kind: 'model',
                model: 'Item',
                collection: true,
            },
        },
        {
            name: 'items.get',
            method: 'GET',
            path: '/api/items/:id',
            auth: false,
            middleware: [],
            response: {
                kind: 'model',
                model: 'Item',
                collection: false,
            },
        },
    ],
    models: [
        {
            name: 'Order',
            table: 'orders',
            columns: [],
            fields: {
                id: { kind: 'primitive', type: 'bigint' },
                user_id: { kind: 'primitive', type: 'bigint' },
                total_amount: { kind: 'primitive', type: 'decimal' },
                status: { kind: 'primitive', type: 'string' },
                created_at: { kind: 'primitive', type: 'datetime' },
            },
        },
        {
            name: 'Item',
            table: 'items',
            columns: [],
            fields: {
                id: { kind: 'primitive', type: 'bigint' },
                name: { kind: 'primitive', type: 'string' },
                is_active: { kind: 'primitive', type: 'boolean', cast: 'boolean' },
            },
        },
    ],
    resources: [
        {
            name: 'OrderResource',
            fields: {
                id: { kind: 'primitive', type: 'bigint' },
                user_id: { kind: 'primitive', type: 'bigint' },
            },
        },
    ],
})

describe('Integration: Generator Consistency', () => {
    it('should produce consistent response types for same resource', () => {
        const manifest = createRealWorldManifest()
        const ir = SemanticResolver.resolve(manifest)

        const orderListResponse = ir.responseTypes.get('orders.listResponse')
        const orderGetResponse = ir.responseTypes.get('orders.getResponse')
        const orderCreateResponse = ir.responseTypes.get('orders.createResponse')

        expect(orderListResponse?.name).toBe('OrderResource')
        expect(orderGetResponse?.name).toBe('OrderResource')
        expect(orderCreateResponse?.name).toBe('OrderResource')

        expect(orderListResponse?.contractName).toBe('OrderResourceSchema')
        expect(orderGetResponse?.contractName).toBe('OrderResourceSchema')
    })

    it('should use CANONICAL_ACTION_MAP consistently', () => {
        const manifest = createRealWorldManifest()
        const ir = SemanticResolver.resolve(manifest)

        for (const route of ir.resolvedRoutes) {
            expect(Object.values(CANONICAL_ACTION_MAP)).toContain(route.action)
        }
    })

    it('should detect collection flags correctly', () => {
        const manifest = createRealWorldManifest()
        const ir = SemanticResolver.resolve(manifest)

        const ordersList = ir.responseTypes.get('orders.listResponse')
        const ordersGet = ir.responseTypes.get('orders.getResponse')

        expect(ordersList?.isCollection).toBe(true)
        expect(ordersGet?.isCollection).toBe(false)
    })

    it('should sync composition across types and routes', () => {
        const manifest = createRealWorldManifest()
        const ir = SemanticResolver.resolve(manifest)

        for (const route of ir.resolvedRoutes) {
            const response = ir.responseTypes.get(route.responseId)
            if (response) {
                expect(route.isCollection).toBe(response.isCollection)
                expect(route.isPaginated).toBe(response.isPaginated)
            }
        }
    })

    it('should store aliases for all routes', () => {
        const manifest = createRealWorldManifest()
        const ir = SemanticResolver.resolve(manifest)

        expect(ir.resourceAliases.get('orders.list')).toBe('OrderResource')
        expect(ir.resourceAliases.get('orders.get')).toBe('OrderResource')
        expect(ir.resourceAliases.get('items.list')).toBe('Item')
        expect(ir.resourceAliases.get('items.get')).toBe('Item')
    })

    it('should not have compilation errors', () => {
        const manifest = createRealWorldManifest()
        const ir = SemanticResolver.resolve(manifest)

        expect(ir.metadata.errors).toHaveLength(0)
    })

    it('should complete successfully', () => {
        const manifest = createRealWorldManifest()
        const ir = SemanticResolver.resolve(manifest)

        expect(ir).toBeDefined()
        expect(ir.responseTypes.size).toBeGreaterThan(0)
        expect(ir.resolvedRoutes.length).toBeGreaterThan(0)
    })
})
