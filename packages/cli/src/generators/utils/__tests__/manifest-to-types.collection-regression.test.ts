/**
 * manifest-to-types — collection/array capability regression tests
 *
 * Purpose:
 *   Establish the current IR contract BEFORE implementing new collection support.
 *
 * Rules:
 *   - A passing test is an existing capability.
 *   - A failing test is a known limitation and must NOT be silently worked around.
 *   - These tests intentionally cover inline response collections separately from
 *     resource collections, because resource collection support already exists.
 */

import { describe, test, expect } from 'vitest';
import {
    manifestToContractInput,
} from '../manifest-to-types';
import type { RouteManifest } from '../../../../../core/src/types/route';
import {
    PrimitiveType,
    ObjectType,
    ReadonlyCollectionType,
    CollectionKind,
} from '../../../../../core/src/compiler/types/SemanticType';

function baseManifest(
    response: NonNullable<RouteManifest['routes'][number]['response']>,
): RouteManifest {
    return {
        version: '1.0.0',
        baseURL: 'http://localhost',
        generatedAt: new Date().toISOString(),
        routes: [{
            name: 'products.index',
            method: 'GET',
            path: '/api/products',
            auth: false,
            middleware: [],
            response,
        }],
        resources: [],
    };
}

describe('manifestToContractInput — collection capability matrix', () => {
    test('KNOWN CAPABILITY: resolved resource collection becomes ReadonlyCollectionType', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),
            routes: [{
                name: 'orders.index',
                method: 'GET',
                path: '/api/orders',
                auth: false,
                middleware: [],
                response: {
                    kind: 'resource',
                    resource: 'OrderResource',
                    collection: false,
                },
            }],
            resources: [
                {
                    name: 'OrderResource',
                    fields: {
                        items: {
                            kind: 'method_call',
                            resolved: {
                                status: 'resolved',
                                type: 'resource',
                                resource: 'OrderDetailResource',
                                collection: true,
                                confidence: 100,
                                trace: [],
                            },
                        },
                    },
                },
                {
                    name: 'OrderDetailResource',
                    fields: {
                        id: { kind: 'primitive', type: 'int' },
                        name: { kind: 'primitive', type: 'string' },
                    },
                },
            ],
        };

        const artifact = manifestToContractInput(manifest);
        const order = artifact.requestTypes.find(
            request => request.resourceName === 'orders',
        )!;

        const items = order.responseData!.fields.items;

        expect(items).toBeInstanceOf(ReadonlyCollectionType);

        const collection = items as ReadonlyCollectionType;
        expect(collection.collectionKind).toBe(CollectionKind.ARRAY);
        expect(collection.elementType).toBeInstanceOf(ObjectType);

        const element = collection.elementType as ObjectType;
        expect(element.annotations?.get('kind')).toBe('resource');
        expect(element.annotations?.get('name')).toBe('OrderDetailResource');
        expect(element.properties.get('id')).toBeInstanceOf(PrimitiveType);
        expect(element.properties.get('name')).toBeInstanceOf(PrimitiveType);
    });

    test('CAPABILITY CHECK: inline object response is represented as ObjectType', () => {
        const manifest = baseManifest({
            kind: 'object',
            fields: {
                id: {
                    kind: 'primitive',
                    type: 'number',
                },
                name: {
                    kind: 'primitive',
                    type: 'string',
                },
            },
        });

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData!;

        expect(response.fields).toBeDefined();
        expect(response.fields.id).toBeInstanceOf(PrimitiveType);
        expect(response.fields.name).toBeInstanceOf(PrimitiveType);
    });

    test('REGRESSION: canonical inline model array becomes a ReadonlyCollectionType', () => {
        const manifest = baseManifest({
            kind: 'object',
            fields: {
                data: {
                    kind: 'array',
                    element: {
                        kind: 'model',
                        model: 'Category',
                        collection: false,
                    },
                },
            },
        });

        const artifact = manifestToContractInput(manifest);
        const data = artifact.requestTypes[0].responseData!.fields.data;

        expect(data).toBeInstanceOf(ReadonlyCollectionType);
        expect((data as ReadonlyCollectionType).collectionKind).toBe(CollectionKind.ARRAY);
    });

    test('COMPATIBILITY: legacy inline model collection remains readable', () => {
        const manifest = baseManifest({
            kind: 'object',
            fields: {
                data: {
                    kind: 'model',
                    model: 'Category',
                    collection: true,
                },
            },
        });

        const artifact = manifestToContractInput(manifest);
        const data = artifact.requestTypes[0].responseData!.fields.data;

        expect(data).toBeInstanceOf(ReadonlyCollectionType);
        expect((data as ReadonlyCollectionType).collectionKind).toBe(CollectionKind.ARRAY);
    });

    test('REGRESSION: canonical top-level resource array is retained as response data', () => {
        const manifest = baseManifest({
            kind: 'array',
            element: {
                kind: 'resource',
                resource: 'ProdukItemResource',
                collection: false,
            },
        });
        manifest.resources = [{
            name: 'ProdukItemResource',
            fields: {
                id: { kind: 'primitive', type: 'number' },
            },
        }];

        const artifact = manifestToContractInput(manifest);
        const data = artifact.requestTypes[0].responseData!.fields.data;

        expect(data).toBeInstanceOf(ReadonlyCollectionType);
        expect((data as ReadonlyCollectionType).elementType).toBeInstanceOf(ObjectType);
    });

    test('REGRESSION: paginator response keeps its nested data collection', () => {
        const manifest = baseManifest({
            kind: 'object',
            fields: {
                reviews: {
                    kind: 'object',
                    paginated: true,
                    fields: {
                        data: {
                            kind: 'array',
                            element: {
                                kind: 'model',
                                model: 'ProductReview',
                                collection: false,
                            },
                        },
                    },
                },
            },
        });

        const artifact = manifestToContractInput(manifest);
        const reviews = artifact.requestTypes[0].responseData!.fields.reviews;

        expect(reviews).toBeInstanceOf(ObjectType);
        expect((reviews as ObjectType).properties.get('data')).toBeInstanceOf(ReadonlyCollectionType);
    });

    /**
     * INTENTIONAL LIMITATION TEST
     *
     * This is the important test for the current design question:
     *
     *   response:
     *     kind: object
     *     collection: true
     *     fields: ...
     *
     * If this fails, that is evidence that the current manifest-to-types
     * implementation does not yet model inline object[] and therefore needs
     * a separate implementation. Do not weaken this assertion.
     */
    test('CAPABILITY TARGET: inline object collection becomes ReadonlyCollectionType<ObjectType>', () => {
        const manifest = baseManifest({
            kind: 'object',
            collection: true,
            fields: {
                id: {
                    kind: 'primitive',
                    type: 'number',
                },
                name: {
                    kind: 'primitive',
                    type: 'string',
                },
            },
        });

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData!;

        // The response itself is expected to expose the collection element
        // through the existing field representation. This assertion deliberately
        // fails until inline collection semantics are implemented.
        const data = response.fields.data;

        expect(data).toBeInstanceOf(ReadonlyCollectionType);

        const collection = data as ReadonlyCollectionType;
        expect(collection.collectionKind).toBe(CollectionKind.ARRAY);
        expect(collection.elementType).toBeInstanceOf(ObjectType);

        const element = collection.elementType as ObjectType;
        expect(element.properties.get('id')).toBeInstanceOf(PrimitiveType);
        expect(element.properties.get('name')).toBeInstanceOf(PrimitiveType);
    });

    test('CAPABILITY TARGET: nested inline object remains an ObjectType', () => {
        const manifest = baseManifest({
            kind: 'object',
            fields: {
                data: {
                    kind: 'object',
                    fields: {
                        id: {
                            kind: 'primitive',
                            type: 'number',
                        },
                        name: {
                            kind: 'primitive',
                            type: 'string',
                        },
                    },
                },
            },
        });

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData!;

        const data = response.fields.data;

        expect(data).toBeInstanceOf(ObjectType);

        const object = data as ObjectType;
        expect(object.properties.get('id')).toBeInstanceOf(PrimitiveType);
        expect(object.properties.get('name')).toBeInstanceOf(PrimitiveType);
    });

    /**
     * INTENTIONAL LIMITATION TEST
     *
     * Primitive arrays are tested independently because supporting
     * resource[] does not automatically prove primitive[] support.
     */
    test('CAPABILITY TARGET: inline primitive array is represented as ReadonlyCollectionType<PrimitiveType>', () => {
        const manifest = baseManifest({
            kind: 'object',
            fields: {
                roles: {
                    kind: 'array',
                    element: {
                        kind: 'primitive',
                        type: 'string',
                    },
                },
            },
        });

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData!;

        const roles = response.fields.roles;

        expect(roles).toBeInstanceOf(ReadonlyCollectionType);

        const collection = roles as ReadonlyCollectionType;
        expect(collection.collectionKind).toBe(CollectionKind.ARRAY);
        expect(collection.elementType).toBeInstanceOf(PrimitiveType);
    });

    /**
     * INTENTIONAL LIMITATION TEST
     *
     * Nested arrays must be represented recursively:
     * array<array<object>>.
     */
    test('CAPABILITY TARGET: nested inline arrays preserve array nesting', () => {
        const manifest = baseManifest({
            kind: 'object',
            fields: {
                groups: {
                    kind: 'array',
                    element: {
                        kind: 'array',
                        element: {
                            kind: 'object',
                            fields: {
                                id: {
                                    kind: 'primitive',
                                    type: 'number',
                                },
                            },
                        },
                    },
                },
            },
        });

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData!;

        const groups = response.fields.groups;

        expect(groups).toBeInstanceOf(ReadonlyCollectionType);

        const outer = groups as ReadonlyCollectionType;
        expect(outer.elementType).toBeInstanceOf(ReadonlyCollectionType);

        const inner = outer.elementType as ReadonlyCollectionType;
        expect(inner.elementType).toBeInstanceOf(ObjectType);

        const item = inner.elementType as ObjectType;
        expect(item.properties.get('id')).toBeInstanceOf(PrimitiveType);
    });
});
