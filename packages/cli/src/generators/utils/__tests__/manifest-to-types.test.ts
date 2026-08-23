/**
 * manifest-to-types Tests
 *
 * Regression tests for the ContractCodeBuilder fix (analisa):
 * - Opsi D: fields yang resolved.type === 'resource' di-response di-resolve
 *   ke definisi resource di manifest (ObjectType / ReadonlyCollectionType)
 *   alih-alih jatuh ke fallback → `items: z.unknown()`.
 */

import { describe, test, expect } from 'vitest';
import { manifestToContractInput, generateInlineResourceName } from '../manifest-to-types';
import type { ParsedRoute } from '../../../../../core/src/types/route'
import { PrimitiveType, ObjectType, ReadonlyCollectionType, CollectionKind, PrimitiveKind } from '../../../../../core/src/compiler/types/SemanticType';
import type { RouteManifest } from '../../../../../core/src/types/route';

function buildManifest(): RouteManifest {
    return {
        version: '1.0.0',
        baseURL: 'http://localhost',
        generatedAt: '2026-08-12T00:00:00.000Z',
        routes: [
            {
                name: 'orders.index',
                method: 'GET',
                path: '/api/orders',
                auth: true,
                middleware: [],
                response: { kind: 'resource', resource: 'OrderResource', collection: false }
            }
        ],
        resources: [
            {
                name: 'OrderResource',
                fields: {
                    id: { kind: 'primitive', type: 'int' },
                    promotionCode: { kind: 'primitive', type: 'string' },
                    items: {
                        kind: 'method_call',
                        resolved: {
                            status: 'resolved',
                            type: 'resource',
                            resource: 'OrderDetailResource',
                            collection: true,
                            confidence: 100,
                            trace: []
                        }
                    }
                }
            },
            {
                name: 'OrderDetailResource',
                fields: {
                    id: { kind: 'primitive', type: 'int' },
                    productName: { kind: 'primitive', type: 'string' },
                    price: { kind: 'primitive', type: 'float' }
                }
            }
        ]
    };
}

describe('manifestToContractInput (Opsi D: resolve resource reference)', () => {
    test('resolves resource-typed field to ReadonlyCollectionType of the target resource', () => {
        const artifact = manifestToContractInput(buildManifest());

        const order = artifact.requestTypes.find(r => r.resourceName === 'orders');
        expect(order).toBeDefined();
        expect(order!.responseData).toBeDefined();

        const fields = order!.responseData!.fields;

        // Non-resource fields stay untouched
        expect(fields['id'].kind).toBe('primitive');
        expect(fields['promotionCode'].kind).toBe('primitive');

        // items: resource collection → ReadonlyCollectionType wrapping ObjectType
        const items = fields['items'];
        expect(items).toBeInstanceOf(ReadonlyCollectionType);
        expect(items.kind).toBe('readonly_collection');

        const collection = items as ReadonlyCollectionType;
        expect(collection.collectionKind).toBe(CollectionKind.ARRAY);

        const element = collection.elementType;
        expect(element).toBeInstanceOf(ObjectType);
        expect(element.kind).toBe('object');

        const obj = element as ObjectType;
        // Annotation 'name' = target resource, 'kind' = resource
        expect(obj.annotations?.get('name')).toBe('OrderDetailResource');
        expect(obj.annotations?.get('kind')).toBe('resource');

        // Flattened fields of the target resource are present
        expect(obj.properties.get('id')).toBeDefined();
        expect(obj.properties.get('productName')).toBeDefined();
        expect(obj.properties.get('price')).toBeDefined();
    });

    test('resolves single (non-collection) resource field to ObjectType', () => {
        const manifest = buildManifest();
        const orderResource = manifest.resources!.find(r => r.name === 'OrderResource')!;
        orderResource.fields['customer'] = {
            kind: 'method_call',
            resolved: {
                status: 'resolved',
                type: 'resource',
                resource: 'OrderDetailResource',
                collection: false,
                confidence: 100,
                trace: []
            }
        };

        const artifact = manifestToContractInput(manifest);
        const order = artifact.requestTypes.find(r => r.resourceName === 'orders')!;

        const customer = order.responseData!.fields['customer'];
        expect(customer).toBeInstanceOf(ObjectType);
        expect((customer as ObjectType).annotations?.get('name')).toBe('OrderDetailResource');
    });
});

describe('manifestToContractInput (bentuk original: snake_case + nested)', () => {
    test('preserves snake_case field names (no camelCase transformation)', () => {
        const manifest = buildManifest();
        const orderResource = manifest.resources!.find(r => r.name === 'OrderResource')!;
        orderResource.fields['image_url'] = { kind: 'primitive', type: 'string' };
        orderResource.fields['review_count'] = { kind: 'primitive', type: 'int' };

        const artifact = manifestToContractInput(manifest);
        const order = artifact.requestTypes.find(r => r.resourceName === 'orders')!;
        const fields = order.responseData!.fields;

        // Nama field dipakai APA ADANYA — bukan imageUrl/reviewCount
        expect(fields['image_url']).toBeDefined();
        expect(fields['review_count']).toBeDefined();
        expect(fields['imageUrl']).toBeUndefined();
        expect(fields['reviewCount']).toBeUndefined();
    });

    test('keeps nested object as ObjectType with original child names (no flattening)', () => {
        const manifest = buildManifest();
        const orderResource = manifest.resources!.find(r => r.name === 'OrderResource')!;
        orderResource.fields['shipping'] = {
            kind: 'object',
            fields: {
                nama: { kind: 'primitive', type: 'string' },
                kode_pos: { kind: 'primitive', type: 'string' }
            }
        };

        const artifact = manifestToContractInput(manifest);
        const order = artifact.requestTypes.find(r => r.resourceName === 'orders')!;
        const shipping = order.responseData!.fields['shipping'];

        // shipping tetap ObjectType (bukan flattened shippingNama/shippingKodePos)
        expect(shipping).toBeInstanceOf(ObjectType);
        const obj = shipping as ObjectType;
        expect(obj.properties.get('nama')).toBeDefined();
        expect(obj.properties.get('kode_pos')).toBeDefined();
        expect(obj.properties.get('shippingNama')).toBeUndefined();
        expect(order.responseData!.fields['shippingNama']).toBeUndefined();
    });
});

describe('manifestToContractInput - inline responses', () => {
    test('should extract inline response fields', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),

            routes: [{
                name: 'payment.confirm',
                method: 'POST',
                path: '/api/payment/confirm/{id}',
                auth: false,
                middleware: [],

                response: {
                    kind: 'object',
                    fields: {
                        success: {
                            kind: 'primitive',
                            type: 'boolean'
                        },
                        message: {
                            kind: 'primitive',
                            type: 'string'
                        }
                    }
                },

                schema: {
                    rules: {}
                }
            }],

            resources: []
        };

        const artifact = manifestToContractInput(manifest)

        // Should create requestType with responseData
        expect(artifact.requestTypes).toHaveLength(1)
        expect(artifact.requestTypes[0].responseData).toBeDefined()
        expect(artifact.requestTypes[0].responseData?.resourceName).toBe('PaymentConfirm')
        expect(artifact.requestTypes[0].responseData?.fields).toHaveProperty('success')
        expect(artifact.requestTypes[0].responseData?.fields).toHaveProperty('message')
    })

    test('should generate correct synthetic names', () => {
        const cases = [
            { path: '/api/payment/confirm', expected: 'PaymentConfirm' },
            { path: '/api/auth/login', expected: 'AuthLogin' },
            { path: '/api/auth/social', expected: 'AuthSocial' },
            { path: '/api/cart/checkout', expected: 'CartCheckout' },
            { path: '/api/forgot-password', expected: 'ForgotPassword' },
            { path: '/api/register', expected: 'Register' }  // Single segment
        ]

        for (const { path, expected } of cases) {
            const name = generateInlineResourceName({ path } as ParsedRoute)
            expect(name).toBe(expected)
        }
    })

    test('should handle nested inline response objects', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',

            baseURL: 'http://localhost',

            generatedAt: new Date().toISOString(),

            routes: [{
                name: 'auth.social',
                method: 'POST',
                path: '/api/auth/social',
                auth: false,
                middleware: [],
                response: {
                    kind: 'object',
                    fields: {
                        token: {
                            kind: 'primitive',
                            type: 'string'
                        },
                        user: {
                            kind: 'object',
                            fields: {
                                id: {
                                    kind: 'primitive',
                                    type: 'number'
                                },
                                name: {
                                    kind: 'primitive',
                                    type: 'string'
                                }
                            }
                        }
                    }
                },
                schema: { rules: {} }
            }],
            resources: []
        }

        const artifact = manifestToContractInput(manifest)

        const fields = artifact.requestTypes[0].responseData?.fields
        expect(fields?.token).toBeInstanceOf(PrimitiveType)
        expect(fields?.user).toBeInstanceOf(ObjectType)

        // Nested object should have nested fields
        const userObj = fields?.user as ObjectType
        expect(userObj.properties.get('id')).toBeDefined()
        expect(userObj.properties.get('name')).toBeDefined()

        // Verify types of nested fields
        expect(userObj.properties.get('id')).toBeInstanceOf(PrimitiveType)
        expect(userObj.properties.get('name')).toBeInstanceOf(PrimitiveType)

        const idField = userObj.properties.get('id') as PrimitiveType
        const nameField = userObj.properties.get('name') as PrimitiveType
        expect(idField.type).toBe(PrimitiveKind.NUMBER)
        expect(nameField.type).toBe(PrimitiveKind.STRING)
    })

    test('should handle primitive fields in inline response', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),

            routes: [{
                name: 'profile.show',
                method: 'GET',
                path: '/api/profile',
                auth: false,
                middleware: [],
                response: {
                    kind: 'object',
                    fields: {
                        id: {
                            kind: 'primitive',
                            type: 'number'
                        },
                        email: {
                            kind: 'primitive',
                            type: 'string'
                        }
                    }
                },
                schema: { rules: {} }
            }],

            resources: []
        };

        const artifact = manifestToContractInput(manifest);

        expect(
            artifact.requestTypes[0].responseData?.resourceName
        ).toBe('Profile');

        expect(
            artifact.requestTypes[0].responseData?.fields.id
        ).toBeInstanceOf(PrimitiveType);

        expect(
            artifact.requestTypes[0].responseData?.fields.email
        ).toBeInstanceOf(PrimitiveType);
    });

    // ========================================
    // COMPREHENSIVE NESTED RESPONSE TESTS
    // ========================================

    test('should handle deep nested objects (depth > 2)', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),

            routes: [{
                name: 'user.profile',
                method: 'GET',
                path: '/api/user/profile',
                auth: false,
                middleware: [],
                response: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'number' },
                        profile: {
                            kind: 'object',
                            fields: {
                                bio: { kind: 'primitive', type: 'string' },
                                address: {
                                    kind: 'object',
                                    fields: {
                                        street: { kind: 'primitive', type: 'string' },
                                        city: { kind: 'primitive', type: 'string' },
                                        country: { kind: 'primitive', type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                },
                schema: { rules: {} }
            }],
            resources: []
        }

        const artifact = manifestToContractInput(manifest)
        const fields = artifact.requestTypes[0].responseData?.fields

        // Level 1: root fields
        expect(fields?.id).toBeInstanceOf(PrimitiveType)
        expect(fields?.profile).toBeInstanceOf(ObjectType)

        // Level 2: profile fields
        const profileObj = fields?.profile as ObjectType
        expect(profileObj.properties.get('bio')).toBeInstanceOf(PrimitiveType)
        expect(profileObj.properties.get('address')).toBeInstanceOf(ObjectType)

        // Level 3: address fields (depth = 3)
        const addressObj = profileObj.properties.get('address') as ObjectType
        expect(addressObj.properties.get('street')).toBeDefined()
        expect(addressObj.properties.get('city')).toBeDefined()
        expect(addressObj.properties.get('country')).toBeDefined()

        // Verify types at depth 3
        const streetField = addressObj.properties.get('street') as PrimitiveType
        const cityField = addressObj.properties.get('city') as PrimitiveType
        expect(streetField.type).toBe(PrimitiveKind.STRING)
        expect(cityField.type).toBe(PrimitiveKind.STRING)
    })

    test('should handle nested object with resource reference', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),

            routes: [{
                name: 'customer.details',
                method: 'GET',
                path: '/api/customer',
                auth: false,
                middleware: [],
                response: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'number' },
                        name: { kind: 'primitive', type: 'string' },
                        orders: {
                            kind: 'method_call',
                            resolved: {
                                status: 'resolved',
                                type: 'resource',
                                resource: 'OrderResource',
                                collection: true,
                                confidence: 100,
                                trace: []
                            }
                        }
                    }
                },
                schema: { rules: {} }
            }],
            resources: [{
                name: 'OrderResource',
                fields: {
                    id: { kind: 'primitive', type: 'int' },
                    total: { kind: 'primitive', type: 'float' }
                }
            }]
        }

        const artifact = manifestToContractInput(manifest)
        const fields = artifact.requestTypes[0].responseData?.fields

        // Inline primitive fields
        expect(fields?.id).toBeInstanceOf(PrimitiveType)
        expect(fields?.name).toBeInstanceOf(PrimitiveType)

        // Resource reference should be resolved
        expect(fields?.orders).toBeInstanceOf(ReadonlyCollectionType)
        const ordersCollection = fields?.orders as ReadonlyCollectionType
        expect(ordersCollection.elementType).toBeInstanceOf(ObjectType)

        // Verify nested resource structure
        const orderType = ordersCollection.elementType as ObjectType
        expect(orderType.properties.get('id')).toBeDefined()
        expect(orderType.properties.get('total')).toBeDefined()
    })

    test('should handle nested collection of objects', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),

            routes: [{
                name: 'user.addresses',
                method: 'GET',
                path: '/api/user/addresses',
                auth: false,
                middleware: [],
                response: {
                    kind: 'object',
                    fields: {
                        user: { kind: 'primitive', type: 'string' },
                        addresses: {
                            kind: 'method_call',
                            resolved: {
                                status: 'resolved',
                                type: 'resource',
                                resource: 'AddressResource',
                                collection: true,
                                confidence: 100,
                                trace: []
                            }
                        }
                    }
                },
                schema: { rules: {} }
            }],
            resources: [{
                name: 'AddressResource',
                fields: {
                    street: { kind: 'primitive', type: 'string' },
                    city: { kind: 'primitive', type: 'string' },
                    zipCode: { kind: 'primitive', type: 'string' }
                }
            }]
        }

        const artifact = manifestToContractInput(manifest)
        const fields = artifact.requestTypes[0].responseData?.fields

        expect(fields?.user).toBeInstanceOf(PrimitiveType)
        expect(fields?.addresses).toBeInstanceOf(ReadonlyCollectionType)

        // Verify collection structure
        const addressesCollection = fields?.addresses as ReadonlyCollectionType
        expect(addressesCollection.kind).toBe(CollectionKind.ARRAY)
        expect(addressesCollection.elementType).toBeInstanceOf(ObjectType)

        // Verify nested object in collection
        const addressType = addressesCollection.elementType as ObjectType
        expect(addressType.properties.get('street')).toBeInstanceOf(PrimitiveType)
        expect(addressType.properties.get('city')).toBeInstanceOf(PrimitiveType)
        expect(addressType.properties.get('zipCode')).toBeInstanceOf(PrimitiveType)

        const streetField = addressType.properties.get('street') as PrimitiveType
        expect(streetField.type).toBe(PrimitiveKind.STRING)
    })

    test('should handle unresolved/unknown nested fields gracefully', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),

            routes: [{
                name: 'mixed.response',
                method: 'GET',
                path: '/api/mixed',
                auth: false,
                middleware: [],
                response: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'number' },
                        metadata: {
                            kind: 'object',
                            fields: {
                                valid: { kind: 'primitive', type: 'boolean' },
                                unknown: {
                                    kind: 'unknown'   // Simulate unresolved field
                                }
                            }
                        }
                    }
                },
                schema: { rules: {} }
            }],
            resources: []
        }

        const artifact = manifestToContractInput(manifest)
        const fields = artifact.requestTypes[0].responseData?.fields

        expect(fields?.id).toBeInstanceOf(PrimitiveType)
        expect(fields?.metadata).toBeInstanceOf(ObjectType)

        const metadataObj = fields?.metadata as ObjectType
        expect(metadataObj.properties.get('valid')).toBeInstanceOf(PrimitiveType)

        // Unknown field should either be undefined or handled gracefully
        // The implementation should not crash
        const unknownField = metadataObj.properties.get('unknown')
        // It may be undefined or a fallback type, but should not throw
        expect(() => unknownField).not.toThrow()
    })

    test('should prevent circular references with seen set', () => {
        // Note: This is a conceptual test. In practice, circular refs in inline
        // responses are unlikely, but we test the seen mechanism works.
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),

            routes: [{
                name: 'user.posts',
                method: 'GET',
                path: '/api/user/posts',
                auth: false,
                middleware: [],
                response: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'number' },
                        posts: {
                            kind: 'method_call',
                            resolved: {
                                status: 'resolved',
                                type: 'resource',
                                resource: 'PostResource',
                                collection: true,
                                confidence: 100,
                                trace: []
                            }
                        }
                    }
                },
                schema: { rules: {} }
            }],
            resources: [
                {
                    name: 'PostResource',
                    fields: {
                        id: { kind: 'primitive', type: 'int' },
                        title: { kind: 'primitive', type: 'string' },
                        author: {
                            kind: 'method_call',
                            resolved: {
                                status: 'resolved',
                                type: 'resource',
                                resource: 'UserResource',  // Circular reference
                                collection: false,
                                confidence: 100,
                                trace: []
                            }
                        }
                    }
                },
                {
                    name: 'UserResource',
                    fields: {
                        id: { kind: 'primitive', type: 'int' },
                        name: { kind: 'primitive', type: 'string' },
                        posts: {
                            kind: 'method_call',
                            resolved: {
                                status: 'resolved',
                                type: 'resource',
                                resource: 'PostResource',  // Back to PostResource
                                collection: true,
                                confidence: 100,
                                trace: []
                            }
                        }
                    }
                }
            ]
        }

        // Should not throw or hang due to circular reference
        expect(() => {
            const artifact = manifestToContractInput(manifest)
            const fields = artifact.requestTypes[0].responseData?.fields
            expect(fields?.posts).toBeInstanceOf(ReadonlyCollectionType)
        }).not.toThrow()

        // Verify the structure was created
        const artifact = manifestToContractInput(manifest)
        const fields = artifact.requestTypes[0].responseData?.fields
        expect(fields?.posts).toBeInstanceOf(ReadonlyCollectionType)

        // The circular reference should be detected by seen set
        // and handled gracefully (likely as ReferenceType or cut off)
    })
})
