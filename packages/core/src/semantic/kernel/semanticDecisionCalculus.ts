/**
 * Semantic Decision Calculus.
 *
 * Source-language control constructs are evidence at the syntax boundary only.
 * Semantic authority is expressed through typed relations, guarded candidates,
 * dependencies, transitions, rewrites, and monotone closure.
 *
 * The calculus intentionally exposes no source-control vocabulary and no
 * host-language absence sentinel.
 */
import {
  relationFirst,
  relationOptionFold,
  relationOptionMap,
  relationLatticeFixedPoint,
  type RelationOption,
  type RelationLattice,
} from './relationalSequence';
import { relationAll, relationAny, relationEqual, relationGate } from './semanticRelations';

export type DecisionId = string;
export type PredicateId = string;
export type SemanticValue = string | number | boolean;

export type PredicateWitness = Readonly<{
  readonly predicate: PredicateId;
  readonly value: boolean;
}>;

export type CandidateWitness<T = SemanticValue> = Readonly<{
  readonly candidate: DecisionId;
  readonly value: T;
  readonly requires: readonly PredicateId[];
  readonly excludes: readonly PredicateId[];
  readonly dependsOn: readonly DecisionId[];
}>;

export type DecisionRelation<T = SemanticValue> = Readonly<{
  readonly candidates: readonly CandidateWitness<T>[];
  readonly predicates: readonly PredicateWitness[];
}>;

export type DerivedDecision<T = SemanticValue> = Readonly<{
  readonly candidate: DecisionId;
  readonly value: T;
}>;

export type Transition = Readonly<{
  readonly from: DecisionId;
  readonly to: DecisionId;
  readonly requires: readonly PredicateId[];
}>;

export type DecisionRewrite<T = SemanticValue> = Readonly<{
  readonly id: string;
  readonly source: DecisionId;
  readonly target: DecisionId;
  readonly requires: readonly PredicateId[];
  readonly produces: readonly DerivedDecision<T>[];
}>;

const contains = <T>(values: readonly T[], target: T, index = 0): boolean =>
  relationGate(
    index >= values.length,
    () => false,
    () => relationGate(relationEqual(values[index], target), () => true, () => contains(values, target, index + 1)),
  );

const predicatesSatisfied = (
  required: readonly PredicateId[],
  predicates: readonly PredicateWitness[],
  index = 0,
): boolean =>
  relationGate(
    index >= required.length,
    () => true,
    () => {
      const witness = relationFirst(predicates, item => relationEqual(item.predicate, required[index]));
      return relationOptionFold(witness, () => false, item =>
        relationGate(item.value, () => predicatesSatisfied(required, predicates, index + 1), () => false),
      );
    },
  );

const candidateNames = <T>(candidates: readonly CandidateWitness<T>[], index = 0, output: readonly DecisionId[] = []): readonly DecisionId[] =>
  relationGate(
    index >= candidates.length,
    () => output,
    () => candidateNames(candidates, index + 1, output.concat([candidates[index].candidate])),
  );

const candidateDependenciesSatisfied = <T>(
  dependencies: readonly DecisionId[],
  candidates: readonly CandidateWitness<T>[],
  index = 0,
): boolean =>
  relationGate(
    index >= dependencies.length,
    () => true,
    () => relationGate(
      contains(candidateNames(candidates), dependencies[index]),
      () => candidateDependenciesSatisfied(dependencies, candidates, index + 1),
      () => false,
    ),
  );

const candidatePermitted = <T>(
  candidate: CandidateWitness<T>,
  relation: DecisionRelation<T>,
): boolean =>
  relationGate(
    predicatesSatisfied(candidate.requires, relation.predicates),
    () => relationGate(
      relationAny([relationEqual(candidate.excludes.length, 0), !predicatesSatisfied(candidate.excludes, relation.predicates)]),
      () => candidateDependenciesSatisfied(candidate.dependsOn, relation.candidates),
      () => false,
    ),
    () => false,
  );

export const deriveDecision = <T>(
  relation: DecisionRelation<T>,
): RelationOption<DerivedDecision<T>> =>
  relationOptionMap(
    relationFirst(relation.candidates, candidate => candidatePermitted(candidate, relation)),
    candidate => Object.freeze({ candidate: candidate.candidate, value: candidate.value }),
  );

const selectTransitions = (
  transitions: readonly Transition[],
  predicates: readonly PredicateWitness[],
  index = 0,
  output: readonly Transition[] = [],
): readonly Transition[] =>
  relationGate(
    index >= transitions.length,
    () => output,
    () => relationGate(
      predicatesSatisfied(transitions[index].requires, predicates),
      () => selectTransitions(transitions, predicates, index + 1, output.concat([transitions[index]])),
      () => selectTransitions(transitions, predicates, index + 1, output),
    ),
  );

export const deriveTransitions = <T>(
  relation: DecisionRelation<T>,
  transitions: readonly Transition[],
): readonly Transition[] => selectTransitions(transitions, relation.predicates);

const rewriteProductions = <T>(
  rules: readonly DecisionRewrite<T>[],
  source: DecisionId,
  predicates: readonly PredicateWitness[],
  index = 0,
  output: readonly DerivedDecision<T>[] = [],
): readonly DerivedDecision<T>[] =>
  relationGate(
    index >= rules.length,
    () => output,
    () => {
      const rule = rules[index];
      const matches = relationAll([relationEqual(rule.source, source), predicatesSatisfied(rule.requires, predicates)]);
      return relationGate(matches, () => rewriteProductions(rules, source, predicates, index + 1, output.concat(rule.produces)), () =>
        rewriteProductions(rules, source, predicates, index + 1, output));
    },
  );

export const applyDecisionRewrites = <T>(
  rewrites: readonly DecisionRewrite<T>[],
  source: DecisionId,
  predicates: readonly PredicateWitness[],
): readonly DerivedDecision<T>[] => rewriteProductions(rewrites, source, predicates);

const decisionNames = <T>(decisions: readonly DerivedDecision<T>[], index = 0, output: readonly DecisionId[] = []): readonly DecisionId[] =>
  relationGate(
    index >= decisions.length,
    () => output,
    () => decisionNames(decisions, index + 1, output.concat([decisions[index].candidate])),
  );

const joinDecisions = <T>(
  left: readonly DerivedDecision<T>[],
  right: readonly DerivedDecision<T>[],
  index = 0,
  output: readonly DerivedDecision<T>[] = left,
): readonly DerivedDecision<T>[] =>
  relationGate(
    index >= right.length,
    () => output,
    () => relationGate(
      contains(decisionNames(output), right[index].candidate),
      () => joinDecisions(left, right, index + 1, output),
      () => joinDecisions(left, right, index + 1, output.concat([right[index]])),
    ),
  );

const decisionsEqual = <T>(
  left: readonly DerivedDecision<T>[],
  right: readonly DerivedDecision<T>[],
  index = 0,
): boolean =>
  relationGate(
    !relationEqual(left.length, right.length),
    () => false,
    () => relationGate(
      index >= left.length,
      () => true,
      () => relationGate(
        relationAll([relationEqual(left[index].candidate, right[index].candidate), relationEqual(left[index].value, right[index].value)]),
        () => decisionsEqual(left, right, index + 1),
        () => false,
      ),
    ),
  );

export const decisionClosure = <T>(
  seed: readonly DerivedDecision<T>[],
  derive: (facts: readonly DerivedDecision<T>[]) => readonly DerivedDecision<T>[],
  maxRounds = 128,
): { readonly value: readonly DerivedDecision<T>[]; readonly rounds: number; readonly converged: boolean } => {
  const lattice: RelationLattice<readonly DerivedDecision<T>[]> = Object.freeze({
    bottom: Object.freeze([]),
    join: joinDecisions,
    equal: decisionsEqual,
  });
  return relationLatticeFixedPoint(lattice, seed, derive, maxRounds);
};


/**
 * Declarative rewrite layer. A rewrite is a relation between a source witness
 * and a target witness guarded by semantic predicates. The solver computes
 * closure; callers do not dispatch on source-language control constructs.
 */
export type RewritePattern<T> = Readonly<{
  readonly id: string;
  readonly matches: (value: T) => boolean;
  readonly rewrite: (value: T) => T;
  readonly requires: readonly PredicateId[];
}>;

export type RewriteWitness<T> = Readonly<{
  readonly rule: string;
  readonly before: T;
  readonly after: T;
}>;

const rewriteStep = <T>(
  value: T,
  rules: readonly RewritePattern<T>[],
  predicates: readonly PredicateWitness[],
  index = 0,
): RelationOption<RewriteWitness<T>> => relationGate(
  index >= rules.length,
  () => ({ kind: 'none' }),
  () => {
    const rule = rules[index];
    const guard = rule.requires;
    const allowed = predicatesSatisfied(guard, predicates);
    const matched = relationAll([allowed, rule.matches(value)]);
    return relationGate(
      matched,
      () => ({ kind: 'some', value: Object.freeze({ rule: rule.id, before: value, after: rule.rewrite(value) }) }),
      () => rewriteStep(value, rules, predicates, index + 1),
    );
  },
);

export const rewriteOnce = <T>(
  value: T,
  rules: readonly RewritePattern<T>[],
  predicates: readonly PredicateWitness[] = Object.freeze([]),
): RelationOption<RewriteWitness<T>> => rewriteStep(value, rules, predicates);

export const rewriteFixedPoint = <T>(
  seed: T,
  rules: readonly RewritePattern<T>[],
  predicates: readonly PredicateWitness[] = Object.freeze([]),
  rounds = 128,
): Readonly<{ readonly value: T; readonly witnesses: readonly RewriteWitness<T>[]; readonly converged: boolean }> => {
  const visit = (value: T, remaining: number, witnesses: readonly RewriteWitness<T>[]): Readonly<{ readonly value: T; readonly witnesses: readonly RewriteWitness<T>[]; readonly converged: boolean }> => relationGate(
    remaining <= 0,
    () => Object.freeze({ value, witnesses, converged: false }),
    () => relationOptionFold(
      rewriteOnce(value, rules, predicates),
      () => Object.freeze({ value, witnesses, converged: true }),
      witness => visit(witness.after, remaining - 1, Object.freeze([...witnesses, witness])),
    ),
  );
  return visit(seed, rounds, Object.freeze([]));
};
