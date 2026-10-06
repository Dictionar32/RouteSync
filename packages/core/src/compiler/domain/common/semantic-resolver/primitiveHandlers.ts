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
} from '../../../../types/domain/semanticType';
import {
    ResolvedPrimitiveType,
    ResolvedReferenceType,
    ResolvedCollectionType,
    type ResolvedSemanticType,
    type ResolvedPrimitiveKind
} from '../ResolvedSemanticType';
import type { SemanticTypeHandler, SemanticTypeResolverLike } from './resolverContracts';
import { relationAny, relationEqual } from '../../../../semantic/foundation/semanticRelations';

export const PrimitiveTypeHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'primitive'),
    resolve: (type: SemanticType): ResolvedSemanticType => {
        const prim = type as PrimitiveType;
        const primitiveKindMap: { readonly [K in PrimitiveKind]: ResolvedPrimitiveKind } = {
            [PrimitiveKind.STRING]: 'string',
            [PrimitiveKind.NUMBER]: 'number',
            [PrimitiveKind.BOOLEAN]: 'boolean',
            [PrimitiveKind.DATETIME]: 'datetime',
            [PrimitiveKind.FILE]: 'file',
            [PrimitiveKind.INDETERMINATE]: 'unknown',
            [PrimitiveKind.UNSPECIFIED]: 'unspecified'
        };
        return ResolvedPrimitiveType.create({ primitiveKind: primitiveKindMap[prim.type] });
    },
});

export const ReferenceTypeHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'reference'),
    resolve: (type: SemanticType): ResolvedSemanticType => {
        const ref = type as ReferenceType;
        return ResolvedReferenceType.create({ name: ref.name, namespace: ref.namespace });
    },
});

export const CollectionTypeHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationAny([
        relationEqual(type.kind, 'readonly_collection'),
        relationEqual(type.kind, 'mutable_collection'),
    ]),
    resolve: (type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType => {
        const col = type as ReadonlyCollectionType | MutableCollectionType;
        return ResolvedCollectionType.create({ elementType: resolver.resolve(col.elementType) });
    },
});
