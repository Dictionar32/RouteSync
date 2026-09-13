/**
 * variableResolver.ts
 *
 * Variable bound joining and resolution for constraint satisfaction.
 *
 * @module compiler/constraints/solver
 */

import type { SemanticType } from '../../types/SemanticType';
import { UnionType } from '../../types/SemanticType';
import { ImmutableSet } from '../../utils/ImmutableCollections';
import type { VariableState } from '../TypeEnvironment';

export function joinTypes(types: Set<SemanticType>): SemanticType | undefined {
    if (types.size === 0) return undefined;
    if (types.size === 1) return Array.from(types.values())[0];
    return new UnionType(new ImmutableSet(types));
}

export function resolveVariableFromBounds(state: VariableState): SemanticType | undefined {
    const lower = joinTypes(state.lowerBounds);
    if (lower) return lower;
    return joinTypes(state.upperBounds);
}
