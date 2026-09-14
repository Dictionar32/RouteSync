/**
 * wrappers.ts
 *
 * Monadic Functor Type Wrappers for Schema Morphism (Level 7 Architecture).
 * Unifies nullability, cardinality, and pagination into categorical compositions.
 *
 * @module core/types/domain/schemaMorphism
 */

export const TypeWrapperKind = Object.freeze({
    Identity: 'identity',
    Nullable: 'nullable',
    Collection: 'collection',
    Paginated: 'paginated',
} as const);

export type TypeWrapperKind = typeof TypeWrapperKind[keyof typeof TypeWrapperKind];

export interface IdentityWrapper<C> {
    readonly kind: typeof TypeWrapperKind.Identity;
    readonly carrier: C;
}

export interface NullableWrapper<C> {
    readonly kind: typeof TypeWrapperKind.Nullable;
    readonly inner: TypeWrapper<C>;
}

export interface CollectionWrapper<C> {
    readonly kind: typeof TypeWrapperKind.Collection;
    readonly element: TypeWrapper<C>;
}

export interface PaginatedWrapper<C> {
    readonly kind: typeof TypeWrapperKind.Paginated;
    readonly element: TypeWrapper<C>;
}

export type TypeWrapper<C> =
    | IdentityWrapper<C>
    | NullableWrapper<C>
    | CollectionWrapper<C>
    | PaginatedWrapper<C>;

export class TypeWrapperFactory {
    public static identity<C>(carrier: C): IdentityWrapper<C> {
        return Object.freeze({ kind: TypeWrapperKind.Identity, carrier });
    }

    public static nullable<C>(inner: TypeWrapper<C>): NullableWrapper<C> {
        return Object.freeze({ kind: TypeWrapperKind.Nullable, inner });
    }

    public static collection<C>(element: TypeWrapper<C>): CollectionWrapper<C> {
        return Object.freeze({ kind: TypeWrapperKind.Collection, element });
    }

    public static paginated<C>(element: TypeWrapper<C>): PaginatedWrapper<C> {
        return Object.freeze({ kind: TypeWrapperKind.Paginated, element });
    }
}
