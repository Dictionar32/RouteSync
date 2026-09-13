/**
 * resolverContracts.ts
 *
 * Contracts for semantic type resolvers and handler strategies.
 *
 * @module compiler/domain/common/semantic-resolver
 */

import type { SemanticType } from '../../../types/SemanticType';
import type { ResolvedSemanticType } from '../ResolvedSemanticType';

export interface SemanticTypeResolverLike {
    resolve(type: SemanticType): ResolvedSemanticType;
}

export interface SemanticTypeHandler {
    supports(type: SemanticType): boolean;
    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType;
}
