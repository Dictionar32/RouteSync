import { describe, it, expect } from 'vitest';
import { ObjectType, PrimitiveType } from '../../../types/SemanticType';
import { ImmutableMap, ImmutableSet } from '../../../utils/ImmutableCollections';
import { SemanticTypeResolver } from '../SemanticTypeResolver';
import { ResolvedObjectType } from '../ResolvedSemanticType';

describe('Suite 3: Domain Metadata & Identity Extraction at Origin Boundary', () => {
    const resolver = new SemanticTypeResolver();

    it('3.1 should extract Eloquent JsonResource identity from ObjectType annotations', () => {
        const props = new ImmutableMap(new Map([
            ['id', new PrimitiveType('number')]
        ]));
        const annotations = new ImmutableMap(new Map([
            ['name', 'OrderDetailResource'],
            ['kind', 'resource']
        ]));

        const rawResourceObj = new ObjectType(props, new ImmutableSet(new Set()), undefined, [], annotations);
        const resolved = resolver.resolve(rawResourceObj);

        expect(resolved.kind).toBe('object');
        const obj = resolved as ResolvedObjectType;
        expect(obj.objectKind).toBe('resource');
        expect(obj.resourceName).toBe('OrderDetailResource');
    });

    it('3.2 should extract Eloquent Model identity from ObjectType annotations', () => {
        const props = new ImmutableMap(new Map([
            ['id', new PrimitiveType('number')]
        ]));
        const annotations = new ImmutableMap(new Map([
            ['name', 'User'],
            ['kind', 'model']
        ]));

        const rawModelObj = new ObjectType(props, new ImmutableSet(new Set()), undefined, [], annotations);
        const resolved = resolver.resolve(rawModelObj);

        expect(resolved.kind).toBe('object');
        const obj = resolved as ResolvedObjectType;
        expect(obj.objectKind).toBe('model');
        expect(obj.typeName).toBe('User');
    });

    it('3.3 should classify anonymous structural object as objectKind = plain', () => {
        const props = new ImmutableMap(new Map([
            ['key', new PrimitiveType('string')]
        ]));
        const rawPlainObj = new ObjectType(props, new ImmutableSet(new Set()), undefined, [], new ImmutableMap(new Map()));
        const resolved = resolver.resolve(rawPlainObj);

        expect(resolved.kind).toBe('object');
        const obj = resolved as ResolvedObjectType;
        expect(obj.objectKind).toBe('plain');
        expect(obj.resourceName).toBeUndefined();
        expect(obj.typeName).toBeUndefined();
    });
});
