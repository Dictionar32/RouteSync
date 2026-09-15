import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
    ResolvedObjectType,
    ResolvedPrimitiveType,
    ResolvedProperty,
    ResolvedSemanticType,
} from '../ResolvedSemanticType';

describe('ResolvedObjectType contract', () => {
    it('represents properties as explicit objects', () => {
        expectTypeOf<ResolvedObjectType['properties']>().toEqualTypeOf<
            readonly ResolvedProperty[]
        >();
    });

    it('defines a property with an explicit name and semantic type', () => {
        expectTypeOf<ResolvedProperty['name']>().toEqualTypeOf<string>();
        expectTypeOf<ResolvedProperty['type']>().toEqualTypeOf<
            ResolvedSemanticType
        >();
    });

    it('keeps the object discriminator closed', () => {
        expectTypeOf<ResolvedObjectType['kind']>().toEqualTypeOf<'object'>();
    });

    it('preserves nested semantic types without free-form property keys', () => {
        const property: ResolvedProperty = {
            name: 'id',
            type: {
                kind: 'primitive',
                type: 'number',
            },
        };

        const object: ResolvedObjectType = {
            kind: 'object',
            properties: [property],
        };

        expect(object.properties).toEqual([property]);
        expect(object.properties[0].type).toEqual<ResolvedPrimitiveType>({
            kind: 'primitive',
            type: 'number',
        });
    });
});
