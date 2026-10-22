import { visit } from '../../semantic/relations/semanticRelationalCollections';
/**
 * Phase 267 — construct-free semantic behavior kernel.
 *
 * Source constructs are evidence only. A behavior is described by relations
 * and constraints, then closed by the canonical upstream authority. Closure is
 * a staged judgment: an incomplete constraint stage must never be presented as
 * a closed rewrite result. `maxRounds` is a per-stage budget; the reported
 * `rounds` value is the sum of completed work across the stages reached.
 */
import type { SemanticRelation, SemanticRelationAtom, SemanticRelationDerivation } from '../../semantic/relations/semanticRewriteEngine';
import { semanticRewriteAuthority } from './semanticRewriteAuthority';
import type { SemanticConstraintDerivation, SemanticConstraintSolveResult } from './semanticConstraintInterface';
import { semanticTheoryFact, validateSemanticTheoryFact } from './semanticRelationTheory';
import { SEMANTIC_BEHAVIOR_PROGRAM, SEMANTIC_BEHAVIOR_CONSTRAINT_RULES } from './semanticRelationalBehaviorCatalog';
import type { SemanticBehaviorRelation } from './semanticRelationalBehaviorCatalog';
export { SEMANTIC_BEHAVIOR_SCHEMAS, SEMANTIC_BEHAVIOR_RULES, SEMANTIC_BEHAVIOR_PROGRAM, SEMANTIC_BEHAVIOR_CONSTRAINT_RULES, type SemanticBehaviorSchema, type SemanticBehaviorRelation, type SemanticBehaviorFact, } from './semanticRelationalBehaviorCatalog';

type SemanticBehaviorDerivationBase<R extends string> = Readonly<{
  readonly fact: SemanticRelation<R>;
  readonly ruleId: string;
  readonly premises: readonly SemanticRelation<R>[];
  readonly bindings: Readonly<Record<string, SemanticRelationAtom>>;
}>;

export type SemanticBehaviorDerivation<R extends string = SemanticBehaviorRelation> = SemanticBehaviorDerivationBase<R> & Readonly<{
  readonly stage: 'constraint' | 'rewrite';
}>;

type SemanticBehaviorClosureBase<R extends string> = Readonly<{
  readonly facts: readonly SemanticRelation<R>[];
  readonly derivations: readonly SemanticBehaviorDerivation<R>[];
  readonly rounds: number;
  readonly saturated: boolean;
}>;

export type SemanticBehaviorClosedClosure<R extends string = SemanticBehaviorRelation> = SemanticBehaviorClosureBase<R> & Readonly<{
  readonly status: 'closed';
  readonly saturated: true;
  readonly closure: 'least_fixed_point';
}>;

export type SemanticBehaviorIncompleteClosure<R extends string = SemanticBehaviorRelation> = SemanticBehaviorClosureBase<R> & Readonly<{
  readonly status: 'incomplete';
  readonly saturated: false;
  readonly closure: 'round_limit_reached';
  readonly phase: 'constraints' | 'rewrite';
  readonly reason: 'max_rounds_exceeded';
}>;

export type SemanticBehaviorClosure<R extends string = SemanticBehaviorRelation> =
  | SemanticBehaviorClosedClosure<R>
  | SemanticBehaviorIncompleteClosure<R>;

const constraintDerivations = <R extends string>(derivations: readonly SemanticConstraintDerivation<R>[]): readonly SemanticBehaviorDerivation<R>[] =>
  Object.freeze(derivations.map(derivation => Object.freeze({ ...derivation, stage: 'constraint' as const })));

const rewriteDerivations = <R extends string>(derivations: readonly SemanticRelationDerivation<R>[]): readonly SemanticBehaviorDerivation<R>[] =>
  Object.freeze(derivations.map(derivation => Object.freeze({ ...derivation, stage: 'rewrite' as const })));

const isIncompleteConstraintClosure = <R extends string>(closure: SemanticConstraintSolveResult<R>): closure is Extract<SemanticConstraintSolveResult<R>, { readonly status: 'incomplete' }> => closure.status === 'incomplete';

/**
 * The only semantic entry point used by behavior reasoning. It accepts facts,
 * not syntax nodes or control constructs. Every stage must close successfully
 * before the overall result can carry the `closed` judgment.
 */
export const solveSemanticBehavior = (seed: readonly SemanticRelation<SemanticBehaviorRelation>[], maxRounds = 64): SemanticBehaviorClosure => {
  visit(seed, fact => validateSemanticTheoryFact(semanticTheoryFact(fact.relation, fact.arguments)));
  const constraintClosure = semanticRewriteAuthority.resolveConstraints(seed, { rules: SEMANTIC_BEHAVIOR_CONSTRAINT_RULES }, maxRounds);
  const constraintProof = constraintDerivations(constraintClosure.derivations);

  if (isIncompleteConstraintClosure(constraintClosure)) {
    return Object.freeze({
      status: 'incomplete',
      closure: 'round_limit_reached',
      phase: 'constraints',
      reason: 'max_rounds_exceeded',
      facts: constraintClosure.facts,
      derivations: constraintProof,
      rounds: constraintClosure.rounds,
      saturated: false,
    });
  }

  const relationClosure = semanticRewriteAuthority.resolveRelations({
    kind: 'semantic_relation_execution_request',
    seeds: constraintClosure.facts,
    rules: SEMANTIC_BEHAVIOR_PROGRAM.rules,
    maxRounds,
  });
  const derivations = Object.freeze([...constraintProof, ...rewriteDerivations(relationClosure.derivations)]);
  const rounds = constraintClosure.rounds + relationClosure.rounds;

  if (relationClosure.status === 'incomplete') {
    return Object.freeze({
      status: 'incomplete',
      closure: 'round_limit_reached',
      phase: 'rewrite',
      reason: 'max_rounds_exceeded',
      facts: relationClosure.facts,
      derivations,
      rounds,
      saturated: false,
    });
  }

  return Object.freeze({
    status: 'closed',
    closure: 'least_fixed_point',
    facts: relationClosure.facts,
    derivations,
    rounds,
    saturated: true,
  });
};
