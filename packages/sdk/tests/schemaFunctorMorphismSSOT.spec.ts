import { describe, it, expect } from 'vitest';
import {
    TypeWrapperKind,
    TypeWrapperFactory,
    DomainCarrierKind,
    DomainCarrierFactory,
    matchDomainCarrier,
    foldTypeWrapper,
    type WrapperAlgebra,
    type CarrierVisitor,
    PrimitiveKind,
    type DomainCarrier,
} from '@routesync/core';

describe('Level 7 Schema Morphism & Monadic Functor Composition SSOT', () => {
    describe('TypeWrapper Functor Composition', () => {
        it('constructs immutable functor wrappers with frozen state', () => {
            const scalar = DomainCarrierFactory.scalar(PrimitiveKind.STRING);
            const idWrap = TypeWrapperFactory.identity(scalar);
            const nullWrap = TypeWrapperFactory.nullable(idWrap);
            const collWrap = TypeWrapperFactory.collection(nullWrap);
            const pagWrap = TypeWrapperFactory.paginated(collWrap);

            expect(idWrap.kind).toBe(TypeWrapperKind.Identity);
            expect(nullWrap.kind).toBe(TypeWrapperKind.Nullable);
            expect(collWrap.kind).toBe(TypeWrapperKind.Collection);
            expect(pagWrap.kind).toBe(TypeWrapperKind.Paginated);

            expect(Object.isFrozen(idWrap)).toBe(true);
            expect(Object.isFrozen(nullWrap)).toBe(true);
            expect(Object.isFrozen(collWrap)).toBe(true);
            expect(Object.isFrozen(pagWrap)).toBe(true);
        });

        it('mathematically distinguishes Collection-of-Nullable vs Nullable-of-Collection', () => {
            const scalar = DomainCarrierFactory.scalar(PrimitiveKind.NUMBER);

            // Case A: Array of nullables -> (number | null)[]
            const arrayOfNullables = TypeWrapperFactory.collection(
                TypeWrapperFactory.nullable(TypeWrapperFactory.identity(scalar))
            );

            // Case B: Nullable array -> number[] | null
            const nullableArray = TypeWrapperFactory.nullable(
                TypeWrapperFactory.collection(TypeWrapperFactory.identity(scalar))
            );

            expect(arrayOfNullables.kind).toBe(TypeWrapperKind.Collection);
            expect(arrayOfNullables.element.kind).toBe(TypeWrapperKind.Nullable);

            expect(nullableArray.kind).toBe(TypeWrapperKind.Nullable);
            expect(nullableArray.inner.kind).toBe(TypeWrapperKind.Collection);

            // They are structurally distinct Functor compositions!
            expect(arrayOfNullables).not.toEqual(nullableArray);
        });
    });

    describe('Intrinsic Domain Carriers', () => {
        it('exhaustively matches all DomainCarrier variants via matchDomainCarrier (0 if)', () => {
            const visitor: CarrierVisitor<string> = {
                scalar: (c) => `scalar:${c.primitive}`,
                model: (c) => `model:${c.modelName}`,
                resource: (c) => `resource:${c.resourceName}`,
                structural: (c) => `structural:${c.entries.length}`,
            };

            const s = DomainCarrierFactory.scalar(PrimitiveKind.BOOLEAN);
            const m = DomainCarrierFactory.model('Product', PrimitiveKind.NUMBER);
            const r = DomainCarrierFactory.resource('ProductResource');
            const st = DomainCarrierFactory.structural([]);

            expect(matchDomainCarrier(s, visitor)).toBe('scalar:boolean');
            expect(matchDomainCarrier(m, visitor)).toBe('model:Product');
            expect(matchDomainCarrier(r, visitor)).toBe('resource:ProductResource');
            expect(matchDomainCarrier(st, visitor)).toBe('structural:0');
        });
    });

    describe('Pure Catamorphic Functor Projection (Zod & TypeScript)', () => {
        const carrierToZod = (carrier: DomainCarrier): string => {
            return matchDomainCarrier(carrier, {
                scalar: (c) => (c.primitive === PrimitiveKind.STRING ? 'z.string()' : 'z.number()'),
                model: (c) => `${c.modelName}Schema`,
                resource: (c) => `${c.resourceName}Schema`,
                structural: () => 'z.object({})',
            });
        };

        const ZodAlgebra: WrapperAlgebra<string> = {
            identity: (inner) => inner,
            nullable: (inner) => `${inner}.nullable()`,
            collection: (inner) => `z.array(${inner})`,
            paginated: (inner) => `createPaginated(${inner})`,
        };

        it('projects Collection-of-Nullables to z.array(z.string().nullable()) without branching', () => {
            const scalar = DomainCarrierFactory.scalar(PrimitiveKind.STRING);
            const wrap = TypeWrapperFactory.collection(
                TypeWrapperFactory.nullable(TypeWrapperFactory.identity(scalar))
            );

            const result = foldTypeWrapper(wrap, carrierToZod, ZodAlgebra);
            expect(result).toBe('z.array(z.string().nullable())');
        });

        it('projects Nullable-of-Collection to z.array(z.string()).nullable() without branching', () => {
            const scalar = DomainCarrierFactory.scalar(PrimitiveKind.STRING);
            const wrap = TypeWrapperFactory.nullable(
                TypeWrapperFactory.collection(TypeWrapperFactory.identity(scalar))
            );

            const result = foldTypeWrapper(wrap, carrierToZod, ZodAlgebra);
            expect(result).toBe('z.array(z.string()).nullable()');
        });

        it('projects Paginated Model to createPaginated(OrderSchema) cleanly', () => {
            const model = DomainCarrierFactory.model('Order');
            const wrap = TypeWrapperFactory.paginated(TypeWrapperFactory.identity(model));

            const result = foldTypeWrapper(wrap, carrierToZod, ZodAlgebra);
            expect(result).toBe('createPaginated(OrderSchema)');
        });
    });
});
