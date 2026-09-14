/**
 * index.ts
 *
 * Single Source of Truth exports for Schema Morphism and Functor Wrappers.
 *
 * @module core/types/domain/schemaMorphism
 */

export {
    TypeWrapperKind,
    type IdentityWrapper,
    type NullableWrapper,
    type CollectionWrapper,
    type PaginatedWrapper,
    type TypeWrapper,
    TypeWrapperFactory,
} from './wrappers';

export {
    DomainCarrierKind,
    type ScalarCarrier,
    type ModelCarrier,
    type ResourceCarrier,
    type StructuralCarrier,
    type DomainCarrier,
    type SchemaFieldMorphism,
    DomainCarrierFactory,
} from './carriers';

export {
    type WrapperAlgebra,
    type CarrierVisitor,
    matchDomainCarrier,
    foldTypeWrapper,
} from './algebra';
