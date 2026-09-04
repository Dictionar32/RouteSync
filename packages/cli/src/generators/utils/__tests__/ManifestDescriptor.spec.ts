import { describe, test, expect } from 'vitest';
import { ManifestDescriptor } from '../ManifestDescriptor';

describe('ManifestDescriptor Specification (TDD Suite)', () => {
    test('1. Resolves omitted fields to frozen empty arrays without ?? fallbacks (0 undefined)', () => {
        const descriptor = new ManifestDescriptor({});
        expect(descriptor.routes).toEqual([]);
        expect(descriptor.resources).toEqual([]);
        expect(descriptor.models).toEqual([]);
        expect(descriptor.requestTypes).toEqual([]);
        expect(descriptor.semanticTypes).toEqual([]);
        expect(Object.isFrozen(descriptor.routes)).toBe(true);
        expect(Object.isFrozen(descriptor.requestTypes)).toBe(true);
        expect(Object.isFrozen(descriptor.semanticTypes)).toBe(true);
    });

    test('2. Preserves provided route and resource arrays immutably', () => {
        const descriptor = new ManifestDescriptor({
            routes: [{ path: '/api/orders', method: 'GET' } as any],
            resources: [{ name: 'OrderResource', baseName: 'Order', typeName: 'OrderResourceTransformed', fields: [] }]
        });

        expect(descriptor.routes).toHaveLength(1);
        expect(descriptor.resources).toHaveLength(1);
        expect(descriptor.models).toHaveLength(0);
        expect(descriptor.requestTypes).toHaveLength(0);
        expect(descriptor.semanticTypes).toHaveLength(0);
    });
});