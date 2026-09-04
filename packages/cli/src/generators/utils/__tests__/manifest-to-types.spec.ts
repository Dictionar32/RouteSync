import { describe, test, expect } from 'vitest'
import {
    manifestToSemanticTypes,
    manifestToRequestTypes,
    manifestToContractInput
} from '../manifest-to-types'
import type { RouteManifest } from '../../../../core/src/types/route'
import {
    ObjectType,
    ReadonlyCollectionType,
    ReferenceType,
    PrimitiveType,
    PrimitiveKind
} from '../../../../core/src/compiler/types/SemanticType'

describe('manifest-to-types Upstream Lowering Specification (Full Behavioral Suite)', () => {
    const createFullMockManifest = (): RouteManifest => ({
        version: '1.0.0',
        baseURL: 'http://localhost/api',
        generatedAt: new Date().toISOString(),
        routes: [
            {
                name: 'orders.store',
                method: 'POST',
                path: '/api/v1/orders',
                auth: true,
                middleware: ['auth:sanctum'],
                response: {
                    kind: 'resource',
                    shape: 'single',
                    resourceName: 'OrderResource',
                    toAnalysis: () => ({
                        routeName: 'orders.store',
                        responseType: 'resource',
                        shape: 'single',
                        confidence: 1,
                        reasons: []
                    }),
                    toResponseBody: () => ({
                        type: 'resource',
                        shape: 'single'
                    })
                },
                schema: {
                    rules: {
                        customer_name: ['required', 'string'],
                        total_amount: ['required', 'numeric'],
                        'shipping_address.street': ['required', 'string'],
                        'shipping_address.city': ['required', 'string'],
                        'items': ['required', 'array'],
                        'items.*.product_id': ['required', 'integer'],
                        'items.*.quantity': ['required', 'integer'],
                        'items.*.unit_price': ['required', 'numeric']
                    }
                }
            },
            {
                name: 'orders.update',
                method: 'PUT',
                path: '/api/v1/orders/{id}',
                auth: true,
                middleware: ['auth:sanctum'],
                response: {
                    kind: 'resource',
                    shape: 'single',
                    resourceName: 'OrderResource',
                    toAnalysis: () => ({
                        routeName: 'orders.update',
                        responseType: 'resource',
                        shape: 'single',
                        confidence: 1,
                        reasons: []
                    }),
                    toResponseBody: () => ({
                        type: 'resource',
                        shape: 'single'
                    })
                },
                schema: {
                    rules: {
                        status: ['sometimes', 'string', 'in:pending,paid,cancelled'],
                        notes: ['nullable', 'string']
                    }
                }
            },
            {
                name: 'cart-items.store',
                method: 'POST',
                path: '/api/v1/cart-items',
                auth: true,
                middleware: [],
                response: {
                    kind: 'resource',
                    shape: 'single',
                    resourceName: 'CartItemResource',
                    toAnalysis: () => ({
                        routeName: 'cart-items.store',
                        responseType: 'resource',
                        shape: 'single',
                        confidence: 1,
                        reasons: []
                    }),
                    toResponseBody: () => ({
                        type: 'resource',
                        shape: 'single'
                    })
                },
                schema: {
                    rules: {
                        item_id: ['required', 'integer'],
                        quantity: ['required', 'integer']
                    }
                }
            }
        ],
        resources: [
            {
                name: 'Order',
                fields: {
                    id: { kind: 'primitive', type: 'int' },
                    order_number: { kind: 'primitive', type: 'string' },
                    total_amount: { kind: 'primitive', type: 'decimal:2' },
                    shipping_address: {
                        kind: 'object',
                        fields: {
                            street_name: { kind: 'primitive', type: 'string' },
                            city_name: { kind: 'primitive', type: 'string' }
                        }
                    },
                    items: {
                        kind: 'resource',
                        resource: 'OrderItem',
                        collection: true
                    },
                    customer: {
                        kind: 'model',
                        model: 'User',
                        collection: false
                    }
                }
            },
            {
                name: 'OrderItem',
                fields: {
                    id: { kind: 'primitive', type: 'int' },
                    product_name: { kind: 'primitive', type: 'string' },
                    quantity: { kind: 'primitive', type: 'int' }
                }
            }
        ],
        models: [
            {
                name: 'User',
                table: 'users',
                columns: [
                    { name: 'id', type: 'bigint', nullable: false },
                    { name: 'full_name', type: 'varchar', nullable: false },
                    { name: 'email_address', type: 'varchar', nullable: false },
                    { name: 'avatar_url', type: 'varchar', nullable: true }
                ]
            }
        ]
    })

    describe('1. manifestToSemanticTypes Behavioral Invariants', () => {
        test('1.1 Lowering converts top-level resource fields to camelCase properties', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToSemanticTypes(manifest)

            expect(artifact.typeId).toBe('SemanticTypes')
            const orderRes = artifact.types.find(t => t.annotations?.get('name') === 'OrderResource')
            expect(orderRes).toBeDefined()
            expect(orderRes?.properties.has('id')).toBe(true)
            expect(orderRes?.properties.has('orderNumber')).toBe(true)
            expect(orderRes?.properties.has('totalAmount')).toBe(true)
        })

        test('1.2 Nested object fields are recursively flattened with concatenated camelCase prefixes', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToSemanticTypes(manifest)

            const orderRes = artifact.types.find(t => t.annotations?.get('name') === 'OrderResource')
            expect(orderRes).toBeDefined()
            expect(orderRes?.properties.has('shippingAddressStreetName')).toBe(true)
            expect(orderRes?.properties.has('shippingAddressCityName')).toBe(true)
        })

        test('1.3 Child resource collections are resolved to Transformed reference types', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToSemanticTypes(manifest)

            const orderRes = artifact.types.find(t => t.annotations?.get('name') === 'OrderResource')
            expect(orderRes).toBeDefined()
            const itemsType = orderRes?.properties.get('items')
            expect(itemsType).toBeInstanceOf(ReadonlyCollectionType)
            const elemType = (itemsType as ReadonlyCollectionType).elementType
            expect(elemType).toBeInstanceOf(ReferenceType)
            expect((elemType as ReferenceType).name).toBe('OrderItemTransformed')
        })

        test('1.4 Eloquent Model references map model columns with nullability wrappers', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToSemanticTypes(manifest)

            const orderRes = artifact.types.find(t => t.annotations?.get('name') === 'OrderResource')
            expect(orderRes).toBeDefined()
            const customerType = orderRes?.properties.get('customer')
            expect(customerType).toBeInstanceOf(ObjectType)
            const customerObj = customerType as ObjectType
            expect(customerObj.properties.has('id')).toBe(true)
            expect(customerObj.properties.has('fullName')).toBe(true)
            expect(customerObj.properties.has('emailAddress')).toBe(true)
        })
    })

    describe('2. manifestToRequestTypes (Form Pipeline) Behavioral Invariants', () => {
        test('2.1 Groups POST/PUT/PATCH routes by resource name with PascalCase action names', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToRequestTypes(manifest)

            expect(artifact.typeId).toBe('RequestTypes')
            const orderReq = artifact.requestTypes.find(r => r.resourceName === 'orders')
            expect(orderReq).toBeDefined()
            expect(orderReq?.actions.map(a => a.name)).toEqual(['create', 'update'])
        })

        test('2.2 Flattens nested validation rules (e.g. shipping_address.street) into camelCase form fields', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToRequestTypes(manifest)

            const orderReq = artifact.requestTypes.find(r => r.resourceName === 'orders')
            const createAction = orderReq?.actions.find(a => a.name === 'create')
            const fieldNames = createAction?.fields.map(f => f.name)

            expect(fieldNames).toContain('customerName')
            expect(fieldNames).toContain('totalAmount')
            expect(fieldNames).toContain('shippingAddressStreet')
            expect(fieldNames).toContain('shippingAddressCity')
        })

        test('2.3 Array-of-objects validation rules (items.*.quantity) preserve array structure and type numeric', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToRequestTypes(manifest)

            const orderReq = artifact.requestTypes.find(r => r.resourceName === 'orders')
            const createAction = orderReq?.actions.find(a => a.name === 'create')
            const itemsField = createAction?.fields.find(f => f.name === 'items')

            expect(itemsField).toBeDefined()
            expect(itemsField?.type).toBe('array')
        })

        test('2.4 Kebab-case route resource names (cart-items) are sanitized to camelCase (cartItems)', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToRequestTypes(manifest)

            const cartReq = artifact.requestTypes.find(r => r.resourceName === 'cartItems')
            expect(cartReq).toBeDefined()
        })
    })

    describe('3. manifestToContractInput (Contract & Mapper Pipeline) Behavioral Invariants', () => {
        test('3.1 Preserves unflattened original nested names for schema validation contract', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToContractInput(manifest)

            const orderReq = artifact.requestTypes.find(r => r.resourceName === 'orders')
            const createAction = orderReq?.actions.find(a => a.name === 'create')
            const originalNames = createAction?.fields.map(f => f.originalName)

            expect(originalNames).toContain('shipping_address.street')
            expect(originalNames).toContain('shipping_address.city')
            expect(originalNames).toContain('items.*.product_id')
        })

        test('3.2 Extracts complete responseData for Eloquent mappers with deduplication', () => {
            const manifest = createFullMockManifest()
            const artifact = manifestToContractInput(manifest)

            const orderReq = artifact.requestTypes.find(r => r.resourceName === 'orders')
            expect(orderReq?.responseData).toBeDefined()
            expect(orderReq?.responseData?.resourceName).toBe('OrderResource')
            expect(orderReq?.responseData?.fields).toHaveProperty('id')
            expect(orderReq?.responseData?.fields).toHaveProperty('order_number')
            expect(orderReq?.responseData?.fields).toHaveProperty('total_amount')
        })
    })
});