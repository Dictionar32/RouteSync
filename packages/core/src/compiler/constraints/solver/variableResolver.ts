/**
 * Variable bound joining and resolution for constraint satisfaction.
 */
import type { SemanticType } from '../../types/SemanticType';
import { SemanticTypeFactory } from '../../types/SemanticType';
import { relationResolve, relationFirstOption, type RelationOption } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';
import { relationUnique, type RelationMembership } from '../../../semantic/kernel/relationMembership';
import type { VariableState } from '../TypeEnvironment';

export function joinTypes(types: RelationMembership<SemanticType>): RelationOption<SemanticType> {
  return relationResolve(
    relationEqual(types.length, 0),
    () => ({ kind: 'none' }),
    () => relationResolve(
      relationEqual(types.length, 1),
      () => relationFirstOption(types, () => true),
      () => ({ kind: 'some', value: SemanticTypeFactory.union(types) }),
    ),
  );
}

export function resolveVariableFromBounds(state: VariableState): RelationOption<SemanticType> {
  const lower = joinTypes(state.lowerBounds);
  return relationResolve(
    relationEqual(lower.kind, 'some'),
    () => lower,
    () => joinTypes(state.upperBounds),
  );
}
