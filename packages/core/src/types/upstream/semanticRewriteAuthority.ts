/** Concrete upstream semantic rewrite authority; delegates to the canonical foundation solver. */
import {
  solveSemanticRelationsDetailed,
  type SemanticRelation,
  type SemanticRelationRewrite,
} from '../../semantic/relations/semanticRewriteEngine';
import { relationEqual, relationOptionFold, relationGate } from '../../semantic/relations/semanticRelations';
import { relationProject, relationVariant } from '../../semantic/relations/relationalSequence';
import { relationContains, relationInsert } from '../../semantic/relations/relationMembership';
import { resolveSemanticConstraints } from './semanticConstraintAuthority';
import type {
  SemanticRewriteAuthorityInterface,
  SemanticRewriteDerivation,
  SemanticRewriteExecutionRequest,
  SemanticRewriteFact,
  SemanticRewriteRule,
  SemanticRewriteJudgment,
  SemanticRewritePatternTerm,
  SemanticRewriteTerm,
  SemanticRelationExecutionRequest,
  SemanticRelationExecutionJudgment,
} from './semanticRewriteInterface';

const toAtom = (term: SemanticRewriteTerm) => relationOptionFold(
  relationVariant(term, 'text_term'),
  () => relationOptionFold(
    relationVariant(term, 'ordinal_term'),
    () => relationOptionFold(
      relationVariant(term, 'truth_term'),
      () => ({ kind: 'semantic_null' as const }),
      value => relationEqual(value.value, 'true'),
    ),
    value => value.value,
  ),
  value => value.value,
);

const toPatternAtom = (term: SemanticRewritePatternTerm) => relationOptionFold(
  relationVariant(term, 'variable_term'),
  () => relationOptionFold(
    relationVariant(term, 'text_term'),
    () => relationOptionFold(
      relationVariant(term, 'ordinal_term'),
      () => relationOptionFold(
        relationVariant(term, 'truth_term'),
        () => ({ kind: 'semantic_null' as const }),
        value => relationEqual(value.value, 'true'),
      ),
      value => value.value,
    ),
    value => value.value,
  ),
  value => ({ variable: value.name }),
);

const fromAtom = <R extends string>(fact: SemanticRelation<R>): SemanticRewriteFact<R> => Object.freeze({
  relation: fact.relation,
  arguments: Object.freeze(relationProject(fact.arguments, value => relationGate(
    Object.is(typeof value, 'string'),
    () => Object.freeze({ kind: 'text_term' as const, value: String(value) }),
    () => relationGate(
      Object.is(typeof value, 'number'),
      () => Object.freeze({ kind: 'ordinal_term' as const, value: Number(value) }),
      () => relationGate(
        Object.is(typeof value, 'boolean'),
        () => Object.freeze({ kind: 'truth_term' as const, value: relationGate(relationEqual(value, true), () => 'true' as const, () => 'false' as const) }),
        () => Object.freeze({ kind: 'absence_term' as const }),
      ),
    ),
  ))),
});

const derive = <R extends string>(request: SemanticRewriteExecutionRequest<R>): SemanticRewriteJudgment<R> => {
  const seedAtoms = relationProject(request.seeds, fact => ({ relation: fact.relation, arguments: relationProject(fact.arguments, toAtom) }));
  const rewriteRules: readonly SemanticRelationRewrite<R>[] = relationProject(request.rules, rule => Object.freeze({
    id: rule.id,
    priority: rule.priority,
    when: relationProject(rule.when, pattern => ({ relation: pattern.relation, polarity: pattern.polarity, arguments: relationProject(pattern.arguments, toPatternAtom) })),
    then: relationProject(rule.then, pattern => ({ relation: pattern.relation, polarity: pattern.polarity, arguments: relationProject(pattern.arguments, toPatternAtom) })),
  }));
  const solved = solveSemanticRelationsDetailed(seedAtoms, rewriteRules, request.maxRounds ?? 1024);
  const facts = Object.freeze(relationProject(solved.facts, fromAtom));
  const derivations: readonly SemanticRewriteDerivation<R>[] = Object.freeze(relationProject(solved.derivations, derivation => Object.freeze({
    kind: 'semantic_rewrite_derivation',
    ruleId: derivation.ruleId,
    fact: fromAtom({ relation: derivation.fact.relation, arguments: derivation.fact.arguments }),
  })));
  const base = {
    kind: 'semantic_rewrite_judgment' as const,
    facts,
    derivations,
    rounds: solved.rounds,
    saturated: solved.saturated,
    authority: 'upstream_semantic_rewrite_authority' as const,
    reasoning: 'declarative_relation_rewrite_fixed_point' as const,
  };
  return solved.saturated
    ? Object.freeze({ ...base, status: 'closed', saturated: true, closure: 'least_fixed_point', closed: true })
    : Object.freeze({ ...base, status: 'incomplete', saturated: false, closure: 'round_limit_reached', closed: false, reason: 'max_rounds_exceeded' });
};

const semanticRelationKey = <R extends string>(fact: SemanticRelation<R>): string => `${fact.relation}(${relationProject(fact.arguments, value => JSON.stringify(value)).join(',')})`;
const uniqueSemanticRelations = <R extends string>(facts: readonly SemanticRelation<R>[], index = 0, keys: readonly string[] = [], output: readonly SemanticRelation<R>[] = []): readonly SemanticRelation<R>[] =>
  relationGate(index >= facts.length, () => Object.freeze([...output]), () => {
    const fact = facts[index];
    const key = semanticRelationKey(fact);
    return relationGate(relationContains(keys, key), () => uniqueSemanticRelations(facts, index + 1, keys, output), () => uniqueSemanticRelations(facts, index + 1, relationInsert(keys, key), Object.freeze([...output, fact])));
  });

const resolveRelations = <R extends string>(request: SemanticRelationExecutionRequest<R>): SemanticRelationExecutionJudgment<R> => {
  const solved = solveSemanticRelationsDetailed(request.seeds, request.rules, request.maxRounds ?? 1024);
  const base = {
    kind: 'semantic_relation_execution_judgment' as const,
    facts: uniqueSemanticRelations(solved.facts),
    derivations: solved.derivations,
    rounds: solved.rounds,
    authority: 'upstream_semantic_rewrite_authority' as const,
    reasoning: 'declarative_relation_rewrite_fixed_point' as const,
  };
  return solved.saturated
    ? Object.freeze({ ...base, status: 'closed' as const, saturated: true as const, closure: 'least_fixed_point' as const, closed: true as const })
    : Object.freeze({ ...base, status: 'incomplete' as const, saturated: false as const, closure: 'round_limit_reached' as const, closed: false as const, reason: 'max_rounds_exceeded' as const });
};

export const semanticRewriteAuthority: SemanticRewriteAuthorityInterface = Object.freeze({
  kind: 'semantic_rewrite_authority',
  authority: 'upstream',
  resolve: derive,
  resolveConstraints: resolveSemanticConstraints,
  resolveRelations,
});


/** Upstream operation for declarative facts and rules; no runtime wrapper is involved. */
export const solveClosedSemanticRelations = <R extends string>(
  seeds: readonly SemanticRewriteFact<R>[],
  rules: readonly SemanticRewriteRule<R>[],
  maxRounds = 1024,
): SemanticRewriteJudgment<R> => semanticRewriteAuthority.resolve({
  kind: 'semantic_rewrite_execution_request',
  seeds,
  rules,
  maxRounds,
} satisfies SemanticRewriteExecutionRequest<R>);
