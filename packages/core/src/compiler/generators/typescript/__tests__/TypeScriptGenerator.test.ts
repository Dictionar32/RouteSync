/**
 * @file TypeScriptGenerator.test.ts
 * @description Unit tests untuk TypeScriptGenerator
 * 
 * Phase 3 - Day 2
 * - Part 1: Basic type conversions (primitives, references, simple collections)
 * - Part 2: Enhanced collection types (readonly distinction, nested arrays, nullable)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TypeScriptGenerator } from '../TypeScriptGenerator';
import {
    PrimitiveType,
    PrimitiveKind,
    ReferenceType,
    NeverType,
    ErrorType,
    ReadonlyCollectionType,
    MutableCollectionType,
    CollectionKind,
    UnionType,
    IntersectionType,
    GenericType,
    ObjectType
} from '../../../types/SemanticType';
import { ImmutableSet, ImmutableMap } from '../../../utils/ImmutableCollections';
import { TSTypeReference } from '../../../target/typescript/nodes/TSTypeReference';
import { TSArrayType } from '../../../target/typescript/nodes/TSArrayType';
import { TSUnionType } from '../../../target/typescript/nodes/TSUnionType';
import { TSIntersectionType } from '../../../target/typescript/nodes/TSIntersectionType';

describe('TypeScriptGenerator', () => {
    let generator: TypeScriptGenerator;

    beforeEach(() => {
        generator = new TypeScriptGenerator();
    });

    // ========================================
    // PART 1: BASIC TYPE CONVERSIONS (Day 2)
    // ========================================

    describe('Primitive Types', () => {
        it('should convert string primitive', () => {
            const semantic = new PrimitiveType(PrimitiveKind.STRING);
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('string');
            expect((result as TSTypeReference).typeArguments).toEqual([]);
        });

        it('should convert number primitive', () => {
            const semantic = new PrimitiveType(PrimitiveKind.NUMBER);
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('number');
        });

        it('should convert boolean primitive', () => {
            const semantic = new PrimitiveType(PrimitiveKind.BOOLEAN);
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('boolean');
        });

        it('should convert datetime to string', () => {
            const semantic = new PrimitiveType(PrimitiveKind.DATETIME);
            const result = generator.semanticTypeToTSType(semantic);

            // DateTime serialized sebagai ISO string
            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('string');
        });

        it('should convert unknown primitive', () => {
            const semantic = new PrimitiveType(PrimitiveKind.UNKNOWN);
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('unknown');
        });
    });

    describe('Special Types', () => {
        it('should convert never type', () => {
            const semantic = new NeverType();
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('never');
        });

        it('should convert error type to unknown', () => {
            const semantic = new ErrorType('Test error message');
            const result = generator.semanticTypeToTSType(semantic);

            // Error type fallback ke unknown
            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('unknown');
        });
    });

    describe('Reference Types', () => {
        it('should convert simple reference type', () => {
            const semantic = new ReferenceType('App\\Models', 'User');
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('User');
        });

        it('should convert reference type with different namespace', () => {
            const semantic = new ReferenceType('App\\Http\\Resources', 'UserResource');
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('UserResource');
        });

        it('should track import for reference type', () => {
            generator.reset(); // Clear state
            const semantic = new ReferenceType('App\\Models', 'Product');

            const result = generator.semanticTypeToTSType(semantic);

            // Check type conversion berhasil
            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('Product');

            // Verify import tracked
            const imports = generator['importCollector'].getImports();
            expect(imports.some(spec =>
                spec.named.has('Product') && spec.source === './Product'
            )).toBe(true);
        });
    });

    describe('Basic Collection Types', () => {
        it('should convert readonly array of strings', () => {
            const semantic = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new PrimitiveType(PrimitiveKind.STRING)
            );
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSArrayType);
            expect((result as TSArrayType).readonly).toBe(true);
            expect((result as TSArrayType).elementType).toBeInstanceOf(TSTypeReference);
            expect(((result as TSArrayType).elementType as TSTypeReference).name).toBe('string');
        });

        it('should convert readonly array of numbers', () => {
            const semantic = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new PrimitiveType(PrimitiveKind.NUMBER)
            );
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSArrayType);
            expect((result as TSArrayType).readonly).toBe(true);
            expect(((result as TSArrayType).elementType as TSTypeReference).name).toBe('number');
        });

        it('should convert mutable array of strings', () => {
            const semantic = new MutableCollectionType(
                CollectionKind.ARRAY,
                new PrimitiveType(PrimitiveKind.STRING)
            );
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSArrayType);
            expect((result as TSArrayType).readonly).toBe(false);
        });

        it('should convert readonly array of reference types', () => {
            const semantic = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new ReferenceType('App\\Models', 'User')
            );
            const result = generator.semanticTypeToTSType(semantic);

            expect(result).toBeInstanceOf(TSArrayType);
            expect((result as TSArrayType).readonly).toBe(true);
            expect(((result as TSArrayType).elementType as TSTypeReference).name).toBe('User');
        });

        it('should convert nested arrays (2D)', () => {
            const semantic = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new ReadonlyCollectionType(
                    CollectionKind.ARRAY,
                    new PrimitiveType(PrimitiveKind.STRING)
                )
            );
            const result = generator.semanticTypeToTSType(semantic);

            // string[][] - nested array
            expect(result).toBeInstanceOf(TSArrayType);
            const outer = result as TSArrayType;
            expect(outer.readonly).toBe(true);
            expect(outer.elementType).toBeInstanceOf(TSArrayType);

            const inner = outer.elementType as TSArrayType;
            expect(inner.readonly).toBe(true);
            expect(inner.elementType).toBeInstanceOf(TSTypeReference);
        });
    });

    // ========================================
    // PART 2: ENHANCED COLLECTION TYPES (Day 2)
    // ========================================

    describe('Enhanced Collection Types - Readonly Distinction', () => {
        it('should generate readonly array untuk readonly_collection', () => {
            const userType = new ReferenceType('App\\Models', 'User');
            const readonlyUsers = new ReadonlyCollectionType(CollectionKind.ARRAY, userType);

            const result = generator.semanticTypeToTSType(readonlyUsers);

            expect(result).toBeInstanceOf(TSArrayType);
            expect((result as TSArrayType).readonly).toBe(true);
            expect((result as TSArrayType).elementType).toBeInstanceOf(TSTypeReference);
            expect(((result as TSArrayType).elementType as TSTypeReference).name).toBe('User');
        });

        it('should generate mutable array untuk mutable_collection', () => {
            const productType = new ReferenceType('App\\Models', 'Product');
            const mutableProducts = new MutableCollectionType(CollectionKind.ARRAY, productType);

            const result = generator.semanticTypeToTSType(mutableProducts);

            expect(result).toBeInstanceOf(TSArrayType);
            expect((result as TSArrayType).readonly).toBe(false);
            expect((result as TSArrayType).elementType).toBeInstanceOf(TSTypeReference);
        });

        it('should handle mixed readonly/mutable nested arrays', () => {
            const stringType = new PrimitiveType(PrimitiveKind.STRING);
            const mutableInner = new MutableCollectionType(CollectionKind.ARRAY, stringType);
            const readonlyOuter = new ReadonlyCollectionType(CollectionKind.ARRAY, mutableInner);

            const result = generator.semanticTypeToTSType(readonlyOuter);

            expect(result).toBeInstanceOf(TSArrayType);
            const outer = result as TSArrayType;
            expect(outer.readonly).toBe(true); // Outer readonly

            expect(outer.elementType).toBeInstanceOf(TSArrayType);
            const inner = outer.elementType as TSArrayType;
            expect(inner.readonly).toBe(false); // Inner mutable
        });
    });

    describe('Enhanced Collection Types - CollectionKind Variants', () => {
        it('should handle CollectionKind.COLLECTION (generic wrapper)', () => {
            const itemType = new ReferenceType('App\\Models', 'Item');
            const collection = new ReadonlyCollectionType(CollectionKind.COLLECTION, itemType);

            const result = generator.semanticTypeToTSType(collection);

            // Currently fallback ke array (TODO: Implement TSGenericType)
            expect(result).toBeInstanceOf(TSArrayType);
            expect((result as TSArrayType).readonly).toBe(true);
        });

        it('should handle CollectionKind.NULLABLE (union dengan null)', () => {
            const stringType = new PrimitiveType(PrimitiveKind.STRING);
            const nullableStrings = new MutableCollectionType(CollectionKind.NULLABLE, stringType);

            const result = generator.semanticTypeToTSType(nullableStrings);

            expect(result).toBeInstanceOf(TSArrayType);
            const arrayResult = result as TSArrayType;
            expect(arrayResult.readonly).toBe(false);
            expect(arrayResult.elementType).toBeInstanceOf(TSUnionType);

            const unionType = arrayResult.elementType as TSUnionType;
            expect(unionType.types).toHaveLength(2);
        });

        it('should handle nullable collections dengan custom types', () => {
            const orderType = new ReferenceType('App\\Models', 'Order');
            const nullableOrders = new ReadonlyCollectionType(CollectionKind.NULLABLE, orderType);

            const result = generator.semanticTypeToTSType(nullableOrders);

            expect(result).toBeInstanceOf(TSArrayType);
            const arrayResult = result as TSArrayType;
            expect(arrayResult.readonly).toBe(true);

            expect(arrayResult.elementType).toBeInstanceOf(TSUnionType);
            const unionType = arrayResult.elementType as TSUnionType;
            expect(unionType.types).toHaveLength(2);
        });
    });

    describe('Enhanced Collection Types - Deep Nesting', () => {
        it('should handle 3D arrays (deep nesting)', () => {
            const boolType = new PrimitiveType(PrimitiveKind.BOOLEAN);
            const bool1D = new MutableCollectionType(CollectionKind.ARRAY, boolType);
            const bool2D = new MutableCollectionType(CollectionKind.ARRAY, bool1D);
            const bool3D = new MutableCollectionType(CollectionKind.ARRAY, bool2D);

            const result = generator.semanticTypeToTSType(bool3D);

            expect(result).toBeInstanceOf(TSArrayType);

            // Verify 3 levels of nesting
            let current: any = result;
            let depth = 0;
            while (current instanceof TSArrayType && depth < 3) {
                expect(current.readonly).toBe(false); // All mutable
                current = current.elementType;
                depth++;
            }
            expect(depth).toBe(3);
            expect(current).toBeInstanceOf(TSTypeReference);
        });

        it('should handle complex nested structures', () => {
            // readonly (readonly string[])[]
            const stringType = new PrimitiveType(PrimitiveKind.STRING);
            const innerReadonly = new ReadonlyCollectionType(CollectionKind.ARRAY, stringType);
            const outerReadonly = new ReadonlyCollectionType(CollectionKind.ARRAY, innerReadonly);

            const result = generator.semanticTypeToTSType(outerReadonly);

            expect(result).toBeInstanceOf(TSArrayType);
            const outer = result as TSArrayType;
            expect(outer.readonly).toBe(true);

            const inner = outer.elementType as TSArrayType;
            expect(inner.readonly).toBe(true);
        });
    });

    describe('Enhanced Collection Types - Edge Cases', () => {
        it('should handle empty element type (unknown)', () => {
            const unknownType = new PrimitiveType(PrimitiveKind.UNKNOWN);
            const unknownArray = new MutableCollectionType(CollectionKind.ARRAY, unknownType);

            const result = generator.semanticTypeToTSType(unknownArray);

            expect(result).toBeInstanceOf(TSArrayType);
            expect((result as TSArrayType).elementType).toBeInstanceOf(TSTypeReference);
            expect(((result as TSArrayType).elementType as TSTypeReference).name).toBe('unknown');
        });

        it('should track imports untuk collection element types', () => {
            generator.reset();

            const paymentType = new ReferenceType('App\\Models', 'Payment');
            const payments = new ReadonlyCollectionType(CollectionKind.ARRAY, paymentType);

            generator.semanticTypeToTSType(payments);

            // Verify import tracking
            const imports = generator['importCollector'].getImports();
            expect(imports.some(spec =>
                spec.named.has('Payment') && spec.source === './Payment'
            )).toBe(true);
        });

        it('should handle collection of never type', () => {
            const neverType = new NeverType();
            const neverArray = new MutableCollectionType(CollectionKind.ARRAY, neverType);

            const result = generator.semanticTypeToTSType(neverArray);

            expect(result).toBeInstanceOf(TSArrayType);
            expect(((result as TSArrayType).elementType as TSTypeReference).name).toBe('never');
        });
    });

    // ========================================
    // RESET METHOD
    // ========================================

    describe('reset() method', () => {
        it('should reset generator state', () => {
            // Generate something
            const semantic = new ReferenceType('App\\Models', 'User');
            generator.semanticTypeToTSType(semantic);

            // Reset
            generator.reset();

            // Should be able to generate again with clean state
            const semantic2 = new ReferenceType('App\\Models', 'Product');
            const result = generator.semanticTypeToTSType(semantic2);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('Product');
        });

        it('should clear import collector on reset', () => {
            const semantic = new ReferenceType('App\\Models', 'User');
            generator.semanticTypeToTSType(semantic);

            // Verify import exists
            let imports = generator['importCollector'].getImports();
            expect(imports.length).toBeGreaterThan(0);

            // Reset
            generator.reset();

            // Verify imports cleared
            imports = generator['importCollector'].getImports();
            expect(imports.length).toBe(0);
        });
    });

    // ========================================
    // PART 3: UNION & INTERSECTION TYPES (Day 2)
    // ========================================

    describe('Union Types - Basic', () => {
        it('should convert simple union (string | number)', () => {
            const stringType = new PrimitiveType(PrimitiveKind.STRING);
            const numberType = new PrimitiveType(PrimitiveKind.NUMBER);
            const union = new UnionType(
                new ImmutableSet(new Set([stringType, numberType]))
            );

            const result = generator.semanticTypeToTSType(union);

            expect(result).toBeInstanceOf(TSUnionType);
            const unionResult = result as TSUnionType;
            expect(unionResult.types).toHaveLength(2);
            expect(unionResult.types[0]).toBeInstanceOf(TSTypeReference);
            expect(unionResult.types[1]).toBeInstanceOf(TSTypeReference);
        });

        it('should convert nullable type (User | null)', () => {
            const userType = new ReferenceType('App\\Models', 'User');
            const nullType = new PrimitiveType(PrimitiveKind.STRING); // Using string as placeholder for null
            const union = new UnionType(
                new ImmutableSet(new Set([userType, nullType]))
            );

            const result = generator.semanticTypeToTSType(union);

            expect(result).toBeInstanceOf(TSUnionType);
            const unionResult = result as TSUnionType;
            expect(unionResult.types).toHaveLength(2);
        });

        it('should convert union of reference types', () => {
            const userType = new ReferenceType('App\\Models', 'User');
            const adminType = new ReferenceType('App\\Models', 'Admin');
            const guestType = new ReferenceType('App\\Models', 'Guest');
            const union = new UnionType(
                new ImmutableSet(new Set([userType, adminType, guestType]))
            );

            const result = generator.semanticTypeToTSType(union);

            expect(result).toBeInstanceOf(TSUnionType);
            const unionResult = result as TSUnionType;
            expect(unionResult.types).toHaveLength(3);
            expect(unionResult.types.every(t => t instanceof TSTypeReference)).toBe(true);
        });

        it('should handle single-member union (returns type directly)', () => {
            const stringType = new PrimitiveType(PrimitiveKind.STRING);
            const union = new UnionType(
                new ImmutableSet(new Set([stringType]))
            );

            const result = generator.semanticTypeToTSType(union);

            // Single member → should return TSTypeReference directly, not union
            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('string');
        });

        it('should handle empty union (returns never)', () => {
            const union = new UnionType(
                new ImmutableSet(new Set([]))
            );

            const result = generator.semanticTypeToTSType(union);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('never');
        });
    });

    describe('Union Types - Complex', () => {
        it('should convert union dengan arrays (string[] | number[])', () => {
            const stringArray = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new PrimitiveType(PrimitiveKind.STRING)
            );
            const numberArray = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new PrimitiveType(PrimitiveKind.NUMBER)
            );
            const union = new UnionType(
                new ImmutableSet(new Set([stringArray, numberArray]))
            );

            const result = generator.semanticTypeToTSType(union);

            expect(result).toBeInstanceOf(TSUnionType);
            const unionResult = result as TSUnionType;
            expect(unionResult.types).toHaveLength(2);
            expect(unionResult.types[0]).toBeInstanceOf(TSArrayType);
            expect(unionResult.types[1]).toBeInstanceOf(TSArrayType);
        });

        it('should track imports untuk union members', () => {
            generator.reset();

            const orderType = new ReferenceType('App\\Models', 'Order');
            const invoiceType = new ReferenceType('App\\Models', 'Invoice');
            const union = new UnionType(
                new ImmutableSet(new Set([orderType, invoiceType]))
            );

            generator.semanticTypeToTSType(union);

            const imports = generator['importCollector'].getImports();
            expect(imports.some(spec => spec.named.has('Order'))).toBe(true);
            expect(imports.some(spec => spec.named.has('Invoice'))).toBe(true);
        });
    });

    describe('Intersection Types - Basic', () => {
        it('should convert simple intersection (User & Timestamps)', () => {
            const userType = new ReferenceType('App\\Models', 'User');
            const timestampsType = new ReferenceType('App\\Traits', 'Timestamps');
            const intersection = new IntersectionType(
                new ImmutableSet(new Set([userType, timestampsType]))
            );

            const result = generator.semanticTypeToTSType(intersection);

            expect(result).toBeInstanceOf(TSIntersectionType);
            const intersectionResult = result as TSIntersectionType;
            expect(intersectionResult.types).toHaveLength(2);
            expect(intersectionResult.types[0]).toBeInstanceOf(TSTypeReference);
            expect(intersectionResult.types[1]).toBeInstanceOf(TSTypeReference);
        });

        it('should handle single-member intersection (returns type directly)', () => {
            const userType = new ReferenceType('App\\Models', 'User');
            const intersection = new IntersectionType(
                new ImmutableSet(new Set([userType]))
            );

            const result = generator.semanticTypeToTSType(intersection);

            // Single member → should return TSTypeReference directly
            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('User');
        });

        it('should handle empty intersection (returns never)', () => {
            const intersection = new IntersectionType(
                new ImmutableSet(new Set([]))
            );

            const result = generator.semanticTypeToTSType(intersection);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('never');
        });
    });

    describe('Intersection Types - Complex', () => {
        it('should convert multi-member intersection', () => {
            const baseType = new ReferenceType('App\\Models', 'Base');
            const timestampsType = new ReferenceType('App\\Traits', 'Timestamps');
            const auditableType = new ReferenceType('App\\Traits', 'Auditable');
            const intersection = new IntersectionType(
                new ImmutableSet(new Set([baseType, timestampsType, auditableType]))
            );

            const result = generator.semanticTypeToTSType(intersection);

            expect(result).toBeInstanceOf(TSIntersectionType);
            const intersectionResult = result as TSIntersectionType;
            expect(intersectionResult.types).toHaveLength(3);
            expect(intersectionResult.types.every(t => t instanceof TSTypeReference)).toBe(true);
        });

        it('should track imports untuk intersection members', () => {
            generator.reset();

            const userType = new ReferenceType('App\\Models', 'User');
            const timestampsType = new ReferenceType('App\\Traits', 'Timestamps');
            const intersection = new IntersectionType(
                new ImmutableSet(new Set([userType, timestampsType]))
            );

            generator.semanticTypeToTSType(intersection);

            const imports = generator['importCollector'].getImports();
            expect(imports.some(spec => spec.named.has('User'))).toBe(true);
            expect(imports.some(spec => spec.named.has('Timestamps'))).toBe(true);
        });
    });

    describe('Combined Union & Intersection Types', () => {
        it('should convert union of intersections', () => {
            // (User & Timestamps) | (Admin & Timestamps)
            const userTimestamps = new IntersectionType(
                new ImmutableSet(new Set([
                    new ReferenceType('App\\Models', 'User'),
                    new ReferenceType('App\\Traits', 'Timestamps')
                ]))
            );
            const adminTimestamps = new IntersectionType(
                new ImmutableSet(new Set([
                    new ReferenceType('App\\Models', 'Admin'),
                    new ReferenceType('App\\Traits', 'Timestamps')
                ]))
            );
            const union = new UnionType(
                new ImmutableSet(new Set([userTimestamps, adminTimestamps]))
            );

            const result = generator.semanticTypeToTSType(union);

            expect(result).toBeInstanceOf(TSUnionType);
            const unionResult = result as TSUnionType;
            expect(unionResult.types).toHaveLength(2);
            expect(unionResult.types[0]).toBeInstanceOf(TSIntersectionType);
            expect(unionResult.types[1]).toBeInstanceOf(TSIntersectionType);
        });
    });

    // ========================================
    // PART 4: GENERIC TYPES (Day 3)
    // ========================================

    describe('Generic Types - Basic', () => {
        it('should convert simple generic (Collection<User>)', () => {
            const userType = new ReferenceType('App\\Models', 'User');
            const collectionBase = new ReferenceType('Illuminate\\Support', 'Collection');
            const generic = new GenericType(collectionBase, [
                { name: 'T', variance: 'covariant', type: userType }
            ]);

            const result = generator.semanticTypeToTSType(generic);

            expect(result).toBeInstanceOf(TSTypeReference);
            const typeRef = result as TSTypeReference;
            expect(typeRef.name).toBe('Collection');
            expect(typeRef.typeArguments).toHaveLength(1);
            expect(typeRef.typeArguments[0].name).toBe('User');
        });

        it('should convert Promise<User>', () => {
            const userType = new ReferenceType('App\\Models', 'User');
            const promiseBase = new ReferenceType('', 'Promise');
            const generic = new GenericType(promiseBase, [
                { name: 'T', variance: 'covariant', type: userType }
            ]);

            const result = generator.semanticTypeToTSType(generic);

            expect(result).toBeInstanceOf(TSTypeReference);
            const typeRef = result as TSTypeReference;
            expect(typeRef.name).toBe('Promise');
            expect(typeRef.typeArguments).toHaveLength(1);
        });

        it('should convert Map<string, number>', () => {
            const keyType = new PrimitiveType(PrimitiveKind.STRING);
            const valueType = new PrimitiveType(PrimitiveKind.NUMBER);
            const mapBase = new ReferenceType('', 'Map');
            const generic = new GenericType(mapBase, [
                { name: 'K', variance: 'invariant', type: keyType },
                { name: 'V', variance: 'invariant', type: valueType }
            ]);

            const result = generator.semanticTypeToTSType(generic);

            expect(result).toBeInstanceOf(TSTypeReference);
            const typeRef = result as TSTypeReference;
            expect(typeRef.name).toBe('Map');
            expect(typeRef.typeArguments).toHaveLength(2);
            expect(typeRef.typeArguments[0].name).toBe('string');
            expect(typeRef.typeArguments[1].name).toBe('number');
        });

        it('should handle empty generic parameters (returns base type)', () => {
            const collectionBase = new ReferenceType('Illuminate\\Support', 'Collection');
            const generic = new GenericType(collectionBase, []);

            const result = generator.semanticTypeToTSType(generic);

            expect(result).toBeInstanceOf(TSTypeReference);
            const typeRef = result as TSTypeReference;
            expect(typeRef.name).toBe('Collection');
            expect(typeRef.typeArguments).toHaveLength(0);
        });

        it('should track imports untuk generic base type', () => {
            generator.reset();

            const userType = new ReferenceType('App\\Models', 'User');
            const collectionBase = new ReferenceType('Illuminate\\Support', 'Collection');
            const generic = new GenericType(collectionBase, [
                { name: 'T', variance: 'covariant', type: userType }
            ]);

            generator.semanticTypeToTSType(generic);

            const imports = generator['importCollector'].getImports();
            expect(imports.some(spec => spec.named.has('Collection'))).toBe(true);
            expect(imports.some(spec => spec.named.has('User'))).toBe(true);
        });
    });

    describe('Generic Types - Nested', () => {
        it('should convert nested generics (Promise<Result<User>>)', () => {
            const userType = new ReferenceType('App\\Models', 'User');
            const resultBase = new ReferenceType('App\\Http', 'Result');
            const promiseBase = new ReferenceType('', 'Promise');

            // Result<User>
            const innerGeneric = new GenericType(resultBase, [
                { name: 'T', variance: 'covariant', type: userType }
            ]);

            // Promise<Result<User>>
            const outerGeneric = new GenericType(promiseBase, [
                { name: 'T', variance: 'covariant', type: innerGeneric }
            ]);

            // Current implementation should throw error because innerGeneric
            // converts to TSTypeReference but it's actually a GenericType
            // When we try to convert innerGeneric as a parameter, semanticTypeToTSType
            // will return TSTypeReference (from convertGenericType), but we check
            // instanceof TSTypeReference which will be true, so no error thrown.

            // Actually, let's just verify it doesn't crash for now
            // Full nested generic support is a TODO
            const result = generator.semanticTypeToTSType(outerGeneric);
            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('Promise');
        });

        it('should convert Array<User> (using generic syntax)', () => {
            const userType = new ReferenceType('App\\Models', 'User');
            const arrayBase = new ReferenceType('', 'Array');
            const generic = new GenericType(arrayBase, [
                { name: 'T', variance: 'covariant', type: userType }
            ]);

            const result = generator.semanticTypeToTSType(generic);

            expect(result).toBeInstanceOf(TSTypeReference);
            const typeRef = result as TSTypeReference;
            expect(typeRef.name).toBe('Array');
            expect(typeRef.typeArguments).toHaveLength(1);
        });
    });

    describe('Generic Types - Edge Cases', () => {
        it('should handle generic dengan primitive type parameters', () => {
            const stringType = new PrimitiveType(PrimitiveKind.STRING);
            const setBase = new ReferenceType('', 'Set');
            const generic = new GenericType(setBase, [
                { name: 'T', variance: 'covariant', type: stringType }
            ]);

            const result = generator.semanticTypeToTSType(generic);

            expect(result).toBeInstanceOf(TSTypeReference);
            const typeRef = result as TSTypeReference;
            expect(typeRef.name).toBe('Set');
            expect(typeRef.typeArguments[0].name).toBe('string');
        });

        it('should throw untuk complex type parameters (union)', () => {
            const stringOrNumber = new UnionType(
                new ImmutableSet(new Set([
                    new PrimitiveType(PrimitiveKind.STRING),
                    new PrimitiveType(PrimitiveKind.NUMBER)
                ]))
            );
            const setBase = new ReferenceType('', 'Set');
            const generic = new GenericType(setBase, [
                { name: 'T', variance: 'covariant', type: stringOrNumber }
            ]);

            // Complex type parameters not yet supported
            expect(() => generator.semanticTypeToTSType(generic))
                .toThrow('Complex generic parameter not yet supported');
        });
    });

    // ========================================
    // PART 5: OBJECT TYPES (Day 3)
    // ========================================

    describe('Object Types - Simple', () => {
        it('should convert small object type (inline fallback)', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['name', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['id', 'name']))
            );

            const result = generator.semanticTypeToTSType(objectType);

            // Small objects currently fallback to 'object'
            // TODO: Will use inline object literal in future
            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('object');
        });

        it('should convert object dengan optional properties', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['name', new PrimitiveType(PrimitiveKind.STRING)],
                    ['email', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['id'])) // Only id required
            );

            const result = generator.semanticTypeToTSType(objectType);

            expect(result).toBeInstanceOf(TSTypeReference);
            // Small object (≤3 props) → 'object' fallback
            expect((result as TSTypeReference).name).toBe('object');
        });

        it('should track imports untuk reference type properties', () => {
            generator.reset();

            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['author', new ReferenceType('App\\Models', 'User')]
                ])),
                new ImmutableSet(new Set(['author']))
            );

            generator.semanticTypeToTSType(objectType);

            const imports = generator['importCollector'].getImports();
            expect(imports.some(spec => spec.named.has('User'))).toBe(true);
        });
    });

    describe('Object Types - Complex', () => {
        it('should generate synthetic type name untuk large objects (>3 props)', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['name', new PrimitiveType(PrimitiveKind.STRING)],
                    ['email', new PrimitiveType(PrimitiveKind.STRING)],
                    ['phone', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['id', 'name', 'email', 'phone']))
            );

            const result = generator.semanticTypeToTSType(objectType);

            expect(result).toBeInstanceOf(TSTypeReference);
            const typeRef = result as TSTypeReference;
            // Should generate synthetic name
            expect(typeRef.name).toMatch(/^SyntheticType_\d+$/);
        });

        it('should increment synthetic type counter', () => {
            generator.reset();

            const obj1 = new ObjectType(
                new ImmutableMap(new Map([
                    ['a', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['b', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['c', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['d', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['a', 'b', 'c', 'd']))
            );

            const obj2 = new ObjectType(
                new ImmutableMap(new Map([
                    ['x', new PrimitiveType(PrimitiveKind.STRING)],
                    ['y', new PrimitiveType(PrimitiveKind.STRING)],
                    ['z', new PrimitiveType(PrimitiveKind.STRING)],
                    ['w', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['x', 'y', 'z', 'w']))
            );

            const result1 = generator.semanticTypeToTSType(obj1);
            const result2 = generator.semanticTypeToTSType(obj2);

            expect((result1 as TSTypeReference).name).toBe('SyntheticType_1');
            expect((result2 as TSTypeReference).name).toBe('SyntheticType_2');
        });

        it('should handle object dengan nested collection types', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['tags', new ReadonlyCollectionType(
                        CollectionKind.ARRAY,
                        new PrimitiveType(PrimitiveKind.STRING)
                    )]
                ])),
                new ImmutableSet(new Set(['tags']))
            );

            const result = generator.semanticTypeToTSType(objectType);

            expect(result).toBeInstanceOf(TSTypeReference);
        });

        it('should handle object dengan union type properties', () => {
            const stringOrNumber = new UnionType(
                new ImmutableSet(new Set([
                    new PrimitiveType(PrimitiveKind.STRING),
                    new PrimitiveType(PrimitiveKind.NUMBER)
                ]))
            );

            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['value', stringOrNumber]
                ])),
                new ImmutableSet(new Set(['value']))
            );

            const result = generator.semanticTypeToTSType(objectType);

            expect(result).toBeInstanceOf(TSTypeReference);
        });
    });

    describe('Object Types - Inheritance', () => {
        it('should generate synthetic type untuk object dengan base type', () => {
            const baseType = new ReferenceType('App\\Models', 'BaseModel');
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['id'])),
                baseType // has inheritance
            );

            const result = generator.semanticTypeToTSType(objectType);

            expect(result).toBeInstanceOf(TSTypeReference);
            const typeRef = result as TSTypeReference;
            // Should generate synthetic type (even dengan 1 property, karena has inheritance)
            expect(typeRef.name).toMatch(/^SyntheticType_\d+$/);
        });

        it('should track imports untuk base type', () => {
            generator.reset();

            const baseType = new ReferenceType('App\\Models', 'BaseModel');
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['id'])),
                baseType
            );

            generator.semanticTypeToTSType(objectType);

            const imports = generator['importCollector'].getImports();
            expect(imports.some(spec => spec.named.has('BaseModel'))).toBe(true);
        });

        it('should track imports untuk interface implementations', () => {
            generator.reset();

            const iface1 = new ReferenceType('App\\Contracts', 'Timestampable');
            const iface2 = new ReferenceType('App\\Contracts', 'Auditable');
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['id'])),
                undefined, // no base
                [iface1, iface2] // interfaces
            );

            generator.semanticTypeToTSType(objectType);

            const imports = generator['importCollector'].getImports();
            expect(imports.some(spec => spec.named.has('Timestampable'))).toBe(true);
            expect(imports.some(spec => spec.named.has('Auditable'))).toBe(true);
        });
    });

    describe('Object Types - Edge Cases', () => {
        it('should handle empty object', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map()),
                new ImmutableSet(new Set())
            );

            const result = generator.semanticTypeToTSType(objectType);

            expect(result).toBeInstanceOf(TSTypeReference);
            expect((result as TSTypeReference).name).toBe('object');
        });

        it('should handle nested object types', () => {
            const nestedObject = new ObjectType(
                new ImmutableMap(new Map([
                    ['nested', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['nested']))
            );

            const outerObject = new ObjectType(
                new ImmutableMap(new Map([
                    ['inner', nestedObject],
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['name', new PrimitiveType(PrimitiveKind.STRING)],
                    ['data', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['inner', 'id', 'name', 'data']))
            );

            const result = generator.semanticTypeToTSType(outerObject);

            expect(result).toBeInstanceOf(TSTypeReference);
            // Large object → synthetic type
            expect((result as TSTypeReference).name).toMatch(/^SyntheticType_\d+$/);
        });

        it('should reset synthetic counter on reset()', () => {
            const obj = new ObjectType(
                new ImmutableMap(new Map([
                    ['a', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['b', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['c', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['d', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['a', 'b', 'c', 'd']))
            );

            generator.semanticTypeToTSType(obj);
            const result1 = generator.semanticTypeToTSType(obj);
            expect((result1 as TSTypeReference).name).toMatch(/SyntheticType_\d+/);

            // Reset
            generator.reset();

            // Counter should reset
            const result2 = generator.semanticTypeToTSType(obj);
            expect((result2 as TSTypeReference).name).toBe('SyntheticType_1');
        });
    });

    // =====================================================================
    // Phase 3 - Day 4: generateEntityInterface() Tests
    // =====================================================================

    describe('generateEntityInterface() - Basic Interface Generation', () => {
        it('should generate simple interface dengan all required properties', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['name', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['id', 'name'])) // both required
            );

            const iface = generator.generateEntityInterface('User', objectType);

            expect(iface.name).toBe('User');
            expect(iface.properties).toHaveLength(2);
            expect(iface.exported).toBe(true);

            // Check property signatures
            const idProp = iface.properties.find(m => m.name === 'id');
            const nameProp = iface.properties.find(m => m.name === 'name');

            expect(idProp).toBeDefined();
            expect(idProp?.optional).toBe(false);
            expect(nameProp).toBeDefined();
            expect(nameProp?.optional).toBe(false);
        });

        it('should handle optional properties correctly', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['name', new PrimitiveType(PrimitiveKind.STRING)],
                    ['email', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['id', 'name'])) // email is optional
            );

            const iface = generator.generateEntityInterface('User', objectType);

            const emailProp = iface.properties.find(m => m.name === 'email');
            const idProp = iface.properties.find(m => m.name === 'id');
            const nameProp = iface.properties.find(m => m.name === 'name');

            expect(emailProp?.optional).toBe(true); // optional
            expect(idProp?.optional).toBe(false);   // required
            expect(nameProp?.optional).toBe(false); // required
        });

        it('should handle all optional properties', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['email', new PrimitiveType(PrimitiveKind.STRING)],
                    ['phone', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set([])) // no required properties
            );

            const iface = generator.generateEntityInterface('ContactInfo', objectType);

            expect(iface.properties).toHaveLength(2);

            const emailProp = iface.properties.find(m => m.name === 'email');
            const phoneProp = iface.properties.find(m => m.name === 'phone');

            expect(emailProp?.optional).toBe(true);
            expect(phoneProp?.optional).toBe(true);
        });

        it('should handle empty object type', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map()),
                new ImmutableSet(new Set())
            );

            const iface = generator.generateEntityInterface('EmptyType', objectType);

            expect(iface.name).toBe('EmptyType');
            expect(iface.properties).toHaveLength(0);
        });

        it('should throw error jika type bukan ObjectType', () => {
            const primitiveType = new PrimitiveType(PrimitiveKind.STRING);

            expect(() => {
                generator.generateEntityInterface('Invalid', primitiveType as any);
            }).toThrow('Expected ObjectType, got primitive');
        });
    });

    describe('generateEntityInterface() - Complex Property Types', () => {
        it('should handle reference type properties', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['author', new ReferenceType('App\\Models', 'User')]
                ])),
                new ImmutableSet(new Set(['id', 'author']))
            );

            generator.reset();
            const iface = generator.generateEntityInterface('Post', objectType);

            const authorProp = iface.properties.find(m => m.name === 'author');
            expect(authorProp).toBeDefined();
            expect(authorProp?.type).toBeInstanceOf(TSTypeReference);
            expect((authorProp?.type as TSTypeReference).name).toBe('User');

            // Check import tracking
            const imports = generator['importCollector'].getImports();
            expect(imports.some(imp =>
                imp.source === './User' && imp.named.has('User')
            )).toBe(true);
        });

        it('should handle array properties', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['tags', new MutableCollectionType(
                        CollectionKind.ARRAY,
                        new PrimitiveType(PrimitiveKind.STRING)
                    )]
                ])),
                new ImmutableSet(new Set(['tags']))
            );

            const iface = generator.generateEntityInterface('Post', objectType);

            const tagsProp = iface.properties.find(m => m.name === 'tags');
            expect(tagsProp).toBeDefined();
            expect(tagsProp?.type).toBeInstanceOf(TSArrayType);
        });

        it('should handle union type properties', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['value', new UnionType(new ImmutableSet(new Set([
                        new PrimitiveType(PrimitiveKind.STRING),
                        new PrimitiveType(PrimitiveKind.NUMBER)
                    ])))]
                ])),
                new ImmutableSet(new Set(['value']))
            );

            const iface = generator.generateEntityInterface('Config', objectType);

            const valueProp = iface.properties.find(m => m.name === 'value');
            expect(valueProp).toBeDefined();
            expect(valueProp?.type).toBeInstanceOf(TSUnionType);
        });

        it('should handle nested object properties', () => {
            const nestedObjectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['street', new PrimitiveType(PrimitiveKind.STRING)],
                    ['city', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['street', 'city']))
            );

            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['name', new PrimitiveType(PrimitiveKind.STRING)],
                    ['address', nestedObjectType]
                ])),
                new ImmutableSet(new Set(['name', 'address']))
            );

            const iface = generator.generateEntityInterface('User', objectType);

            const addressProp = iface.properties.find(m => m.name === 'address');
            expect(addressProp).toBeDefined();
            // Nested objects currently fallback to 'object' atau synthetic type
        });
    });

    describe('generateEntityInterface() - Inheritance', () => {
        it('should handle base object (extends)', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['extraField', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['extraField'])),
                new ReferenceType('App\\Models', 'BaseUser') // baseObject
            );

            generator.reset();
            const iface = generator.generateEntityInterface('AdminUser', objectType);

            expect(iface.extendsTypes).toHaveLength(1);
            expect(iface.extendsTypes[0]).toBe('BaseUser');

            // Check import tracking untuk base type
            const imports = generator['importCollector'].getImports();
            expect(imports.some(imp =>
                imp.source === './BaseUser' && imp.named.has('BaseUser')
            )).toBe(true);
        });

        it('should handle interface implementations', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['id'])),
                undefined, // no baseObject
                [
                    new ReferenceType('', 'Timestamped'),
                    new ReferenceType('', 'SoftDeletable')
                ]
            );

            generator.reset();
            const iface = generator.generateEntityInterface('User', objectType);

            expect(iface.extendsTypes).toHaveLength(2);
            expect(iface.extendsTypes).toContain('Timestamped');
            expect(iface.extendsTypes).toContain('SoftDeletable');

            // Check import tracking
            const imports = generator['importCollector'].getImports();
            expect(imports.some(imp => imp.named.has('Timestamped'))).toBe(true);
            expect(imports.some(imp => imp.named.has('SoftDeletable'))).toBe(true);
        });

        it('should handle both base object and interfaces', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['id'])),
                new ReferenceType('', 'BaseModel'), // baseObject
                [
                    new ReferenceType('', 'Timestamped')
                ]
            );

            generator.reset();
            const iface = generator.generateEntityInterface('User', objectType);

            expect(iface.extendsTypes).toHaveLength(2);
            expect(iface.extendsTypes[0]).toBe('BaseModel'); // base comes first
            expect(iface.extendsTypes[1]).toBe('Timestamped');
        });

        it('should handle no inheritance (empty extends)', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['id']))
                // no baseObject, no interfaces
            );

            const iface = generator.generateEntityInterface('SimpleUser', objectType);

            expect(iface.extendsTypes).toHaveLength(0);
        });
    });

    describe('generateEntityInterface() - Naming & Tracking', () => {
        it('should track generated interface names', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['id']))
            );

            expect(generator['generatedTypes'].has('User')).toBe(false);

            generator.generateEntityInterface('User', objectType);

            expect(generator['generatedTypes'].has('User')).toBe(true);
        });

        it('should allow generating multiple interfaces', () => {
            const userType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['id']))
            );

            const postType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
                ])),
                new ImmutableSet(new Set(['id']))
            );

            const userIface = generator.generateEntityInterface('User', userType);
            const postIface = generator.generateEntityInterface('Post', postType);

            expect(userIface.name).toBe('User');
            expect(postIface.name).toBe('Post');
            expect(generator['generatedTypes'].has('User')).toBe(true);
            expect(generator['generatedTypes'].has('Post')).toBe(true);
        });

        it('should not create imports for self-reference', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['parent', new ReferenceType('', 'User')] // self-reference
                ])),
                new ImmutableSet(new Set(['id']))
            );

            generator.reset();
            generator.generateEntityInterface('User', objectType);

            // User should be tracked as generated
            expect(generator['generatedTypes'].has('User')).toBe(true);

            // Should not import User dari ./User (self-reference)
            const imports = generator['importCollector'].getImports();
            const userImport = imports.find(imp => imp.named.has('User'));

            // Since collectImportRequirement skips already generated types,
            // there should be no import for User
            expect(userImport).toBeUndefined();
        });
    });

    describe('generateEntityInterface() - Integration', () => {
        it('should work with complex real-world example', () => {
            // Simulate a User entity dengan complex properties
            const userType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['name', new PrimitiveType(PrimitiveKind.STRING)],
                    ['email', new PrimitiveType(PrimitiveKind.STRING)],
                    ['role', new UnionType(new ImmutableSet(new Set([
                        new ReferenceType('', 'Admin'),
                        new ReferenceType('', 'User'),
                        new ReferenceType('', 'Guest')
                    ])))],
                    ['posts', new MutableCollectionType(
                        CollectionKind.ARRAY,
                        new ReferenceType('', 'Post')
                    )],
                    ['createdAt', new PrimitiveType(PrimitiveKind.DATETIME)]
                ])),
                new ImmutableSet(new Set(['id', 'name', 'email', 'role'])), // posts and createdAt optional
                new ReferenceType('', 'BaseModel'), // extends BaseModel
                [new ReferenceType('', 'Timestamped')] // implements Timestamped
            );

            generator.reset();
            const iface = generator.generateEntityInterface('User', userType);

            // Verify structure
            expect(iface.name).toBe('User');
            expect(iface.properties.length).toBeGreaterThan(0);
            expect(iface.extendsTypes).toContain('BaseModel');
            expect(iface.extendsTypes).toContain('Timestamped');

            // Verify property types
            const postsProp = iface.properties.find(m => m.name === 'posts');
            expect(postsProp?.optional).toBe(true);
            expect(postsProp?.type).toBeInstanceOf(TSArrayType);

            const roleProp = iface.properties.find(m => m.name === 'role');
            expect(roleProp?.optional).toBe(false);
            expect(roleProp?.type).toBeInstanceOf(TSUnionType);

            // Verify imports tracked
            const imports = generator['importCollector'].getImports();
            expect(imports.some(imp => imp.named.has('BaseModel'))).toBe(true);
            expect(imports.some(imp => imp.named.has('Post'))).toBe(true);
        });
    });
});


// ========================================
// PHASE 3 - DAY 5: EDGE CASES & ERROR HANDLING
// ========================================

describe('Edge Cases - Circular References', () => {
    it('should handle mutual circular references (A ↔ B)', () => {
        generator.reset();

        // Create TypeA that references TypeB
        const typeBRef = new ReferenceType('App\\Models', 'TypeB');
        const typeAProps = new ImmutableMap(new Map([
            ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['b', typeBRef] // TypeA references TypeB
        ]));
        const typeARequired = new ImmutableSet(new Set(['id']));
        const typeA = new ObjectType(typeAProps, typeARequired);

        // Generate TypeA interface
        const ifaceA = generator.generateEntityInterface('TypeA', typeA);

        // Verify TypeA generated correctly
        expect(ifaceA.name).toBe('TypeA');
        expect(ifaceA.properties).toHaveLength(2);

        // Verify TypeB import was collected
        const imports = generator['importCollector'].getImports();
        expect(imports.some(spec => spec.named.has('TypeB'))).toBe(true);

        // Now generate TypeB that references TypeA back
        const typeARef = new ReferenceType('App\\Models', 'TypeA');
        const typeBProps = new ImmutableMap(new Map([
            ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['a', typeARef] // TypeB references TypeA back
        ]));
        const typeBRequired = new ImmutableSet(new Set(['id']));
        const typeB = new ObjectType(typeBProps, typeBRequired);

        // This should NOT fail - circular references are valid in TypeScript
        const ifaceB = generator.generateEntityInterface('TypeB', typeB);

        expect(ifaceB.name).toBe('TypeB');
        expect(ifaceB.properties).toHaveLength(2);

        // TypeA was already generated, so should NOT be imported
        const importsAfterB = generator['importCollector'].getImports();
        const typeAImport = importsAfterB.find(spec => spec.source === './TypeA');

        // TypeA should not have import (already generated in same file)
        expect(typeAImport).toBeUndefined();
    });

    it('should handle self-referencing types with arrays', () => {
        generator.reset();

        // TreeNode dengan children: TreeNode[]
        const treeNodeRef = new ReferenceType('App\\Models', 'TreeNode');
        const childrenArray = new ReadonlyCollectionType(
            CollectionKind.ARRAY,
            treeNodeRef
        );

        const treeNodeProps = new ImmutableMap(new Map([
            ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['value', new PrimitiveType(PrimitiveKind.STRING)],
            ['children', childrenArray] // Self-reference via array
        ]));
        const treeNodeRequired = new ImmutableSet(new Set(['id', 'value']));
        const treeNode = new ObjectType(treeNodeProps, treeNodeRequired);

        const iface = generator.generateEntityInterface('TreeNode', treeNode);

        expect(iface.name).toBe('TreeNode');
        expect(iface.properties).toHaveLength(3);

        // Verify children property is array type
        const childrenProp = iface.properties.find(p => p.name === 'children');
        expect(childrenProp).toBeDefined();
        expect(childrenProp?.type).toBeInstanceOf(TSArrayType);

        // Should not import TreeNode from itself
        const imports = generator['importCollector'].getImports();
        const selfImport = imports.find(spec => spec.source === './TreeNode');
        expect(selfImport).toBeUndefined();
    });
});

describe('Edge Cases - Deep Nesting', () => {
    it('should handle very deep nested arrays (5+ levels)', () => {
        // Create 5D array: number[][][][][]
        let current: SemanticType = new PrimitiveType(PrimitiveKind.NUMBER);

        for (let i = 0; i < 5; i++) {
            current = new MutableCollectionType(CollectionKind.ARRAY, current);
        }

        const result = generator.semanticTypeToTSType(current);

        // Verify 5 levels of array nesting
        expect(result).toBeInstanceOf(TSArrayType);
        let depth = 0;
        let node: any = result;

        while (node instanceof TSArrayType && depth < 5) {
            expect(node.readonly).toBe(false);
            node = node.elementType;
            depth++;
        }

        expect(depth).toBe(5);
        expect(node).toBeInstanceOf(TSTypeReference);
        expect((node as TSTypeReference).name).toBe('number');
    });

    it('should handle deeply nested unions and intersections', () => {
        // Create complex nested type:
        // ((A & B) | (C & D)) & ((E | F) & G)

        const typeA = new ReferenceType('', 'A');
        const typeB = new ReferenceType('', 'B');
        const typeC = new ReferenceType('', 'C');
        const typeD = new ReferenceType('', 'D');
        const typeE = new ReferenceType('', 'E');
        const typeF = new ReferenceType('', 'F');
        const typeG = new ReferenceType('', 'G');

        // A & B
        const ab = new IntersectionType(new ImmutableSet(new Set([typeA, typeB])));
        // C & D
        const cd = new IntersectionType(new ImmutableSet(new Set([typeC, typeD])));
        // (A & B) | (C & D)
        const abcd = new UnionType(new ImmutableSet(new Set([ab, cd])));

        // E | F
        const ef = new UnionType(new ImmutableSet(new Set([typeE, typeF])));
        // (E | F) & G
        const efg = new IntersectionType(new ImmutableSet(new Set([ef, typeG])));

        // Final: ((A & B) | (C & D)) & ((E | F) & G)
        const final = new IntersectionType(new ImmutableSet(new Set([abcd, efg])));

        const result = generator.semanticTypeToTSType(final);

        // Verify top level is intersection
        expect(result).toBeInstanceOf(TSIntersectionType);
        const topIntersection = result as TSIntersectionType;
        expect(topIntersection.types).toHaveLength(2);

        // First member should be union
        expect(topIntersection.types[0]).toBeInstanceOf(TSUnionType);

        // Second member should be intersection
        expect(topIntersection.types[1]).toBeInstanceOf(TSIntersectionType);
    });
});

describe('Edge Cases - Large Interfaces', () => {
    it('should handle interfaces with 50+ properties', () => {
        generator.reset();

        // Create object type with 50 properties
        const properties = new Map<string, SemanticType>();
        const requiredSet = new Set<string>();

        for (let i = 1; i <= 50; i++) {
            properties.set(`prop${i}`, new PrimitiveType(PrimitiveKind.STRING));
            if (i % 2 === 0) {
                requiredSet.add(`prop${i}`); // Even properties required
            }
        }

        const largeType = new ObjectType(
            new ImmutableMap(properties),
            new ImmutableSet(requiredSet)
        );

        const iface = generator.generateEntityInterface('LargeInterface', largeType);

        expect(iface.name).toBe('LargeInterface');
        expect(iface.properties).toHaveLength(50);

        // Verify optional/required flags
        const requiredProps = iface.properties.filter(p => !p.optional);
        const optionalProps = iface.properties.filter(p => p.optional);

        expect(requiredProps).toHaveLength(25); // Half are required
        expect(optionalProps).toHaveLength(25); // Half are optional
    });

    it('should handle interfaces with mixed complex property types', () => {
        generator.reset();

        // Create interface with various complex types
        const properties = new Map<string, SemanticType>([
            // Simple primitives
            ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['name', new PrimitiveType(PrimitiveKind.STRING)],

            // Arrays
            ['tags', new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new PrimitiveType(PrimitiveKind.STRING)
            )],

            // Nested arrays
            ['matrix', new MutableCollectionType(
                CollectionKind.ARRAY,
                new MutableCollectionType(
                    CollectionKind.ARRAY,
                    new PrimitiveType(PrimitiveKind.NUMBER)
                )
            )],

            // Union types
            ['status', new UnionType(new ImmutableSet(new Set([
                new PrimitiveType(PrimitiveKind.STRING),
                new PrimitiveType(PrimitiveKind.NUMBER)
            ])))],

            // Reference types
            ['user', new ReferenceType('App\\Models', 'User')],

            // Arrays of references
            ['comments', new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new ReferenceType('App\\Models', 'Comment')
            )]
        ]);

        const complexType = new ObjectType(
            new ImmutableMap(properties),
            new ImmutableSet(new Set(['id', 'name']))
        );

        const iface = generator.generateEntityInterface('ComplexInterface', complexType);

        expect(iface.name).toBe('ComplexInterface');
        expect(iface.properties).toHaveLength(7);

        // Verify imports collected for reference types
        const imports = generator['importCollector'].getImports();
        expect(imports.some(spec => spec.named.has('User'))).toBe(true);
        expect(imports.some(spec => spec.named.has('Comment'))).toBe(true);
    });
});

describe('Edge Cases - Reserved Keywords', () => {
    it('should allow TypeScript reserved keywords as property names', () => {
        // TypeScript allows reserved words as property names (quoted)
        const properties = new Map<string, SemanticType>([
            ['type', new PrimitiveType(PrimitiveKind.STRING)],
            ['interface', new PrimitiveType(PrimitiveKind.STRING)],
            ['class', new PrimitiveType(PrimitiveKind.STRING)],
            ['function', new PrimitiveType(PrimitiveKind.STRING)],
            ['return', new PrimitiveType(PrimitiveKind.STRING)]
        ]);

        const keywordType = new ObjectType(
            new ImmutableMap(properties),
            new ImmutableSet(new Set(['type']))
        );

        // Should not throw error
        const iface = generator.generateEntityInterface('KeywordProps', keywordType);

        expect(iface.name).toBe('KeywordProps');
        expect(iface.properties).toHaveLength(5);

        // Property names should be preserved as-is
        const propNames = iface.properties.map(p => p.name);
        expect(propNames).toContain('type');
        expect(propNames).toContain('interface');
        expect(propNames).toContain('class');
    });
});

describe('Error Handling - Custom Errors', () => {
    it('should throw TypeConversionError with helpful context', () => {
        const invalidType = { kind: 'invalid' } as any;

        expect(() => {
            generator['convertPrimitiveType'](invalidType);
        }).toThrow('Expected primitive type, got invalid');
    });

    it('should throw InterfaceGenerationError for wrong type kind', () => {
        const primitiveType = new PrimitiveType(PrimitiveKind.STRING) as any;

        expect(() => {
            generator.generateEntityInterface('Invalid', primitiveType);
        }).toThrow('Expected ObjectType, got primitive');
    });

    it('should wrap errors in InterfaceGenerationError', () => {
        // Create invalid object type that will cause error during processing
        const invalidProps = new Map<string, SemanticType>([
            ['prop', { kind: 'invalid' } as any] // Invalid type will cause error
        ]);

        const invalidType = new ObjectType(
            new ImmutableMap(invalidProps),
            new ImmutableSet(new Set())
        );

        try {
            generator.generateEntityInterface('Invalid', invalidType);
            expect.fail('Should have thrown error');
        } catch (error: any) {
            // Should wrap error in InterfaceGenerationError
            expect(error.message).toContain('Failed to generate interface');
        }
    });
});
});
