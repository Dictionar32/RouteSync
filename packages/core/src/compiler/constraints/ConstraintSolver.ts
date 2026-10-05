/**
 * Relation-native constraint solver.
 *
 * Constraints, variable states, adjacency and equivalence are all immutable
 * relations. Fixed-point propagation returns a new solver state rather than
 * mutating host Map/Set containers.
 */
import type { Constraint, ConstraintViolation } from './Constraint';
import { createTypeEnvironment, type TypeEnvironment, type VariableState } from './TypeEnvironment';
import {
  createUnionFind,
  unionFindFind,
  type UnionFind,
} from './UnionFind';
import {
  relationIndexAdd,
  relationIndexLookup,
  relationInsert,
  relationUnique,
  type RelationIndex,
} from '../../semantic/foundation/relationMembership';
import {
  relationAny,
  relationEqual,
} from '../../semantic/foundation/semanticRelations';
import {
  relationOptionFold,
  relationFold,
  relationRefine,
  relationResolve,
} from '../../semantic/foundation/relationalSequence';
import {
  solveConstraintStep,
  resolveVariableFromBounds,
  type ConstraintStateIndex,
} from './solver';

export { solveConstraintStep, resolveVariableFromBounds };

export type SolveIndex = {
  readonly constraintIndex: RelationIndex<number, readonly Constraint[]>;
  readonly neighbors: RelationIndex<number, readonly number[]>;
};

type WorkState = {
  readonly position: number;
  readonly queue: readonly number[];
  readonly index: SolveIndex;
  readonly states: ConstraintStateIndex;
  readonly unionFind: UnionFind;
  readonly diagnostics: readonly ConstraintViolation[];
};

const appendConstraint = (
  index: RelationIndex<number, readonly Constraint[]>,
  key: number,
  constraint: Constraint,
): RelationIndex<number, readonly Constraint[]> => {
  const current = relationOptionFold(relationIndexLookup(index, key), () => Object.freeze([] as Constraint[]), value => value);
  return relationIndexAdd(index, key, Object.freeze([...current, constraint]));
};

const appendNeighbor = (
  index: RelationIndex<number, readonly number[]>,
  from: number,
  to: number,
): RelationIndex<number, readonly number[]> => {
  const current = relationOptionFold(relationIndexLookup(index, from), () => Object.freeze([] as number[]), value => value);
  return relationIndexAdd(index, from, relationInsert(current, to));
};

type TargetConstraint = Extract<Constraint, { kind: 'Equality' | 'Subtype' }>;
type ExpectedConstraint = Extract<Constraint, { kind: 'PropertyExists' | 'ReturnType' }>;

const targetPredicate = (constraint: Constraint): constraint is TargetConstraint =>
  relationAny([relationEqual(constraint.kind, 'Equality'), relationEqual(constraint.kind, 'Subtype')]);
const expectedPredicate = (constraint: Constraint): constraint is ExpectedConstraint =>
  relationAny([relationEqual(constraint.kind, 'PropertyExists'), relationEqual(constraint.kind, 'ReturnType')]);

const constraintVariables = (constraint: Constraint): readonly number[] =>
  relationOptionFold(
    relationRefine(constraint, targetPredicate),
    () => relationOptionFold(
      relationRefine(constraint, expectedPredicate),
      () => [constraint.source.id],
      value => [value.source.id, value.expected.id],
    ),
    value => [value.source.id, value.target.id],
  );

const subtypePredicate = (constraint: Constraint): constraint is Extract<Constraint, { kind: 'Subtype' }> =>
  relationEqual(constraint.kind, 'Subtype');

const indexConstraints = (constraints: readonly Constraint[]): SolveIndex =>
  relationFold(
    constraints,
    { constraintIndex: Object.freeze([]), neighbors: Object.freeze([]) } as SolveIndex,
    (state, constraint) => {
      const nextIndex = appendConstraint(state.constraintIndex, constraint.source.id, constraint);
      return relationOptionFold(
        relationRefine(constraint, subtypePredicate),
        () => ({ ...state, constraintIndex: nextIndex }),
        value => ({
          constraintIndex: nextIndex,
          neighbors: appendNeighbor(
            appendNeighbor(state.neighbors, value.source.id, value.target.id),
            value.target.id,
            value.source.id,
          ),
        }),
      );
    },
  );

const variableIds = (constraints: readonly Constraint[]): readonly number[] =>
  relationUnique(
    relationFold(
      constraints,
      Object.freeze([] as number[]),
      (ids, constraint) => relationFold(
        constraintVariables(constraint),
        ids,
        (current, id) => relationInsert(current, id),
      ),
    ),
  );

const propagate = (state: WorkState): WorkState =>
  relationResolve(
    state.position < state.queue.length,
    () => {
      const variable = state.queue[state.position];
      const affected = relationOptionFold(
        relationIndexLookup(state.index.constraintIndex, variable),
        () => Object.freeze([] as Constraint[]),
        value => value,
      );
      const stepped = relationFold(
        affected,
        { states: state.states, unionFind: state.unionFind, diagnostics: state.diagnostics, queue: state.queue },
        (current, constraint) => {
          const diagnostics = [...current.diagnostics];
          const result = solveConstraintStep(constraint, current.unionFind, current.states, diagnostics);
          const adjacent = relationOptionFold(
            relationIndexLookup(state.index.neighbors, variable),
            () => Object.freeze([] as number[]),
            value => value,
          );
          return relationResolve(
            result.changed,
            () => ({
              states: result.states,
              unionFind: result.unionFind,
              diagnostics: Object.freeze(diagnostics),
              queue: Object.freeze([...current.queue, ...adjacent]),
            }),
            () => ({
              states: result.states,
              unionFind: result.unionFind,
              diagnostics: Object.freeze(diagnostics),
              queue: current.queue,
            }),
          );
        },
      );
      return propagate({
        ...state,
        position: state.position + 1,
        states: stepped.states,
        unionFind: stepped.unionFind,
        diagnostics: stepped.diagnostics,
        queue: stepped.queue,
      });
    },
    () => state,
  );

const resolveEnvironment = (
  states: ConstraintStateIndex,
  uf: UnionFind,
): TypeEnvironment =>
  relationFold(
    states,
    createTypeEnvironment(),
    (environment, [id, state]) => {
      const representative = unionFindFind(uf, id);
      const representativeState = relationOptionFold(
        relationIndexLookup(states, representative),
        () => state,
        value => value,
      );
      return relationOptionFold(
        resolveVariableFromBounds(representativeState),
        () => environment,
        value => environment.bind(id, value),
      );
    },
  );

export interface ConstraintSolveResult {
  readonly environment: TypeEnvironment;
  readonly diagnostics: readonly ConstraintViolation[];
}

export const solveConstraints = (constraints: readonly Constraint[]): ConstraintSolveResult => {
  const index = indexConstraints(constraints);
  const queue = variableIds(constraints);
  const result = propagate({
    position: 0,
    queue,
    index,
    states: Object.freeze([]),
    unionFind: createUnionFind(),
    diagnostics: Object.freeze([]),
  });
  return Object.freeze({
    environment: resolveEnvironment(result.states, result.unionFind),
    diagnostics: Object.freeze(result.diagnostics)
  });
};
