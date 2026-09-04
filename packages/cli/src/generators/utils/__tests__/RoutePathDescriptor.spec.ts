import { describe, test, expect, expectTypeOf } from 'vitest';
import { RoutePathDescriptor } from '../RoutePathDescriptor';

describe('RoutePathDescriptor Value Object Specification (TDD Suite)', () => {
    test('1. Extracts simple resource names from standard paths', () => {
        const desc = new RoutePathDescriptor({ path: '/api/users' });
        expect(desc.resourceName).toBe('users');
        expect(desc.segments).toEqual(['users']);
    });

    test('2. Filters out route parameters ({id}) and derives base resource', () => {
        const desc = new RoutePathDescriptor({ path: '/api/users/{id}' });
        expect(desc.resourceName).toBe('users');
    });

    test('3. Concatenates multi-segment paths with camelCase head and PascalCase tail', () => {
        const desc = new RoutePathDescriptor({ path: '/api/cart/items' });
        expect(desc.resourceName).toBe('cartItems');
    });

    test('4. Sanitizes kebab-case segments into camelCase names', () => {
        const desc = new RoutePathDescriptor({ path: '/api/v1/order-items/{id}' });
        expect(desc.resourceName).toBe('v1OrderItems');
    });

    test('5. Gracefully handles root or empty paths with empty string (0 null)', () => {
        const desc = new RoutePathDescriptor({ path: '/' });
        expect(desc.resourceName).toBe('');
        expect(desc.segments).toHaveLength(0);
    });
});