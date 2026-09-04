import { describe, test, expect } from 'vitest'
import {
    classifyRoute,
    matchRoute,
    CRUD_DISPATCH_REGISTRY,
    RouteDescriptor,
    GetCollectionRouteDescriptor,
    GetItemRouteDescriptor,
    MutationRouteDescriptor,
    DeletionRouteDescriptor,
    ParsedRoute,
    RouteHookKind,
    RequestContentType,
    ResponseDescriptor,
    VoidResponseDescriptor,
    RouteSecurityDescriptor,
    RouteSchemaPayload,
    RouteCacheInvalidationDescriptor,
    RouteExecutionSignature,
    RouteDescriptorKind,
    ROUTE_DESCRIPTOR_REGISTRY,
    ScannedRouteRegistry
} from '../../core/src'

describe('RouteDescriptor ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
    const createMockRoute = (overrides: Partial<ParsedRoute> = {}): ParsedRoute => {
        return {
            name: 'orders.index',
            method: 'GET',
            path: '/api/orders',
            resourceName: 'Order',
            groupName: 'orders',
            crudRole: 'index',
            runtimePath: '/orders',
            responseTypeName: 'OrderResponse',
            actionKind: 'list' as any,
            isMutating: false,
            hookKind: RouteHookKind.Query,
            invalidation: { targets: [], tags: [] } as RouteCacheInvalidationDescriptor,
            executionSignature: { kind: 'no_payload' } as RouteExecutionSignature,
            requestContentType: RequestContentType.None,
            parameters: [],
            pathParameters: [],
            queryParameters: [
                {
                    name: 'page',
                    propertyName: 'page',
                    required: false,
                    type: 'number' as any,
                    isArray: false,
                    default: 1
                }
            ],
            auth: true,
            security: { kind: 'sanctum', name: 'Sanctum' } as RouteSecurityDescriptor,
            middleware: ['auth:sanctum'],
            policies: [],
            rateLimit: null,
            response: new VoidResponseDescriptor(),
            errorResponses: [],
            schema: { rules: [], messages: [], attributes: [] },
            assignments: [],
            sourceFile: 'OrderController.php',
            sourceLine: 25,
            uri: 'api/orders',
            actionName: 'index',
            controllerName: 'OrderController',
            ...overrides
        }
    }

    test('1. classifyRoute maps index role to GetCollectionRouteDescriptor with 100% connected data', () => {
        const route = createMockRoute({ crudRole: 'index', method: 'GET' })
        const descriptor = classifyRoute(route)

        expect(descriptor.kind).toBe('get_collection')
        expect(descriptor.method).toBe('GET')
        expect(descriptor.runtimePath).toBe('/orders')
        expect(descriptor.groupName).toBe('orders')
        expect(descriptor.queryParameters).toHaveLength(1)
        expect(descriptor.sourceFile).toBe('OrderController.php')
        expect(descriptor.security.kind).toBe('sanctum')
    })

    test('2. classifyRoute maps show role to GetItemRouteDescriptor with path parameters', () => {
        const route = createMockRoute({
            crudRole: 'show',
            method: 'GET',
            path: '/api/orders/{id}',
            runtimePath: '/orders/:id',
            pathParameters: [
                {
                    name: 'id',
                    propertyName: 'id',
                    bindingField: null,
                    in: 'path' as any,
                    required: true,
                    type: 'number' as any
                }
            ]
        })
        const descriptor = classifyRoute(route)

        expect(descriptor.kind).toBe('get_item')
        expect(descriptor.method).toBe('GET')
        expect(descriptor.pathParameters).toHaveLength(1)
        expect(descriptor.pathParameters[0].propertyName).toBe('id')
    })

    test('3. classifyRoute maps create & update roles to MutationRouteDescriptor', () => {
        const createRoute = createMockRoute({
            crudRole: 'create',
            method: 'POST',
            hookKind: RouteHookKind.Mutation,
            isMutating: true,
            requestContentType: RequestContentType.Json
        })
        const createDesc = classifyRoute(createRoute)

        expect(createDesc.kind).toBe('mutation')
        expect(createDesc.method).toBe('POST')
        expect(createDesc.requestContentType).toBe('application/json')

        const updateRoute = createMockRoute({
            crudRole: 'update',
            method: 'PUT',
            hookKind: RouteHookKind.Mutation,
            isMutating: true,
            requestContentType: RequestContentType.Json
        })
        const updateDesc = classifyRoute(updateRoute)

        expect(updateDesc.kind).toBe('mutation')
        expect(updateDesc.method).toBe('PUT')
    })

    test('4. classifyRoute maps delete role to DeletionRouteDescriptor', () => {
        const deleteRoute = createMockRoute({
            crudRole: 'delete',
            method: 'DELETE',
            hookKind: RouteHookKind.Mutation,
            isMutating: true
        })
        const deleteDesc = classifyRoute(deleteRoute)

        expect(deleteDesc.kind).toBe('deletion')
        expect(deleteDesc.method).toBe('DELETE')
    })

    test('5. classifyRoute resolves custom routes via hookKind registry without if', () => {
        const customQuery = createMockRoute({
            crudRole: 'custom',
            method: 'GET',
            hookKind: RouteHookKind.Query
        })
        expect(classifyRoute(customQuery).kind).toBe('get_collection')

        const customMutation = createMockRoute({
            crudRole: 'custom',
            method: 'POST',
            hookKind: RouteHookKind.Mutation
        })
        expect(classifyRoute(customMutation).kind).toBe('mutation')
    })

    test('6. matchRoute executes pure visitor catamorphism with 0 if branching', () => {
        const routes: ParsedRoute[] = [
            createMockRoute({ crudRole: 'index', method: 'GET' }),
            createMockRoute({ crudRole: 'show', method: 'GET' }),
            createMockRoute({ crudRole: 'create', method: 'POST' }),
            createMockRoute({ crudRole: 'delete', method: 'DELETE' })
        ]

        const results = routes.map(classifyRoute).map(desc =>
            matchRoute(desc, {
                get_collection: (d: GetCollectionRouteDescriptor) => `collection:${d.groupName}:${d.method}`,
                get_item: (d: GetItemRouteDescriptor) => `item:${d.groupName}:${d.method}`,
                mutation: (d: MutationRouteDescriptor) => `mutation:${d.groupName}:${d.method}`,
                deletion: (d: DeletionRouteDescriptor) => `deletion:${d.groupName}:${d.method}`
            })
        )

        expect(results).toEqual([
            'collection:orders:GET',
            'item:orders:GET',
            'mutation:orders:POST',
            'deletion:orders:DELETE'
        ])
    })

    test('7. CRUD_DISPATCH_REGISTRY is immutable and covers all CrudRoles', () => {
        expect(Object.isFrozen(CRUD_DISPATCH_REGISTRY)).toBe(true)
        expect(Object.keys(CRUD_DISPATCH_REGISTRY).sort()).toEqual([
            'create',
            'custom',
            'delete',
            'index',
            'show',
            'update'
        ].sort())
    })

    test('8. ROUTE_DESCRIPTOR_REGISTRY enforces exhaustive metadata specifications for all ADT kinds', () => {
        expect(Object.isFrozen(ROUTE_DESCRIPTOR_REGISTRY)).toBe(true)
        expect(ROUTE_DESCRIPTOR_REGISTRY[RouteDescriptorKind.GetCollection]).toEqual({
            kind: 'get_collection',
            hookKind: RouteHookKind.Query,
            isMutating: false,
            allowsPayload: false
        })
        expect(ROUTE_DESCRIPTOR_REGISTRY[RouteDescriptorKind.Mutation]).toEqual({
            kind: 'mutation',
            hookKind: RouteHookKind.Mutation,
            isMutating: true,
            allowsPayload: true
        })
        expect(ROUTE_DESCRIPTOR_REGISTRY[RouteDescriptorKind.Deletion]).toEqual({
            kind: 'deletion',
            hookKind: RouteHookKind.Mutation,
            isMutating: true,
            allowsPayload: false
        })
    })

    test('9. ScannedRouteRegistry automatically partitions routes into ADT collections without if', () => {
        const routes: ParsedRoute[] = [
            createMockRoute({ crudRole: 'index', method: 'GET', name: 'orders.index' }),
            createMockRoute({ crudRole: 'show', method: 'GET', name: 'orders.show' }),
            createMockRoute({ crudRole: 'create', method: 'POST', name: 'orders.store' }),
            createMockRoute({ crudRole: 'update', method: 'PUT', name: 'orders.update' }),
            createMockRoute({ crudRole: 'delete', method: 'DELETE', name: 'orders.destroy' })
        ]

        const registry = ScannedRouteRegistry.fromRoutes(routes)

        expect(registry.all).toHaveLength(5)
        expect(registry.collections).toHaveLength(1)
        expect(registry.collections[0].name).toBe('orders.index')

        expect(registry.items).toHaveLength(1)
        expect(registry.items[0].name).toBe('orders.show')

        expect(registry.mutations).toHaveLength(2)
        expect(registry.mutations.map(m => m.name)).toEqual(['orders.store', 'orders.update'])

        expect(registry.deletions).toHaveLength(1)
        expect(registry.deletions[0].name).toBe('orders.destroy')

        // Test matchAll catamorphism
        const matched = registry.matchAll({
            get_collection: (c) => `GET_LIST:${c.name}`,
            get_item: (i) => `GET_ONE:${i.name}`,
            mutation: (m) => `MUTATE:${m.name}`,
            deletion: (d) => `DEL:${d.name}`
        })

        expect(matched).toEqual([
            'GET_LIST:orders.index',
            'GET_ONE:orders.show',
            'MUTATE:orders.store',
            'MUTATE:orders.update',
            'DEL:orders.destroy'
        ])
    })
})
