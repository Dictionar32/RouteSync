/**
 * SemanticTypeResolver.ts
 *
 * Active Consumer Orchestrator for transforming raw AST SemanticTypes
 * into target-agnostic structured ResolvedSemanticType domain value objects.
 * Pure flow declaration: coordinates handler strategy execution.
 *
 * @module compiler/domain/common
 */

import {
    type SemanticType
} from '../../../types/domain/semanticType';
import { relationFirst, relationOptionFold, relationRefine } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';
import type { ResourceFieldSemanticBinding } from '../../../types/domain/resourceFieldSemanticBinding';
import type { ResourceFieldSemantic } from '../../../types/domain/resourceFieldSemantic';

import {
    ResolvedUnknownType,
    type ResolvedSemanticType
} from './ResolvedSemanticType';

import {
    type SemanticTypeResolverLike,
    type SemanticTypeHandler,
    PrimitiveTypeHandler,
    ReferenceTypeHandler,
    CollectionTypeHandler,
    NullableWrapperHandler,
    DefaultObjectHandler,
    UnionTypeHandler,
    IntersectionTypeHandler,
    createDefaultSemanticTypeHandlers
} from './semantic-resolver';

export {
    type SemanticTypeResolverLike,
    type SemanticTypeHandler,
    PrimitiveTypeHandler,
    ReferenceTypeHandler,
    CollectionTypeHandler,
    NullableWrapperHandler,
    DefaultObjectHandler,
    UnionTypeHandler,
    IntersectionTypeHandler
};

const DEFAULT_HANDLERS = createDefaultSemanticTypeHandlers();
const EMPTY_CUSTOM_HANDLERS: readonly SemanticTypeHandler[] = Object.freeze([]);

export interface SemanticTypeResolverParams {
    readonly customHandlers: readonly SemanticTypeHandler[];
}

export interface SemanticTypeResolverInstance extends SemanticTypeResolverLike {
    readonly handlers: readonly SemanticTypeHandler[];
}

const createResolver = (customHandlers: readonly SemanticTypeHandler[] = EMPTY_CUSTOM_HANDLERS): SemanticTypeResolverInstance => {
    const handlers = Object.freeze([...customHandlers, ...DEFAULT_HANDLERS]);
    return Object.freeze({
        handlers,
        resolve: (type: SemanticType): ResolvedSemanticType => relationOptionFold(
            relationFirst(handlers, handler => handler.supports(type)),
            () => ResolvedUnknownType.create({ diagnosticMessage: `unsupported SemanticType kind '${type.kind}'` }),
            handler => handler.resolve(type, { resolve: (candidate: SemanticType) => relationOptionFold(
                relationFirst(handlers, item => item.supports(candidate)),
                () => ResolvedUnknownType.create({ diagnosticMessage: `unsupported SemanticType kind '${candidate.kind}'` }),
                item => item.resolve(candidate, createResolver(customHandlers)),
            ) }),
        ),
    });
};

export const SemanticTypeResolver = Object.freeze({
    default: (): SemanticTypeResolverInstance => createResolver(),
    withHandlers: (customHandlers: readonly SemanticTypeHandler[]): SemanticTypeResolverInstance => createResolver(customHandlers),
    resolveField: (field: ResourceFieldSemanticBinding): SemanticType => {
        type VerifiedSemantic = Extract<ResourceFieldSemantic, { readonly kind: 'verified' }>;
        const isVerified = (semantic: ResourceFieldSemantic): semantic is VerifiedSemantic =>
            relationEqual(semantic.kind, 'verified');
        return relationOptionFold(
            relationRefine(field.semantic, isVerified),
            () => { throw Error(`Resource field semantic rejected: ${field.semantic.kind}`); },
            semantic => semantic.type,
        );
    },
});
