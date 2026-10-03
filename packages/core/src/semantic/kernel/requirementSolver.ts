/**
 * Compatibility facade over the canonical semantic decision engine.
 * Candidate selection is a relation/constraint problem, not a source-control
 * dispatch mechanism.
 */
import { relationFirstOption, relationOptionMap, relationOptionFold, relationProject, relationGate, type RelationOption } from './relationalSequence';
import { candidateAdmissible, dependency, exclusion, requirement, solveDecision, decisionCandidate, type DecisionCandidate } from './semanticDecisionEngine';

export type Requirement = Readonly<{ readonly id: string; readonly satisfied: boolean }>;
export type Exclusion = Readonly<{ readonly id: string; readonly active: boolean }>;
export type Dependency = Readonly<{ readonly id: string; readonly available: boolean }>;

export type SemanticCandidate<T> = Readonly<{
  readonly id: string;
  readonly value: T;
  readonly requirements?: readonly Requirement[];
  readonly exclusions?: readonly Exclusion[];
  readonly dependencies?: readonly Dependency[];
}>;

const requirementsOf = <T>(candidate: SemanticCandidate<T>): readonly Requirement[] => relationGate('requirements' in candidate, () => candidate.requirements as readonly Requirement[], () => Object.freeze([]));
const exclusionsOf = <T>(candidate: SemanticCandidate<T>): readonly Exclusion[] => relationGate('exclusions' in candidate, () => candidate.exclusions as readonly Exclusion[], () => Object.freeze([]));
const dependenciesOf = <T>(candidate: SemanticCandidate<T>): readonly Dependency[] => relationGate('dependencies' in candidate, () => candidate.dependencies as readonly Dependency[], () => Object.freeze([]));

const canonical = <T>(candidate: SemanticCandidate<T>): DecisionCandidate<T> => decisionCandidate(
  candidate.id,
  candidate.value,
  relationProject(requirementsOf(candidate), item => requirement(item.id, item.satisfied)),
  relationProject(exclusionsOf(candidate), item => exclusion(item.id, item.active)),
  relationProject(dependenciesOf(candidate), item => dependency(item.id, item.available)),
);

export const candidateSatisfies = <T>(candidate: SemanticCandidate<T>): boolean => candidateAdmissible(canonical(candidate));

export const solveCandidate = <T>(candidates: readonly SemanticCandidate<T>[]): RelationOption<T> =>
  relationOptionMap(
    solveDecision(relationProject(candidates, canonical)),
    witness => witness.value,
  );

export const solveCandidateOption = solveCandidate;
export type SemanticRewriteCandidate<T> = Readonly<{
  readonly id: string;
  readonly rewrite: () => T;
  readonly requirements?: readonly Requirement[];
  readonly exclusions?: readonly Exclusion[];
  readonly dependencies?: readonly Dependency[];
}>;

export const solveRewriteCandidate = <T>(candidates: readonly SemanticRewriteCandidate<T>[]): RelationOption<T> =>
  relationOptionMap(
    solveDecision(relationProject(candidates, candidate => decisionCandidate(
      candidate.id,
      candidate,
      relationProject(relationGate('requirements' in candidate, () => candidate.requirements as readonly Requirement[], () => Object.freeze([])), item => requirement(item.id, item.satisfied)),
      relationProject(relationGate('exclusions' in candidate, () => candidate.exclusions as readonly Exclusion[], () => Object.freeze([])), item => exclusion(item.id, item.active)),
      relationProject(relationGate('dependencies' in candidate, () => candidate.dependencies as readonly Dependency[], () => Object.freeze([])), item => dependency(item.id, item.available)),
    ))),
    witness => witness.rewrite(),
  );


export const solveCandidateId = <T>(candidates: readonly SemanticCandidate<T>[]): RelationOption<string> =>
  relationOptionMap(
    relationFirstOption(candidates, candidateSatisfies),
    candidate => candidate.id,
  );

export { requirement, exclusion, dependency };

export type OptionalSemanticCandidate<T> = Readonly<{
  readonly id: string;
  readonly value: RelationOption<T>;
  readonly requirements?: readonly Requirement[];
  readonly exclusions?: readonly Exclusion[];
  readonly dependencies?: readonly Dependency[];
}>;

export const solveOptionalCandidate = <T>(candidates: readonly OptionalSemanticCandidate<T>[]): RelationOption<T> => {
  const selected = solveDecision(relationProject(candidates, candidate => decisionCandidate<RelationOption<T>>(
    candidate.id,
    candidate.value,
    relationProject(requirementsOf(candidate), item => requirement(item.id, item.satisfied)),
    relationProject(exclusionsOf(candidate), item => exclusion(item.id, item.active)),
    relationProject(dependenciesOf(candidate), item => dependency(item.id, item.available)),
  )));
  return relationOptionFold(selected, () => ({ kind: 'none' }), witness => witness.value);
};
