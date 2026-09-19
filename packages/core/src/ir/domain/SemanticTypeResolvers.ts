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
    LiteralSemanticTypeIR,
    NullableSemanticTypeIR
} from '../../types/ir';

import { TypeIRUtils } from '../../types/ir';
import { PrimitiveKind } from '../../compiler/types/SemanticType';

const toPrimitiveIR = (kind: PrimitiveKind): PrimitiveTypeIR['type'] => {
    const mapping: Record<PrimitiveKind, PrimitiveTypeIR['type']> = {
        [PrimitiveKind.STRING]: 'string',
        [PrimitiveKind.NUMBER]: 'number',
        [PrimitiveKind.BOOLEAN]: 'boolean',
        [PrimitiveKind.DATETIME]: 'date',
        [PrimitiveKind.FILE]: 'json',
        [PrimitiveKind.UNKNOWN]: 'unknown'
    };
    return mapping[kind];
};

export class SemanticTypeResolvers {
    static resolvePrimitive(primitiveType: PrimitiveSemanticTypeIR): TypeIR {
        return {
            kind: 'primitive',
            type: toPrimitiveIR(primitiveType.type),
            format: primitiveType.format.kind === 'type_expression' ? JSON.stringify(primitiveType.format.value) : undefined
        };
    }

    static resolveResource(resourceType: ResourceSemanticTypeIR): TypeIR {
        const resourceRef: ReferenceTypeIR = {
            kind: 'reference',
            target: resourceType.resource + 'Schema'
        };

        if (resourceType.cardinality === 'collection') {
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
        for (const property of objectType.properties) {
            properties[property.name] = resolver(property.type);
        }

        return {
            kind: 'inline_object',
            properties,
            additionalProperties: false
        };
    }

    static resolveNullable(nullableType: NullableSemanticTypeIR, resolver: (type: ResolvedSemanticType) => TypeIR): TypeIR {
        return {
            kind: 'nullable',
            inner: resolver(nullableType.innerType)
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
