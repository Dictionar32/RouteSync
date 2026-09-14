/**
 * algebra.ts
 *
 * Catamorphic Functor Reduction and Projection Algebra (Level 7 Architecture).
 * 0 'if', 0 'switch', pure bottom-up recursion.
 *
 * @module core/types/domain/schemaMorphism
 */

import type { TypeWrapper } from './wrappers';
import type { DomainCarrier, ScalarCarrier, ModelCarrier, ResourceCarrier, StructuralCarrier } from './carriers';

export interface WrapperAlgebra<R> {
    readonly identity: (carrier: R) => R;
    readonly nullable: (inner: R) => R;
    readonly collection: (element: R) => R;
    readonly paginated: (element: R) => R;
}

export interface CarrierVisitor<R> {
    readonly scalar: (carrier: ScalarCarrier) => R;
    readonly model: (carrier: ModelCarrier) => R;
    readonly resource: (carrier: ResourceCarrier) => R;
    readonly structural: (carrier: StructuralCarrier) => R;
}

export function matchDomainCarrier<R>(
    carrier: DomainCarrier,
    visitor: CarrierVisitor<R>
): R {
    return visitor[carrier.kind](carrier as any);
}

export function foldTypeWrapper<C, R>(
    wrapper: TypeWrapper<C>,
    carrierFolder: (c: C) => R,
    algebra: WrapperAlgebra<R>
): R {
    const DISPATCH: {
        [K in TypeWrapper<C>['kind']]: (w: Extract<TypeWrapper<C>, { kind: K }>) => R;
    } = {
        identity: (w) => algebra.identity(carrierFolder(w.carrier)),
        nullable: (w) => algebra.nullable(foldTypeWrapper(w.inner, carrierFolder, algebra)),
        collection: (w) => algebra.collection(foldTypeWrapper(w.element, carrierFolder, algebra)),
        paginated: (w) => algebra.paginated(foldTypeWrapper(w.element, carrierFolder, algebra)),
    };

    return DISPATCH[wrapper.kind](wrapper as any);
}
