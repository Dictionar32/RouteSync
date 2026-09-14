/**
 * resourceBindingTypes.ts
 *
 * Guaranteed ADT Model Binding Contract for Laravel JsonResources.
 * Conforms to Rule 10 (0 '?') and Rule 12 (Catamorphic Eliminator).
 *
 * @module compiler/scanner/symbols/resource
 */

import type { OriginModelSymbol } from "../model/originModelSymbol";

export type ResourceModelBindingSource =
    | 'controller_dataflow'
    | 'relation_propagation'
    | 'convention'
    | 'structural';

export interface MonoModelBinding {
    readonly kind: 'mono';
    readonly model: OriginModelSymbol;
    readonly source: ResourceModelBindingSource;
}

export interface PolyModelBinding {
    readonly kind: 'poly';
    readonly models: readonly OriginModelSymbol[];
    readonly source: 'controller_dataflow';
}

export interface UnbackedDtoBinding {
    readonly kind: 'unbacked_dto';
    readonly reason: string;
}

export type ResourceModelBinding =
    | MonoModelBinding
    | PolyModelBinding
    | UnbackedDtoBinding;

export interface ResourceModelBindingVisitor<R> {
    mono(binding: MonoModelBinding): R;
    poly(binding: PolyModelBinding): R;
    unbacked_dto(binding: UnbackedDtoBinding): R;
}

/**
 * Catamorphic eliminator for ResourceModelBinding (0 'if', 0 'switch' in consumer).
 */
export function matchResourceModelBinding<R>(
    binding: ResourceModelBinding,
    visitor: ResourceModelBindingVisitor<R>
): R {
    switch (binding.kind) {
        case 'mono':
            return visitor.mono(binding);
        case 'poly':
            return visitor.poly(binding);
        case 'unbacked_dto':
            return visitor.unbacked_dto(binding);
    }
}

export class ResourceModelBindingFactory {
    public static mono(model: OriginModelSymbol, source: ResourceModelBindingSource): MonoModelBinding {
        return Object.freeze({ kind: 'mono', model, source });
    }

    public static poly(models: readonly OriginModelSymbol[], source: 'controller_dataflow' = 'controller_dataflow'): PolyModelBinding {
        return Object.freeze({ kind: 'poly', models: Object.freeze([...models]), source });
    }

    public static unbackedDto(reason: string): UnbackedDtoBinding {
        return Object.freeze({ kind: 'unbacked_dto', reason });
    }
}
