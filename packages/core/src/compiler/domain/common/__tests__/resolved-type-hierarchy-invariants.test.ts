import { describe, it, expect } from 'vitest';
import {
    ResolvedPrimitiveType,
    ResolvedReferenceType,
    ResolvedObjectType,
    ResolvedNullableType,
    ResolvedCollectionType,
    ResolvedUnionType,
    ResolvedIntersectionType,
    ResolvedUnknownType,
    type ResolvedField,
    type ObjectKind
} from '../ResolvedSemanticType';

describe('Suite 1: Hierarchy & Constructor Invariants', () => {
    it('1.1 should enforce immutability across all ResolvedSemanticType instances', () => {
        const prim = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const ref = new ResolvedReferenceType({ name: 'User', namespace: 'App\\Models' });
        const obj = new ResolvedObjectType({
            objectKind: 'resource',
            resourceName: 'OrderDetailResource',
            fields: [['id', prim]]
        });
        const nullable = new ResolvedNullableType({ innerType: obj });
        const collection = new ResolvedCollectionType({ elementType: obj });
        const union = new ResolvedUnionType({ members: [prim, ref] });
        const intersection = new ResolvedIntersectionType({ members: [obj, ref] });
        const unknown = new ResolvedUnknownType({ diagnosticMessage: 'Unresolved AST' });

        expect(Object.isFrozen(prim)).toBe(true);
        expect(Object.isFrozen(ref)).toBe(true);
        expect(Object.isFrozen(obj)).toBe(true);
        expect(Object.isFrozen(nullable)).toBe(true);
        expect(Object.isFrozen(collection)).toBe(true);
        expect(Object.isFrozen(union)).toBe(true);
        expect(Object.isFrozen(intersection)).toBe(true);
        expect(Object.isFrozen(unknown)).toBe(true);
    });

    it('1.2 should match discriminator kind across all 6 Type Families', () => {
        const prim = new ResolvedPrimitiveType({ primitiveKind: 'number' });
        const ref = new ResolvedReferenceType({ name: 'Order', namespace: '' });
        const obj = new ResolvedObjectType();
        const nullable = new ResolvedNullableType({ innerType: prim });
        const collection = new ResolvedCollectionType({ elementType: prim });
        const union = new ResolvedUnionType({ members: [prim] });
        const intersection = new ResolvedIntersectionType({ members: [obj] });
        const unknown = new ResolvedUnknownType({ diagnosticMessage: 'err' });

        expect(prim.kind).toBe('primitive');
        expect(ref.kind).toBe('reference');
        expect(obj.kind).toBe('object');
        expect(nullable.kind).toBe('nullable');
        expect(collection.kind).toBe('collection');
        expect(union.kind).toBe('union');
        expect(intersection.kind).toBe('intersection');
        expect(unknown.kind).toBe('unknown');
    });

    it('1.3 should represent objectKind and resourceName on ResolvedObjectType', () => {
        const resourceObj = new ResolvedObjectType({
            objectKind: 'resource',
            resourceName: 'OrderDetailResource'
        });
        expect(resourceObj.objectKind).toBe('resource');
        expect(resourceObj.resourceName).toBe('OrderDetailResource');

        const plainObj = new ResolvedObjectType();
        expect(plainObj.objectKind).toBe('plain');
        expect(plainObj.resourceName).toBeUndefined();
    });

    it('1.4 should distinguish field optionality on ResolvedField from ResolvedNullableType', () => {
        const str = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const nullableStr = new ResolvedNullableType({ innerType: str });

        // Required field with nullable type: user: string | null
        const requiredNullableField: ResolvedField = ['user', nullableStr, false];
        expect(requiredNullableField[0]).toBe('user');
        expect(requiredNullableField[1].kind).toBe('nullable');
        expect(requiredNullableField[2]).toBe(false);

        // Optional field with non-nullable type: user?: string
        const optionalField: ResolvedField = ['user', str, true];
        expect(optionalField[0]).toBe('user');
        expect(optionalField[1].kind).toBe('primitive');
        expect(optionalField[2]).toBe(true);
    });
});

describe('Suite 2: Recursive Topology & Wrapper Order', () => {
    it('2.1 should preserve outer Nullable Collection topology (User[] | null)', () => {
        const userObj = new ResolvedObjectType({
            objectKind: 'model',
            typeName: 'User'
        });
        const collection = new ResolvedCollectionType({ elementType: userObj });
        const nullableCollection = new ResolvedNullableType({ innerType: collection });

        expect(nullableCollection.kind).toBe('nullable');
        expect(nullableCollection.innerType.kind).toBe('collection');
        const innerColl = nullableCollection.innerType as ResolvedCollectionType;
        expect(innerColl.elementType.kind).toBe('object');
        const innerObj = innerColl.elementType as ResolvedObjectType;
        expect(innerObj.typeName).toBe('User');
    });

    it('2.2 should preserve Array of Nullable Elements topology ((User | null)[])', () => {
        const userObj = new ResolvedObjectType({
            objectKind: 'model',
            typeName: 'User'
        });
        const nullableUser = new ResolvedNullableType({ innerType: userObj });
        const collectionOfNullable = new ResolvedCollectionType({ elementType: nullableUser });

        expect(collectionOfNullable.kind).toBe('collection');
        expect(collectionOfNullable.elementType.kind).toBe('nullable');
        const innerNull = collectionOfNullable.elementType as ResolvedNullableType;
        expect(innerNull.innerType.kind).toBe('object');
    });
});
