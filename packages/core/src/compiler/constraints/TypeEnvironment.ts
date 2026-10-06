/**
 * Relation-valued type environment.
 *
 * Bindings are immutable keyed facts.  Absence is represented by
 * RelationOption, never by host null/undefined or a mutable Map.
 */
import type { SemanticType } from '../../types/domain/semanticType';
import {
  relationIndexAdd,
  relationIndexLookup,
  type RelationIndex,
} from '../../semantic/foundation/relationMembership';
import { relationOptionFold, type RelationOption } from '../../semantic/foundation/relationalSequence';

export interface TypeEnvironment {
  readonly bindings: RelationIndex<number, SemanticType>;
  readonly bind: (id: number, type: SemanticType) => TypeEnvironment;
  readonly resolve: (variable: number) => RelationOption<SemanticType>;
}

const createEnvironment = (bindings: RelationIndex<number, SemanticType>): TypeEnvironment => Object.freeze({
  bindings,
  bind: (id: number, type: SemanticType) => createEnvironment(relationIndexAdd(bindings, id, type)),
  resolve: (variable: number) => relationIndexLookup(bindings, variable),
});

export const createTypeEnvironment = (): TypeEnvironment => createEnvironment(Object.freeze([]));

export interface VariableState {
  readonly lowerBounds: readonly SemanticType[];
  readonly upperBounds: readonly SemanticType[];
}
