/**
 * Phase 384 — declarative control topology.
 *
 * Source-language control constructs are transport syntax only. Semantic
 * authority is expressed as relations over candidates, guards, transitions,
 * joins, recurrences, backedges and dependencies.
 */
import { relationAll, relationEqual, relationGate } from './semanticRelations';
import { relationFirstOption, relationLatticeFixedPoint, relationOptionFold, relationProject, relationSelect, type RelationLattice } from './relationalSequence';

export type ControlRelationKind =
  | 'candidate'
  | 'guard'
  | 'transition'
  | 'join'
  | 'recurrence'
  | 'backedge'
  | 'dependence';

export type ControlRelation = Readonly<{
  readonly kind: ControlRelationKind;
  readonly source: string;
  readonly target: string;
  readonly witness: string;
}>;

export type ControlTopology = Readonly<{
  readonly relations: readonly ControlRelation[];
}>;

export type ControlCandidate<T> = Readonly<{
  readonly id: string;
  readonly value: T;
  readonly guards: readonly string[];
  readonly dependencies: readonly string[];
}>;

export const controlRelation = (
  kind: ControlRelationKind,
  source: string,
  target: string,
  witness: string,
): ControlRelation => Object.freeze({ kind, source, target, witness });

export const candidateRelation = (source: string, target: string, witness: string): ControlRelation =>
  controlRelation('candidate', source, target, witness);

export const guardRelation = (source: string, target: string, witness: string): ControlRelation =>
  controlRelation('guard', source, target, witness);

export const transitionRelation = (source: string, target: string, witness: string): ControlRelation =>
  controlRelation('transition', source, target, witness);

export const joinRelation = (source: string, target: string, witness: string): ControlRelation =>
  controlRelation('join', source, target, witness);

export const recurrenceRelation = (source: string, target: string, witness: string): ControlRelation =>
  controlRelation('recurrence', source, target, witness);

export const backedgeRelation = (source: string, target: string, witness: string): ControlRelation =>
  controlRelation('backedge', source, target, witness);

export const dependenceRelation = (source: string, target: string, witness: string): ControlRelation =>
  controlRelation('dependence', source, target, witness);

export const topology = (relations: readonly ControlRelation[]): ControlTopology =>
  Object.freeze({ relations: Object.freeze([...relations]) });

export const candidate = <T>(
  id: string,
  value: T,
  guards: readonly string[],
  dependencies: readonly string[],
): ControlCandidate<T> => Object.freeze({
  id,
  value,
  guards: Object.freeze([...guards]),
  dependencies: Object.freeze([...dependencies]),
});

export const candidateGuardSatisfied = <T>(
  entry: ControlCandidate<T>,
  satisfied: (guard: string) => boolean,
): boolean => {
  const unresolved = relationFirstOption(entry.guards, guard => !satisfied(guard));
  return relationOptionFold(unresolved, () => true, () => false);
};

export const candidateDependenciesSatisfied = <T>(
  entry: ControlCandidate<T>,
  satisfied: (dependency: string) => boolean,
): boolean => {
  const unresolved = relationFirstOption(entry.dependencies, dependency => !satisfied(dependency));
  return relationOptionFold(unresolved, () => true, () => false);
};

export const candidateAdmissible = <T>(
  entry: ControlCandidate<T>,
  guard: (value: T) => boolean,
  satisfiedGuard: (value: string) => boolean,
  satisfiedDependency: (value: string) => boolean,
): boolean => relationGate(
  guard(entry.value),
  () => relationAll([candidateGuardSatisfied(entry, satisfiedGuard), candidateDependenciesSatisfied(entry, satisfiedDependency)]),
  () => false,
);

export type ControlClosure<T> = Readonly<{
  readonly value: T;
  readonly rounds: number;
  readonly converged: boolean;
}>;

export const controlClosure = <T>(
  lattice: RelationLattice<T>,
  seed: T,
  derive: (value: T) => T,
  maxRounds = 128,
): ControlClosure<T> => relationLatticeFixedPoint(lattice, seed, derive, maxRounds);

export const relationKind = (
  topologyValue: ControlTopology,
  kind: ControlRelationKind,
): readonly ControlRelation[] => relationProject(
  relationSelect(topologyValue.relations, relation => relationEqual(relation.kind, kind)),
  relation => relation,
);
