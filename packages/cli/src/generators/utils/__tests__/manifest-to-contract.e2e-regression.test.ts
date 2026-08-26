/**
 * manifest-to-contract — end-to-end regression tests
 *
 * Purpose:
 *   Lock the contract boundary from RouteManifest -> Contract IR.
 *
 * These tests intentionally distinguish:
 *   1. response data that is actually described by the manifest
 *   2. null/unknown response data
 *   3. resource collections
 *   4. inline object collections
 *
 * No model fallback is allowed to manufacture response fields that are
 * absent from the manifest.
 */

import { describe, test, expect } from 'vitest';
import { manifestToContractInput } from '../manifest-to-types';
import type { RouteManifest } from '../../../../../core/src/types/route';
import {
    PrimitiveType,
    ObjectType,
    ReadonlyCollectionType,
    CollectionKind,
} from '../../../../../core/src/compiler/types/SemanticType';

function manifestWithResponse(
    routeName: string,
    path: string,
    response: any,
): RouteManifest {
    return {
        version: '1.0.0',
        baseURL: 'http://localhost',
        generatedAt: new Date().toISOString(),
        routes: [{
            name: routeName,
            method: 'POST',
            path,
            auth: false,
            middleware: [],
            response,
        }],
        resources: [],
    };
}

describe('manifestToContractInput — response fidelity', () => {
    test('register response with concrete data is preserved from manifest', () => {
        const manifest = manifestWithResponse(
            'register',
            '/register',
            {
                kind: 'object',
                fields: {
                    success: {
                        kind: 'primitive',
                        type: 'boolean',
                    },
                    message: {
                        kind: 'primitive',
                        type: 'string',
                    },
                    data: {
                        kind: 'object',
                        fields: {
                            token: {
                                kind: 'primitive',
                                type: 'string',
                            },
                            user: {
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
                    },
                },
            },
        );

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData!;

        expect(response.resourceName).toBe('Register');
        expect(response.fields.success).toBeInstanceOf(PrimitiveType);
        expect(response.fields.message).toBeInstanceOf(PrimitiveType);

        const data = response.fields.data;
        expect(data).toBeInstanceOf(ObjectType);

        const dataObject = data as ObjectType;
        expect(dataObject.properties.get('token')).toBeInstanceOf(PrimitiveType);

        const user = dataObject.properties.get('user');
        expect(user).toBeInstanceOf(ObjectType);

        const userObject = user as ObjectType;
        expect(userObject.properties.get('id')).toBeInstanceOf(PrimitiveType);
        expect(userObject.properties.get('name')).toBeInstanceOf(PrimitiveType);
    });

    test('register response does not invent fields when response data is unknown', () => {
        const manifest = manifestWithResponse(
            'register',
            '/register',
            {
                kind: 'unknown',
            },
        );

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData;

        // The manifest does not describe a concrete response object.
        // This test explicitly protects against silently importing a model
        // just to manufacture response fields.
        expect(response).toBeDefined();

        if (response) {
            expect(Object.keys(response.fields)).toHaveLength(0);
        }
    });

    test('resource collection preserves resource element structure', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),
            routes: [{
                name: 'orders',
                method: 'GET',
                path: '/orders',
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
        const response = artifact.requestTypes[0].responseData!;
        const items = response.fields.items;

        expect(items).toBeInstanceOf(ReadonlyCollectionType);

        const collection = items as ReadonlyCollectionType;
        expect(collection.collectionKind).toBe(CollectionKind.ARRAY);
        expect(collection.elementType).toBeInstanceOf(ObjectType);

        const item = collection.elementType as ObjectType;
        expect(item.annotations?.get('kind')).toBe('resource');
        expect(item.annotations?.get('name')).toBe('OrderDetailResource');
        expect(item.properties.get('id')).toBeInstanceOf(PrimitiveType);
        expect(item.properties.get('name')).toBeInstanceOf(PrimitiveType);
    });

    test('nested inline object remains nested and is not flattened', () => {
        const manifest = manifestWithResponse(
            'profile',
            '/profile',
            {
                kind: 'object',
                fields: {
                    data: {
                        kind: 'object',
                        fields: {
                            id: {
                                kind: 'primitive',
                                type: 'number',
                            },
                            profile: {
                                kind: 'object',
                                fields: {
                                    display_name: {
                                        kind: 'primitive',
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        );

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData!;
        const data = response.fields.data as ObjectType;

        expect(data).toBeInstanceOf(ObjectType);
        expect(data.properties.get('id')).toBeInstanceOf(PrimitiveType);
        expect(data.properties.get('profile')).toBeInstanceOf(ObjectType);

        const profile = data.properties.get('profile') as ObjectType;
        expect(profile.properties.get('display_name')).toBeInstanceOf(PrimitiveType);

        expect(response.fields['data.id']).toBeUndefined();
        expect(response.fields['data.profile']).toBeUndefined();
    });

    /**
     * Capability test:
     *
     * If this fails, inline object[] is a known limitation of the current
     * manifest-to-types implementation and must be implemented separately.
     */
    test('capability: inline object collection is represented as array of object', () => {
        const manifest = manifestWithResponse(
            'products',
            '/products',
            {
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
            },
        );

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData!;

        const data = response.fields.data;

        expect(data).toBeInstanceOf(ReadonlyCollectionType);

        const collection = data as ReadonlyCollectionType;
        expect(collection.collectionKind).toBe(CollectionKind.ARRAY);
        expect(collection.elementType).toBeInstanceOf(ObjectType);

        const item = collection.elementType as ObjectType;
        expect(item.properties.get('id')).toBeInstanceOf(PrimitiveType);
        expect(item.properties.get('name')).toBeInstanceOf(PrimitiveType);
    });

    /**
     * Capability test:
     * primitive arrays must be independently supported; resource[] support
     * does not prove primitive[] support.
     */
    test('capability: primitive array is represented as ReadonlyCollectionType', () => {
        const manifest = manifestWithResponse(
            'roles',
            '/roles',
            {
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
            },
        );

        const artifact = manifestToContractInput(manifest);
        const response = artifact.requestTypes[0].responseData!;

        const roles = response.fields.roles;

        expect(roles).toBeInstanceOf(ReadonlyCollectionType);

        const collection = roles as ReadonlyCollectionType;
        expect(collection.collectionKind).toBe(CollectionKind.ARRAY);
        expect(collection.elementType).toBeInstanceOf(PrimitiveType);
    });
});
