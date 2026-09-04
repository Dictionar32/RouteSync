import { describe, test, expect } from 'vitest';
import { RouteEndpointDescriptor } from '../RouteEndpointDescriptor';

describe('RouteEndpointDescriptor Domain Entity Specification (TDD Suite)', () => {
    test('1. Constructs complete immutable route endpoint entity from upstream manifest contract', () => {
        const desc = new RouteEndpointDescriptor({
            path: '/api/v1/orders/{id}',
            method: 'GET',
            resourceName: 'orders',
            responseTypeName: 'OrderDetailResponse',
            parameters: [{ name: 'id', in: 'path', required: true }]
        });

        expect(desc.path).toBe('/api/v1/orders/{id}');
        expect(desc.method).toBe('GET');
        expect(desc.resourceName).toBe('orders');
        expect(desc.responseTypeName).toBe('OrderDetailResponse');
        expect(desc.parameters).toHaveLength(1);
        expect(desc.parameters[0].name).toBe('id');
    });

    test('2. Freezes instance and parameters to prevent mutations', () => {
        const desc = new RouteEndpointDescriptor({
            path: '/api/users',
            method: 'POST',
            resourceName: 'users',
            responseTypeName: 'CreateUserResponse',
            parameters: []
        });

        expect(Object.isFrozen(desc)).toBe(true);
        expect(Object.isFrozen(desc.parameters)).toBe(true);
    });
});