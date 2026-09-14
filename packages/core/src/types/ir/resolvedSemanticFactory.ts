/**
 * resolvedSemanticFactory.ts
 *
 * Strict Frozen Factory for ResolvedSemanticType ADT variants.
 * Guarantees Object.freeze immutability & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/resolvedSemanticFactory
 */

import type { SemanticType } from '../semantic';
import type {
    PrimitiveSemanticTypeIR,
    ResourceSemanticTypeIR,
    ModelSemanticTypeIR,
    ObjectSemanticTypeIR,
    ArraySemanticTypeIR,
    UnionSemanticTypeIR,
    LiteralSemanticTypeIR,
    ResolvedSemanticType,
    ResolvedSemanticMeta
} from './resolvedSemanticTypes';

const wrapMeta = (res?: ResolvedSemanticMeta) => res !== undefined ? { resolved: Object.freeze({ ...res }) } : {};

export class ResolvedSemanticTypeFactory {
    static primitive(type: SemanticType, format: string | null = null, resolved?: ResolvedSemanticMeta): PrimitiveSemanticTypeIR {
        return Object.freeze({ kind: 'primitive', type, format, ...wrapMeta(resolved) });
    }

    static resource(resource: string, collection = false, resolved?: ResolvedSemanticMeta): ResourceSemanticTypeIR {
        return Object.freeze({ kind: 'resource', resource, collection, ...wrapMeta(resolved) });
    }

    static model(model: string, resolved?: ResolvedSemanticMeta): ModelSemanticTypeIR {
        return Object.freeze({ kind: 'model', model, ...wrapMeta(resolved) });
    }

    static object(properties: Readonly<Record<string, ResolvedSemanticType>>, resolved?: ResolvedSemanticMeta): ObjectSemanticTypeIR {
        const propertyEntries = Object.freeze(Object.entries(properties).map(([k, v]) => Object.freeze([k, v] as const)));
        return Object.freeze({ kind: 'object', properties: Object.freeze({ ...properties }), propertyEntries, ...wrapMeta(resolved) });
    }

    static array(items: ResolvedSemanticType, resolved?: ResolvedSemanticMeta): ArraySemanticTypeIR {
        return Object.freeze({ kind: 'array', items, ...wrapMeta(resolved) });
    }

    static union(types: readonly ResolvedSemanticType[], resolved?: ResolvedSemanticMeta): UnionSemanticTypeIR {
        return Object.freeze({ kind: 'union', types: Object.freeze([...types]), ...wrapMeta(resolved) });
    }

    static literal(value: string | number | boolean, resolved?: ResolvedSemanticMeta): LiteralSemanticTypeIR {
        return Object.freeze({ kind: 'literal', value, ...wrapMeta(resolved) });
    }
}
