/**
 * Compatibility facade over the canonical semantic decision engine.
 * Candidate selection is a relation/constraint problem, not a source-control
 * dispatch mechanism.
 */
import { relationFirstOption, relationOptionMap, relationOptionFold, relationOptionalFold, relationProject, relationVariant, type RelationOption, type RelationVariant } from './relationalSequence';
import { candidateAdmissible, dependency, exclusion, requirement, solveDecision, decisionCandidate, type DecisionCandidate } from './semanticDecisionEngine';

export type Requirement = Readonly<{ readonly id: string; readonly satisfied: boolean }>;
export type Exclusion = Readonly<{ readonly id: string; readonly active: boolean }>;
export type Dependency = Readonly<{ readonly id: string; readonly available: boolean }>;

export type SemanticCandidate<T> = Readonly<{
  readonly id: string;
  readonly value: T;
  readonly requirements: readonly Requirement[];
  readonly exclusions: readonly Exclusion[];
  readonly dependencies: readonly Dependency[];
}>;

/**
 * Input form for declarative candidates. Missing exclusion/dependency
 * relations are normalized to empty relations through the optional-value
 * algebra before entering the closed semantic decision model.
 */
export type SemanticCandidateInput<T> = Readonly<{
  readonly id: string;
  readonly value: T;
  readonly requirements: readonly Requirement[];
  readonly exclusions?: readonly Exclusion[];
  readonly dependencies?: readonly Dependency[];
}>;

const optionalRelations = <T>(value: readonly T[] | void): readonly T[] => relationOptionalFold(
  value,
  () => [],
  relations => relations,
);

const canonical = <T>(candidate: SemanticCandidateInput<T>): DecisionCandidate<T> => decisionCandidate(
  candidate.id,
  candidate.value,
  relationProject(candidate.requirements, item => requirement(item.id, item.satisfied)),
  relationProject(optionalRelations(candidate.exclusions), item => exclusion(item.id, item.active)),
  relationProject(optionalRelations(candidate.dependencies), item => dependency(item.id, item.available)),
);

export const candidateSatisfies = <T>(candidate: SemanticCandidateInput<T>): boolean => candidateAdmissible(canonical(candidate));

export const solveCandidate = <T>(candidates: readonly SemanticCandidateInput<T>[]): RelationOption<T> =>
  relationOptionMap(
    solveDecision(relationProject(candidates, canonical)),
    witness => witness.value,
  );

export const solveCandidateOption = solveCandidate;
export type SemanticRewriteCandidate<T> = Readonly<{
  readonly id: string;
  readonly rewrite: () => T;
  readonly requirements: readonly Requirement[];
  readonly exclusions: readonly Exclusion[];
  readonly dependencies: readonly Dependency[];
}>;

export const solveRewriteCandidate = <T>(candidates: readonly SemanticRewriteCandidate<T>[]): RelationOption<T> =>
  relationOptionMap(
    solveDecision(relationProject(candidates, candidate => decisionCandidate(
      candidate.id,
      candidate,
      relationProject(candidate.requirements, item => requirement(item.id, item.satisfied)),
      relationProject(candidate.exclusions, item => exclusion(item.id, item.active)),
      relationProject(candidate.dependencies, item => dependency(item.id, item.available)),
    ))),
    witness => witness.value.rewrite(),
  );

export type SemanticVariantRewriteCandidate<T extends { readonly kind: string }, K extends T['kind'], R> = Readonly<{
  readonly id: string;
  readonly subject: T;
  readonly variant: K;
  readonly rewrite: (value: RelationVariant<T, K>) => R;
  readonly requirements: readonly Requirement[];
  readonly exclusions: readonly Exclusion[];
  readonly dependencies: readonly Dependency[];
}>;

export const variantRewriteCandidate = <T extends { readonly kind: string }, K extends T['kind'], R>(
  candidate: SemanticVariantRewriteCandidate<T, K, R>,
): SemanticRewriteCandidate<R> => ({
  id: candidate.id,
  requirements: candidate.requirements,
  exclusions: candidate.exclusions,
  dependencies: candidate.dependencies,
  rewrite: () => relationOptionFold(
    relationVariant(candidate.subject, candidate.variant),
    () => { throw Error(`No refinement witness: ${candidate.id}`); },
    candidate.rewrite,
  ),
});

export const solveVariantRewriteCandidate = <T extends { readonly kind: string }, R>(
  candidates: readonly SemanticRewriteCandidate<R>[],
): RelationOption<R> => solveRewriteCandidate(candidates);


export const solveCandidateId = <T>(candidates: readonly SemanticCandidateInput<T>[]): RelationOption<string> =>
  relationOptionMap(
    relationFirstOption(candidates, candidateSatisfies),
    candidate => candidate.id,
  );

export { requirement, exclusion, dependency };

export type OptionalSemanticCandidate<T> = Readonly<{
  readonly id: string;
  readonly value: RelationOption<T>;
  readonly requirements: readonly Requirement[];
  readonly exclusions?: readonly Exclusion[];
  readonly dependencies?: readonly Dependency[];
}>;

export const solveOptionalCandidate = <T>(candidates: readonly OptionalSemanticCandidate<T>[]): RelationOption<T> => {
  const selected = solveDecision(relationProject(candidates, candidate => decisionCandidate<RelationOption<T>>(
    candidate.id,
    candidate.value,
    relationProject(candidate.requirements, item => requirement(item.id, item.satisfied)),
    relationProject(optionalRelations(candidate.exclusions), item => exclusion(item.id, item.active)),
    relationProject(optionalRelations(candidate.dependencies), item => dependency(item.id, item.available)),
  )));
  return relationOptionFold(selected, () => ({ kind: 'none' }), witness => witness.value);
};
