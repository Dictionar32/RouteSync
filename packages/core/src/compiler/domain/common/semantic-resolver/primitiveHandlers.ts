/**
 * primitiveHandlers.ts
 *
 * Handlers for primitive, reference, and collection SemanticTypes.
 *
 * @module compiler/domain/common/semantic-resolver
 */

import {
    PrimitiveType,
    ReferenceType,
    ReadonlyCollectionType,
    MutableCollectionType,
    type SemanticType,
    PrimitiveKind
} from '../../../types/SemanticType';
import {
    ResolvedPrimitiveType,
    ResolvedReferenceType,
    ResolvedCollectionType,
    type ResolvedSemanticType,
    type ResolvedPrimitiveKind
} from '../ResolvedSemanticType';
import type { SemanticTypeHandler, SemanticTypeResolverLike } from './resolverContracts';

export class PrimitiveTypeHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'primitive';
    }

    resolve(type: SemanticType): ResolvedSemanticType {
        const prim = type as PrimitiveType;
        const primitiveKindMap: { readonly [K in PrimitiveKind]: ResolvedPrimitiveKind } = {
            [PrimitiveKind.STRING]: 'string',
            [PrimitiveKind.NUMBER]: 'number',
            [PrimitiveKind.BOOLEAN]: 'boolean',
            [PrimitiveKind.DATETIME]: 'datetime',
            [PrimitiveKind.FILE]: 'file',
            [PrimitiveKind.UNKNOWN]: 'unknown',
            [PrimitiveKind.UNSPECIFIED]: 'unspecified'
        };
        return new ResolvedPrimitiveType({ primitiveKind: primitiveKindMap[prim.type] });
    }
}

export class ReferenceTypeHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'reference';
    }

    resolve(type: SemanticType): ResolvedSemanticType {
        const ref = type as ReferenceType;
        return new ResolvedReferenceType({ name: ref.name, namespace: ref.namespace });
    }
}

export class CollectionTypeHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'readonly_collection' || type.kind === 'mutable_collection';
    }

    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType {
        const col = type as ReadonlyCollectionType | MutableCollectionType;
        return new ResolvedCollectionType({ elementType: resolver.resolve(col.elementType) });
    }
}
