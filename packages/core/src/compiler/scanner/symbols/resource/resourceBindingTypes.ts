/**
 * resourceBindingTypes.ts
 *
 * Guaranteed ADT Model Binding Contract for Laravel JsonResources.
 * Conforms to Rule 10 (0 '?') and Rule 12 (Catamorphic Eliminator).
 *
 * @module compiler/scanner/symbols/resource
 */

import { relationGate } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
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

export interface MonoModelBinding {
    readonly kind: 'mono';
    readonly model: OriginModelSymbol;
    readonly source: ResourceModelBindingSource;
}

export interface PolyModelBinding {
    readonly kind: 'poly';
    readonly models: readonly OriginModelSymbol[];
    readonly source: Extract<ResourceModelBindingSource, { readonly kind: 'controller_dataflow' }>;
}

export interface UnbackedDtoBinding {
    readonly kind: 'unbacked_dto';
    readonly reason: StringValue;
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
    return relationGate(relationEqual(binding.kind, 'mono'), () => visitor.mono(binding),
        () => relationGate(relationEqual(binding.kind, 'poly'), () => visitor.poly(binding), () => visitor.unbacked_dto(binding)));
}

export class ResourceModelBindingFactory {
    public static mono(model: OriginModelSymbol, source: ResourceModelBindingSource): MonoModelBinding {
        return Object.freeze({ kind: 'mono', model, source });
    }

    public static poly(models: readonly OriginModelSymbol[], source: Extract<ResourceModelBindingSource, { readonly kind: 'controller_dataflow' }> = ResourceModelBindingSource.controllerDataflow): PolyModelBinding {
        return Object.freeze({ kind: 'poly', models: Object.freeze([...models]), source });
    }

    public static unbackedDto(reason: StringValue): UnbackedDtoBinding {
        return Object.freeze({ kind: 'unbacked_dto', reason });
    }
}
