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
    toZodSchemaExpression,
    buildTopLevelContractDeclaration
} from '../ZodSchemaLowerer';

describe('Zod Lowering Suite 1: Primitive + Reference + Unknown Lowering', () => {
    it('1.1 should lower scalar primitives to z.X() expressions', () => {
        expect(toZodSchemaExpression(new ResolvedPrimitiveType({ primitiveKind: 'string' }))).toBe('z.string()');
        expect(toZodSchemaExpression(new ResolvedPrimitiveType({ primitiveKind: 'number' }))).toBe('z.number()');
        expect(toZodSchemaExpression(new ResolvedPrimitiveType({ primitiveKind: 'boolean' }))).toBe('z.boolean()');
    });

    it('1.2 should lower datetime to z.string().datetime() and file to z.custom<File>()', () => {
        expect(toZodSchemaExpression(new ResolvedPrimitiveType({ primitiveKind: 'datetime' }))).toBe('z.string().datetime()');
        expect(toZodSchemaExpression(new ResolvedPrimitiveType({ primitiveKind: 'file' }))).toBe('z.custom<File>()');
    });

    it('1.3 should lower ReferenceType to direct schema identifier without z.lazy', () => {
        expect(toZodSchemaExpression(new ResolvedReferenceType({ name: 'User', namespace: 'App\\Models' }))).toBe('UserSchema');
    });

    it('1.4 should lower UnknownType to z.unknown()', () => {
        expect(toZodSchemaExpression(new ResolvedUnknownType({ diagnosticMessage: 'Error' }))).toBe('z.unknown()');
    });
});

describe('Zod Lowering Suite 2: Object + Field Optionality Lowering', () => {
    it('2.1 should lower empty object to z.object({})', () => {
        const emptyObj = new ResolvedObjectType({ fields: [] });
        expect(toZodSchemaExpression(emptyObj)).toBe('z.object({})');
    });

    it('2.2 should append .optional() for optional fields and omit it for required fields', () => {
        const str = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const fields: readonly ResolvedField[] = [
            ['id', str, false],
            ['notes', str, true]
        ];
        const obj = new ResolvedObjectType({ fields });
        const schema = toZodSchemaExpression(obj);

        expect(schema).toContain('id: z.string()');
        expect(schema).toContain('notes: z.string().optional()');
    });
});

describe('Zod Lowering Suite 3: Nullable & Collection Topology Lowering', () => {
    it('3.1 should lower Nullable(Primitive) to z.nullable(z.string())', () => {
        const str = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const nullableStr = new ResolvedNullableType({ innerType: str });
        expect(toZodSchemaExpression(nullableStr)).toBe('z.nullable(z.string())');
    });

    it('3.2 should lower Collection(Primitive) to z.array(z.number())', () => {
        const num = new ResolvedPrimitiveType({ primitiveKind: 'number' });
        const coll = new ResolvedCollectionType({ elementType: num });
        expect(toZodSchemaExpression(coll)).toBe('z.array(z.number())');
    });

    it('3.3 invariant: Nullable(Collection(User)) != Collection(Nullable(User))', () => {
        const userRef = new ResolvedReferenceType({ name: 'User', namespace: '' });

        const nullableColl = new ResolvedNullableType({
            innerType: new ResolvedCollectionType({ elementType: userRef })
        });

        const collNullable = new ResolvedCollectionType({
            elementType: new ResolvedNullableType({ innerType: userRef })
        });

        const exprA = toZodSchemaExpression(nullableColl);
        const exprB = toZodSchemaExpression(collNullable);

        expect(exprA).toBe('z.nullable(z.array(UserSchema))');
        expect(exprB).toBe('z.array(z.nullable(UserSchema))');
        expect(exprA).not.toBe(exprB);
    });
});

describe('Zod Lowering Suite 4: Union + Intersection Lowering', () => {
    it('4.1 should lower Union members to chained .or() without z.union', () => {
        const str = new ResolvedPrimitiveType({ primitiveKind: 'string' });
        const num = new ResolvedPrimitiveType({ primitiveKind: 'number' });
        const union = new ResolvedUnionType({ members: [str, num] });

        expect(toZodSchemaExpression(union)).toBe('z.string().or(z.number())');
    });

    it('4.2 should lower empty union to z.unknown() without z.never', () => {
        const emptyUnion = new ResolvedUnionType({ members: [] });
        expect(toZodSchemaExpression(emptyUnion)).toBe('z.unknown()');
    });

    it('4.3 should lower Intersection members to schemaA.and(schemaB).and(schemaC)', () => {
        const refA = new ResolvedReferenceType({ name: 'TypeA', namespace: '' });
        const refB = new ResolvedReferenceType({ name: 'TypeB', namespace: '' });
        const refC = new ResolvedReferenceType({ name: 'TypeC', namespace: '' });
        const intersection = new ResolvedIntersectionType({ members: [refA, refB, refC] });

        expect(toZodSchemaExpression(intersection)).toBe('TypeASchema.and(TypeBSchema).and(TypeCSchema)');
    });

    it('4.4 should lower empty intersection to z.unknown()', () => {
        const emptyIntersection = new ResolvedIntersectionType({ members: [] });
        expect(toZodSchemaExpression(emptyIntersection)).toBe('z.unknown()');
    });
});

describe('Zod Lowering Suite 5: Top-Level Contract Declaration Lowering', () => {
    it('5.1 should generate export const ContractSchema and export type Contract', () => {
        const num = new ResolvedPrimitiveType({ primitiveKind: 'number' });
        const resourceObj = new ResolvedObjectType({
            objectKind: 'resource',
            resourceName: 'OrderResource',
            fields: [['id', num, false]]
        });

        const code = buildTopLevelContractDeclaration('OrderResource', resourceObj);

        expect(code).toContain('export const OrderResourceContractSchema = z.object({');
        expect(code).toContain('id: z.number()');
        expect(code).toContain('export type OrderResourceContract = z.infer<typeof OrderResourceContractSchema>;');
    });
});
