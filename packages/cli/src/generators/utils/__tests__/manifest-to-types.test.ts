/**
 * manifest-to-types Tests
 *
 * Regression tests for the ContractCodeBuilder fix (analisa):
 * - Opsi D: fields yang resolved.type === 'resource' di-response di-resolve
 *   ke definisi resource di manifest (ObjectType / ReadonlyCollectionType)
 *   alih-alih jatuh ke fallback → `items: z.unknown()`.
 */

import { describe, test, expect } from 'vitest';
import { manifestToContractInput } from '../manifest-to-types';
import { ObjectType, ReadonlyCollectionType, CollectionKind } from '../../../../../core/src/compiler/types/SemanticType';
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
                            confidence: 100
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
                confidence: 100
            }
        };

        const artifact = manifestToContractInput(manifest);
        const order = artifact.requestTypes.find(r => r.resourceName === 'orders')!;

        const customer = order.responseData!.fields['customer'];
        expect(customer).toBeInstanceOf(ObjectType);
        expect((customer as ObjectType).annotations?.get('name')).toBe('OrderDetailResource');
    });
});
