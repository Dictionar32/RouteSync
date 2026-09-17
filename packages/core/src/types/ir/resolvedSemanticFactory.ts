/**
 * resolvedSemanticFactory.ts
 *
 * Strict Frozen Factory for ResolvedSemanticType ADT variants.
 * Guarantees Object.freeze immutability & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/resolvedSemanticFactory
 */

import type { PrimitiveKind } from '../../compiler/types/SemanticType';
import type {
    PrimitiveSemanticTypeIR,
    ResourceSemanticTypeIR,
    ModelSemanticTypeIR,
    ObjectSemanticTypeIR,
    ArraySemanticTypeIR,
    NullableSemanticTypeIR,
    UnionSemanticTypeIR,
    LiteralSemanticTypeIR,
    ObjectSemanticProperty,
    ResolvedSemanticType,
    ResolvedSemanticMeta
} from './resolvedSemanticTypes';

const bound = (resolved: ResolvedSemanticMeta): ResolvedSemanticMeta =>
    Object.freeze(resolved);

const unbound = (): ResolvedSemanticMeta =>
    Object.freeze({ isBound: false });

const resolveMeta = (resolved: ResolvedSemanticMeta | undefined): ResolvedSemanticMeta =>
    bound(resolved === undefined ? unbound() : resolved);


export class ResolvedSemanticTypeFactory {
    static primitive(type: PrimitiveKind, format: string | null = null, resolved?: ResolvedSemanticMeta): PrimitiveSemanticTypeIR {
        return Object.freeze({ kind: 'primitive', type, format, resolved: resolveMeta(resolved) });
    }

    static resource(resource: string, collection = false, resolved?: ResolvedSemanticMeta): ResourceSemanticTypeIR {
        return Object.freeze({ kind: 'resource', resource, collection, resolved: resolveMeta(resolved) });
    }

    static model(model: string, resolved?: ResolvedSemanticMeta): ModelSemanticTypeIR {
        return Object.freeze({ kind: 'model', model, resolved: resolveMeta(resolved) });
    }

    static object(properties: readonly ObjectSemanticProperty[], resolved?: ResolvedSemanticMeta): ObjectSemanticTypeIR {
        return Object.freeze({ kind: 'object', properties: Object.freeze([...properties]), resolved: resolveMeta(resolved) });
    }

    static nullable(innerType: ResolvedSemanticType, resolved?: ResolvedSemanticMeta): NullableSemanticTypeIR {
        return Object.freeze({ kind: 'nullable', innerType, resolved: resolveMeta(resolved) });
    }

    static array(items: ResolvedSemanticType, resolved?: ResolvedSemanticMeta): ArraySemanticTypeIR {
        return Object.freeze({ kind: 'array', items, resolved: resolveMeta(resolved) });
    }

    static union(types: readonly ResolvedSemanticType[], resolved?: ResolvedSemanticMeta): UnionSemanticTypeIR {
        return Object.freeze({ kind: 'union', types: Object.freeze([...types]), resolved: resolveMeta(resolved) });
    }

    static literal(value: string | number | boolean, resolved?: ResolvedSemanticMeta): LiteralSemanticTypeIR {
        return Object.freeze({ kind: 'literal', value, resolved: resolveMeta(resolved) });
    }
}
