/**
 * Canonical semantic algebra for Laravel Resource -> Model resolution.
 *
 * A binding is a closed judgment, not a parsed descriptor.  Each variant owns
 * its catamorphic eliminator so downstream code never has to recover a
 * concrete variant through host-language narrowing.
 */

import type { OriginModelSymbol } from "../model/originModelSymbol";
import type { StringValue } from '../../../../types/upstream/valueObjects';

export type ResourceModelBindingSource =
    | Readonly<{ readonly kind: 'controller_dataflow' }>
    | Readonly<{ readonly kind: 'relation_propagation' }>
    | Readonly<{ readonly kind: 'convention' }>
    | Readonly<{ readonly kind: 'structural' }>;

export const ResourceModelBindingSource = Object.freeze({
    controllerDataflow: Object.freeze({ kind: 'controller_dataflow' as const }),
    relationPropagation: Object.freeze({ kind: 'relation_propagation' as const }),
    convention: Object.freeze({ kind: 'convention' as const }),
    structural: Object.freeze({ kind: 'structural' as const }),
});

export interface ResourceModelBindingVisitor<R> {
    mono(binding: MonoModelBinding): R;
    poly(binding: PolyModelBinding): R;
    unbacked_dto(binding: UnbackedDtoBinding): R;
}

export interface MonoModelBinding {
    readonly kind: 'mono';
    readonly model: OriginModelSymbol;
    readonly source: ResourceModelBindingSource;
    readonly fold: <R>(visitor: ResourceModelBindingVisitor<R>) => R;
}

export interface PolyModelBinding {
    readonly kind: 'poly';
    readonly models: readonly OriginModelSymbol[];
    readonly source: Extract<ResourceModelBindingSource, { readonly kind: 'controller_dataflow' }>;
    readonly fold: <R>(visitor: ResourceModelBindingVisitor<R>) => R;
}

export interface UnbackedDtoBinding {
    readonly kind: 'unbacked_dto';
    readonly reason: StringValue;
    readonly fold: <R>(visitor: ResourceModelBindingVisitor<R>) => R;
}

export type ResourceModelBinding = MonoModelBinding | PolyModelBinding | UnbackedDtoBinding;

export function matchResourceModelBinding<R>(
    binding: ResourceModelBinding,
    visitor: ResourceModelBindingVisitor<R>
): R {
    return binding.fold(visitor);
}

const monoBinding = (model: OriginModelSymbol, source: ResourceModelBindingSource): MonoModelBinding => {
    const binding = {
        kind: 'mono' as const,
        model,
        source,
        fold: <R>(visitor: ResourceModelBindingVisitor<R>): R => visitor.mono(binding),
    };
    return Object.freeze(binding);
};

const polyBinding = (
    models: readonly OriginModelSymbol[],
    source: Extract<ResourceModelBindingSource, { readonly kind: 'controller_dataflow' }>
): PolyModelBinding => {
    const binding = {
        kind: 'poly' as const,
        models: Object.freeze([...models]),
        source,
        fold: <R>(visitor: ResourceModelBindingVisitor<R>): R => visitor.poly(binding),
    };
    return Object.freeze(binding);
};

const unbackedDtoBinding = (reason: StringValue): UnbackedDtoBinding => {
    const binding = {
        kind: 'unbacked_dto' as const,
        reason,
        fold: <R>(visitor: ResourceModelBindingVisitor<R>): R => visitor.unbacked_dto(binding),
    };
    return Object.freeze(binding);
};

/** Canonical constructors for the closed binding judgment. */
export class ResourceModelBindingFactory {
    public static mono(model: OriginModelSymbol, source: ResourceModelBindingSource): MonoModelBinding {
        return monoBinding(model, source);
    }

    public static poly(
        models: readonly OriginModelSymbol[],
        source: Extract<ResourceModelBindingSource, { readonly kind: 'controller_dataflow' }> = ResourceModelBindingSource.controllerDataflow
    ): PolyModelBinding {
        return polyBinding(models, source);
    }

    public static unbackedDto(reason: StringValue): UnbackedDtoBinding {
        return unbackedDtoBinding(reason);
    }
}
