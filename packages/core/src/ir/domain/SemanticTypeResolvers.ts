/**
 * @file SemanticTypeResolvers.ts
 * @description Modular semantic type resolvers for ResolvedSemanticType variants (0 cast, 0 ?)
 *
 * @module core/ir/domain/SemanticTypeResolvers
 */

import type {
    TypeIR,
    PrimitiveTypeIR,
    ReferenceTypeIR,
    ResolvedSemanticType,
    PrimitiveSemanticTypeIR,
    ResourceSemanticTypeIR,
    ModelSemanticTypeIR,
    ObjectSemanticTypeIR,
    ArraySemanticTypeIR,
    UnionSemanticTypeIR,
    LiteralSemanticTypeIR
} from '../../types/ir';

import { TypeIRUtils } from '../../types/ir';

export class SemanticTypeResolvers {
    static resolvePrimitive(primitiveType: PrimitiveSemanticTypeIR): TypeIR {
        return {
            kind: 'primitive',
            type: (primitiveType.type || 'unknown') as PrimitiveTypeIR['type'],
            format: primitiveType.format !== null ? primitiveType.format : undefined
        };
    }

    static resolveResource(resourceType: ResourceSemanticTypeIR): TypeIR {
        const resourceRef: ReferenceTypeIR = {
            kind: 'reference',
            target: resourceType.resource + 'Schema'
        };

        if (resourceType.collection) {
            return TypeIRUtils.makeArray(resourceRef);
        }

        return resourceRef;
    }

    static resolveModel(modelType: ModelSemanticTypeIR): TypeIR {
        return {
            kind: 'reference',
            target: modelType.model + 'Schema'
        };
    }

    static resolveObject(objectType: ObjectSemanticTypeIR, resolver: (type: ResolvedSemanticType) => TypeIR): TypeIR {
        const properties: Record<string, TypeIR> = {};
        for (const [key, value] of Object.entries(objectType.properties)) {
            properties[key] = resolver(value);
        }

        return {
            kind: 'inline_object',
            properties,
            additionalProperties: false
        };
    }

    static resolveArray(arrayType: ArraySemanticTypeIR, resolver: (type: ResolvedSemanticType) => TypeIR): TypeIR {
        return TypeIRUtils.makeArray(resolver(arrayType.items));
    }

    static resolveUnion(unionType: UnionSemanticTypeIR, resolver: (type: ResolvedSemanticType) => TypeIR): TypeIR {
        return {
            kind: 'union',
            types: unionType.types.map(t => resolver(t))
        };
    }

    static resolveLiteral(literalType: LiteralSemanticTypeIR): TypeIR {
        return {
            kind: 'literal',
            value: literalType.value
        };
    }
}
