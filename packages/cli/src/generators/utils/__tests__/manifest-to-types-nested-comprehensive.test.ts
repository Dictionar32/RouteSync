/**
 * Comprehensive Nested Response Tests
 * 
 * Tests untuk 5 limitation scenarios yang disebutkan dalam review:
 * 1. Deep nesting (depth > 2)
 * 2. Nested object + resource reference
 * 3. Nested collection via resource
 * 4. Unknown/unresolved fields
 * 5. Circular resource references
 */

import { describe, test, expect } from 'vitest';
import { manifestToContractInput } from '../manifest-to-types';
import { PrimitiveType, ObjectType, ReadonlyCollectionType, CollectionKind, PrimitiveKind, ReferenceType } from '../../../../../core/src/compiler/types/SemanticType';
import type { RouteManifest } from '../../../../../core/src/types/route';

describe('Comprehensive Nested Response Tests', () => {

    test('LIMITATION 1: should handle deep nested objects (depth > 2)', () => {
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
        expect(addressObj).toBeDefined()
        expect(addressObj.properties.get('street')).toBeDefined()
        expect(addressObj.properties.get('city')).toBeDefined()
        expect(addressObj.properties.get('country')).toBeDefined()

        // Verify types at depth 3
        const streetField = addressObj.properties.get('street') as PrimitiveType
        const cityField = addressObj.properties.get('city') as PrimitiveType
        expect(streetField.type).toBe(PrimitiveKind.STRING)
        expect(cityField.type).toBe(PrimitiveKind.STRING)
    })

    test('LIMITATION 2: should handle nested object with resource reference', () => {
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

        // Resource reference should be resolved to collection
        expect(fields?.orders).toBeInstanceOf(ReadonlyCollectionType)
        const ordersCollection = fields?.orders as ReadonlyCollectionType
        expect(ordersCollection.elementType).toBeInstanceOf(ObjectType)

        // Verify nested resource structure
        const orderType = ordersCollection.elementType as ObjectType
        expect(orderType.properties.get('id')).toBeDefined()
        expect(orderType.properties.get('total')).toBeDefined()

        const idField = orderType.properties.get('id') as PrimitiveType
        expect(idField.type).toBe(PrimitiveKind.NUMBER)
    })

    test('LIMITATION 3: should handle nested collection via resource', () => {
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
        expect(addressesCollection.elementType).toBeInstanceOf(ObjectType)

        // Verify nested object in collection
        const addressType = addressesCollection.elementType as ObjectType
        expect(addressType.properties.get('street')).toBeInstanceOf(PrimitiveType)
        expect(addressType.properties.get('city')).toBeInstanceOf(PrimitiveType)
        expect(addressType.properties.get('zipCode')).toBeInstanceOf(PrimitiveType)

        const streetField = addressType.properties.get('street') as PrimitiveType
        expect(streetField.type).toBe(PrimitiveKind.STRING)
    })

    test('LIMITATION 4: should handle unknown/unresolved nested fields gracefully', () => {
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
                                // Simulate unresolved method_call
                                dynamic: {
                                    kind: 'method_call',
                                    resolved: {
                                        status: 'unresolved',
                                        confidence: 0,
                                        trace: []
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

        // Should not throw
        expect(() => {
            const artifact = manifestToContractInput(manifest)
            const fields = artifact.requestTypes[0].responseData?.fields

            expect(fields?.id).toBeInstanceOf(PrimitiveType)
            expect(fields?.metadata).toBeInstanceOf(ObjectType)

            const metadataObj = fields?.metadata as ObjectType
            expect(metadataObj.properties.get('valid')).toBeInstanceOf(PrimitiveType)

            // Unresolved field should either be ReferenceType or undefined
            const dynamicField = metadataObj.properties.get('dynamic')
            // It should exist but may be ReferenceType('unknown') or similar fallback
            expect(dynamicField).toBeDefined()
        }).not.toThrow()
    })

    test('LIMITATION 5: should prevent circular references with seen set', () => {
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
            expect(fields?.posts).toBeDefined()
        }).not.toThrow()

        // Verify the structure was created without infinite loop
        const artifact = manifestToContractInput(manifest)
        const fields = artifact.requestTypes[0].responseData?.fields

        expect(fields?.id).toBeInstanceOf(PrimitiveType)
        expect(fields?.posts).toBeDefined()

        // The circular reference should be detected by seen set
        // Implementation should handle this gracefully (ReferenceType or cut off)
        // This test verifies no infinite loop occurs
    })

    test('BONUS: complex nested scenario combining multiple limitations', () => {
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),

            routes: [{
                name: 'complex.response',
                method: 'GET',
                path: '/api/complex',
                auth: false,
                middleware: [],
                response: {
                    kind: 'object',
                    fields: {
                        // Level 1
                        status: { kind: 'primitive', type: 'string' },
                        data: {
                            kind: 'object',
                            fields: {
                                // Level 2
                                user: {
                                    kind: 'object',
                                    fields: {
                                        // Level 3
                                        id: { kind: 'primitive', type: 'number' },
                                        profile: {
                                            kind: 'object',
                                            fields: {
                                                // Level 4 - deep nesting
                                                bio: { kind: 'primitive', type: 'string' }
                                            }
                                        }
                                    }
                                },
                                // Resource reference at level 2
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
                        }
                    }
                },
                schema: { rules: {} }
            }],
            resources: [{
                name: 'OrderResource',
                fields: {
                    id: { kind: 'primitive', type: 'int' },
                    items: {
                        kind: 'method_call',
                        resolved: {
                            status: 'resolved',
                            type: 'resource',
                            resource: 'OrderItemResource',
                            collection: true,
                            confidence: 100,
                            trace: []
                        }
                    }
                }
            }, {
                name: 'OrderItemResource',
                fields: {
                    id: { kind: 'primitive', type: 'int' },
                    product: { kind: 'primitive', type: 'string' }
                }
            }]
        }

        const artifact = manifestToContractInput(manifest)
        const fields = artifact.requestTypes[0].responseData?.fields

        // Verify top level
        expect(fields?.status).toBeInstanceOf(PrimitiveType)
        expect(fields?.data).toBeInstanceOf(ObjectType)

        // Verify level 2
        const dataObj = fields?.data as ObjectType
        expect(dataObj.properties.get('user')).toBeInstanceOf(ObjectType)
        expect(dataObj.properties.get('orders')).toBeInstanceOf(ReadonlyCollectionType)

        // Verify deep nesting in user object
        const userObj = dataObj.properties.get('user') as ObjectType
        expect(userObj.properties.get('id')).toBeInstanceOf(PrimitiveType)
        expect(userObj.properties.get('profile')).toBeInstanceOf(ObjectType)

        const profileObj = userObj.properties.get('profile') as ObjectType
        expect(profileObj.properties.get('bio')).toBeInstanceOf(PrimitiveType)

        // Verify resource collection with nested resources
        const ordersCollection = dataObj.properties.get('orders') as ReadonlyCollectionType
        expect(ordersCollection.elementType).toBeInstanceOf(ObjectType)

        const orderType = ordersCollection.elementType as ObjectType
        expect(orderType.properties.get('id')).toBeDefined()
        expect(orderType.properties.get('items')).toBeInstanceOf(ReadonlyCollectionType)

        // Verify nested collection in resource
        const itemsCollection = orderType.properties.get('items') as ReadonlyCollectionType
        expect(itemsCollection.elementType).toBeInstanceOf(ObjectType)
    })
})
