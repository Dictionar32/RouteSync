import { describe, test, expect } from 'vitest'
import {
    matchResponse,
    RESPONSE_DESCRIPTOR_REGISTRY,
    ResponseKind,
    ResourceResponseDescriptor,
    ModelResponseDescriptor,
    InlineResponseDescriptor,
    VoidResponseDescriptor,
    ResponseDescriptor,
    classifyRoute,
    matchRoute,
    ParsedRoute,
    RouteHookKind,
    RequestContentType,
    RouteSecurityDescriptor,
    RouteSchemaPayload,
    RouteCacheInvalidationDescriptor,
    RouteExecutionSignature
} from '../../core/src'

describe('ResponseDescriptor ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
    test('1. matchResponse executes pure catamorphism on ResourceResponseDescriptor without if', () => {
        const resourceResponse = ResourceResponseDescriptor.single('ProductResource')

        const result = matchResponse(resourceResponse, {
            resource: (res) => `RESOURCE:${res.resourceName}:${res.readTypeName}`,
            model: (m) => `MODEL:${m.modelName}`,
            inline: (inl) => `INLINE:${inl.readTypeName}`,
            void: () => 'VOID'
        })

        expect(result).toBe('RESOURCE:ProductResource:ProductResourceTransformed')
    })

    test('2. matchResponse executes pure catamorphism on ModelResponseDescriptor', () => {
        const modelResponse = ModelResponseDescriptor.collection('User')

        const result = matchResponse(modelResponse, {
            resource: (res) => `RESOURCE:${res.resourceName}`,
            model: (m) => `MODEL:${m.modelName}:${m.shape}`,
            inline: (inl) => `INLINE:${inl.readTypeName}`,
            void: () => 'VOID'
        })

        expect(result).toBe('MODEL:User:collection')
    })

    test('3. matchResponse executes pure catamorphism on InlineResponseDescriptor', () => {
        const inlineResponse = InlineResponseDescriptor.create({
            domain: 'CustomStats',
            fields: []
        })

        const result = matchResponse(inlineResponse, {
            resource: (res) => `RESOURCE:${res.resourceName}`,
            model: (m) => `MODEL:${m.modelName}`,
            inline: (inl) => `INLINE:${inl.readTypeName}:${inl.mapperName}`,
            void: () => 'VOID'
        })

        expect(result).toBe('INLINE:CustomStatsTransformed:toCustomStatsRead')
    })

    test('4. matchResponse executes pure catamorphism on VoidResponseDescriptor', () => {
        const voidResponse = new VoidResponseDescriptor()

        const result = matchResponse(voidResponse, {
            resource: (res) => `RESOURCE:${res.resourceName}`,
            model: (m) => `MODEL:${m.modelName}`,
            inline: (inl) => `INLINE:${inl.readTypeName}`,
            void: (v) => `VOID:${v.kind}`
        })

        expect(result).toBe('VOID:void')
    })

    test('5. RESPONSE_DESCRIPTOR_REGISTRY enforces metadata specifications for all ResponseKinds', () => {
        expect(Object.isFrozen(RESPONSE_DESCRIPTOR_REGISTRY)).toBe(true)

        expect(RESPONSE_DESCRIPTOR_REGISTRY[ResponseKind.Resource]).toEqual({
            kind: 'resource',
            hasSchema: true,
            hasMapper: true,
            defaultStatusCode: 200
        })

        expect(RESPONSE_DESCRIPTOR_REGISTRY[ResponseKind.Model]).toEqual({
            kind: 'model',
            hasSchema: true,
            hasMapper: false,
            defaultStatusCode: 200
        })

        expect(RESPONSE_DESCRIPTOR_REGISTRY[ResponseKind.Inline]).toEqual({
            kind: 'inline',
            hasSchema: true,
            hasMapper: true,
            defaultStatusCode: 200
        })

        expect(RESPONSE_DESCRIPTOR_REGISTRY[ResponseKind.Void]).toEqual({
            kind: 'void',
            hasSchema: false,
            hasMapper: false,
            defaultStatusCode: 204
        })
    })

    test('6. Full Pipeline: Composes matchRoute and matchResponse with 0 if branching', () => {
        const route: ParsedRoute = {
            name: 'orders.show',
            method: 'GET',
            path: '/api/orders/{id}',
            resourceName: 'Order',
            groupName: 'orders',
            crudRole: 'show',
            runtimePath: '/orders/:id',
            responseTypeName: 'OrderResourceTransformed',
            actionKind: 'single' as any,
            isMutating: false,
            hookKind: RouteHookKind.Query,
            invalidation: { targets: [], tags: [] } as RouteCacheInvalidationDescriptor,
            executionSignature: { kind: 'no_payload' } as RouteExecutionSignature,
            requestContentType: RequestContentType.None,
            parameters: [],
            pathParameters: [
                {
                    name: 'id',
                    propertyName: 'id',
                    bindingField: null,
                    in: 'path' as any,
                    required: true,
                    type: 'number' as any
                }
            ],
            queryParameters: [],
            auth: true,
            security: { kind: 'sanctum', name: 'Sanctum' } as RouteSecurityDescriptor,
            middleware: ['auth:sanctum'],
            policies: [],
            rateLimit: null,
            response: ResourceResponseDescriptor.single('OrderResource'),
            errorResponses: [],
            schema: { rules: [], messages: [], attributes: [] },
            assignments: [],
            sourceFile: 'OrderController.php',
            sourceLine: 40,
            uri: 'api/orders/{id}',
            actionName: 'show',
            controllerName: 'OrderController'
        }

        const descriptor = classifyRoute(route)

        // Pure composed ADT pipeline:
        const sdkCallDeclaration = matchRoute(descriptor, {
            get_collection: (d) => `queryCollection(${d.groupName})`,
            get_item: (d) => {
                const returnType = matchResponse(d.response, {
                    resource: (res) => res.readTypeName,
                    model: (m) => `${m.modelName}Model`,
                    inline: (inl) => inl.readTypeName,
                    void: () => 'void'
                })
                return `queryItem<${returnType}>(${d.groupName}, ${d.pathParameters[0].propertyName})`
            },
            mutation: (d) => `mutate(${d.groupName})`,
            deletion: (d) => `delete(${d.groupName})`
        })

        expect(sdkCallDeclaration).toBe('queryItem<OrderResourceTransformed>(orders, id)')
    })
})
