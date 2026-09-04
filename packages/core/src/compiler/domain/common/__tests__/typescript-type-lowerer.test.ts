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
    type ResolvedField
} from '../ResolvedSemanticType';
import {
    toTypeScriptTypeExpression,
    buildTopLevelDeclaration
} from '../TypeScriptTypeLowerer';

describe('TDD Suite 1: Primitive + Reference + Unknown Lowering', () => {
    it('1.1 should lower scalar primitives to TS keywords', () => {
        expect(toTypeScriptTypeExpression(new ResolvedPrimitiveType({ primitiveKind: 'string' }))).toBe('string');
        expect(toTypeScriptTypeExpression(new ResolvedPrimitiveType({ primitiveKind: 'number' }))).toBe('number');
        expect(toTypeScriptTypeExpression(new ResolvedPrimitiveType({ primitiveKind: 'boolean' }))).toBe('boolean');
    });

    it('1.2 should lower datetime to string and file to File', () => {
        expect(toTypeScriptTypeExpression(new ResolvedPrimitiveType({ primitiveKind: 'datetime' }))).toBe('string');
        expect(toTypeScriptTypeExpression(new ResolvedPrimitiveType({ primitiveKind: 'file' }))).toBe('File');
    });

    it('1.3 should lower ReferenceType to named TS type', () => {
        expect(toTypeScriptTypeExpression(new ResolvedReferenceType({ name: 'User', namespace: 'App\\Models' }))).toBe('User');
    });

    it('1.4 should lower UnknownType to unknown', () => {
        expect(toTypeScriptTypeExpression(new ResolvedUnknownType({ diagnosticMessage: 'Error' }))).toBe('unknown');
    });
});

describe('TDD Suite 2: Object + ResolvedField Optionality Lowering', () => {
    it('2.1 should lower empty object to "object"', () => {
        const emptyObj = new ResolvedObjectType({ fields: [] });
        expect(toTypeScriptTypeExpression(emptyObj)).toBe('object');
    });

    it('2.2 should lower required field with ":" and optional field with "?:"', () => {
        const str = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const fields: readonly ResolvedField[] = [
            ['id', str, false],
            ['name', str, true]
        ];
        const obj = new ResolvedObjectType({ fields });
        const tsExpr = toTypeScriptTypeExpression(obj);

        expect(tsExpr).toContain('id: string;');
        expect(tsExpr).toContain('name?: string;');
        expect(tsExpr).not.toContain('name: string | undefined');
    });
});

describe('TDD Suite 3: Nullable Topology Lowering', () => {
    it('3.1 should lower Nullable(Primitive) to "T | null"', () => {
        const str = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const nullableStr = new ResolvedNullableType({ innerType: str });
        expect(toTypeScriptTypeExpression(nullableStr)).toBe('string | null');
    });

    it('3.2 should lower Nullable(Object) to "{ ... } | null"', () => {
        const num = new ResolvedPrimitiveType({ primitiveKind: 'number' });
        const obj = new ResolvedObjectType({ fields: [['id', num, false]] });
        const nullableObj = new ResolvedNullableType({ innerType: obj });

        const result = toTypeScriptTypeExpression(nullableObj);
        expect(result).toContain('id: number;');
        expect(result.endsWith('| null')).toBe(true);
    });
});

describe('TDD Suite 4: Collection Topology & Parenthesization Precedence', () => {
    it('4.1 should lower Collection(Primitive) to "T[]"', () => {
        const num = new ResolvedPrimitiveType({ primitiveKind: 'number' });
        const coll = new ResolvedCollectionType({ elementType: num });
        expect(toTypeScriptTypeExpression(coll)).toBe('number[]');
    });

    it('4.2 should parenthesize Collection(Nullable(User)) to "(User | null)[]"', () => {
        const userRef = new ResolvedReferenceType({ name: 'User', namespace: '' });
        const nullableUser = new ResolvedNullableType({ innerType: userRef });
        const collectionOfNullable = new ResolvedCollectionType({ elementType: nullableUser });

        expect(toTypeScriptTypeExpression(collectionOfNullable)).toBe('(User | null)[]');
        expect(toTypeScriptTypeExpression(collectionOfNullable)).not.toBe('User | null[]');
    });

    it('4.3 should lower Nullable(Collection(User)) to "User[] | null"', () => {
        const userRef = new ResolvedReferenceType({ name: 'User', namespace: '' });
        const collectionOfUser = new ResolvedCollectionType({ elementType: userRef });
        const nullableCollection = new ResolvedNullableType({ innerType: collectionOfUser });

        expect(toTypeScriptTypeExpression(nullableCollection)).toBe('User[] | null');
    });
});

describe('TDD Suite 5: Union + Intersection Lowering', () => {
    it('5.1 should lower Union members joined by " | "', () => {
        const str = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const num = new ResolvedPrimitiveType({ primitiveKind: 'number' });
        const union = new ResolvedUnionType({ members: [str, num] });

        expect(toTypeScriptTypeExpression(union)).toBe('string | number');
    });

    it('5.2 should lower Intersection members joined by " & "', () => {
        const refA = new ResolvedReferenceType({ name: 'TypeA', namespace: '' });
        const refB = new ResolvedReferenceType({ name: 'TypeB', namespace: '' });
        const intersection = new ResolvedIntersectionType({ members: [refA, refB] });

        expect(toTypeScriptTypeExpression(intersection)).toBe('TypeA & TypeB');
    });
});

describe('TDD Suite 6: Nested Wrapper Combinations Invariants', () => {
    it('6.1 invariant: Nullable(Collection(User)) != Collection(Nullable(User))', () => {
        const userRef = new ResolvedReferenceType({ name: 'User', namespace: '' });

        const nullableColl = new ResolvedNullableType({
            innerType: new ResolvedCollectionType({ elementType: userRef })
        });

        const collNullable = new ResolvedCollectionType({
            elementType: new ResolvedNullableType({ innerType: userRef })
        });

        const exprA = toTypeScriptTypeExpression(nullableColl);
        const exprB = toTypeScriptTypeExpression(collNullable);

        expect(exprA).toBe('User[] | null');
        expect(exprB).toBe('(User | null)[]');
        expect(exprA).not.toBe(exprB);
    });
});

describe('TDD Suite 7: Top-Level Resource Declaration Lowering', () => {
    it('7.1 should generate export interface and Resource Show / Index aliases', () => {
        const str = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const num = new ResolvedPrimitiveType({ primitiveKind: 'number' });
        const resourceObj = new ResolvedObjectType({
            objectKind: 'resource',
            resourceName: 'OrderDetailResource',
            fields: [
                ['id', num, false],
                ['notes', str, true]
            ]
        });

        const code = buildTopLevelDeclaration('OrderDetailResource', resourceObj);

        expect(code).toContain('export interface OrderDetailResourceTransformed {');
        expect(code).toContain('id: number;');
        expect(code).toContain('notes?: string;');
        expect(code).toContain('export type OrderDetailResourceShow = OrderDetailResourceTransformed;');
        expect(code).toContain('export type OrderDetailResourceIndex = OrderDetailResourceTransformed[];');
    });

    it('7.2 should omit Show/Index aliases for non-resource plain objects', () => {
        const str = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const plainObj = new ResolvedObjectType({
            objectKind: 'plain',
            fields: [['key', str, false]]
        });

        const code = buildTopLevelDeclaration('SummaryDTO', plainObj);

        expect(code).toContain('export interface SummaryDTOTransformed {');
        expect(code).not.toContain('SummaryDTOShow');
        expect(code).not.toContain('SummaryDTOIndex');
    });
});
