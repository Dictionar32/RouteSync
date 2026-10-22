/**
 * Canonical upstream contract for declarative semantic-relation rewriting.
 *
 * This module contains the closed protocol and capability interfaces only.
 * It deliberately does not import the solver or implement reasoning.
 */
import type { SemanticConstraintAuthorityCapability } from './semanticConstraintInterface';
import type { SemanticRelation, SemanticRelationDerivation, SemanticRelationRewrite } from '../../semantic/relations/semanticRewriteEngine';

export type SemanticRewriteTerm =
  | Readonly<{ readonly kind: 'text_term'; readonly value: string }>
  | Readonly<{ readonly kind: 'ordinal_term'; readonly value: number }>
  | Readonly<{ readonly kind: 'truth_term'; readonly value: 'true' | 'false' }>
  | Readonly<{ readonly kind: 'absence_term' }>;

export type SemanticRewritePatternTerm = SemanticRewriteTerm | Readonly<{ readonly kind: 'variable_term'; readonly name: string }>;

export type SemanticRewritePattern<R extends string = string> = Readonly<{
  readonly relation: R;
  readonly arguments: readonly SemanticRewritePatternTerm[];
  readonly polarity: 'positive' | 'negative';
}>;

export type SemanticRewriteFact<R extends string = string> = Readonly<{
  readonly relation: R;
  readonly arguments: readonly SemanticRewriteTerm[];
}>;

export type SemanticRewriteRule<R extends string = string> = Readonly<{
  readonly id: string;
  readonly priority: number;
  readonly when: readonly SemanticRewritePattern<R>[];
  readonly then: readonly SemanticRewritePattern<R>[];
}>;

export type SemanticRewriteExecutionRequest<R extends string = string> = Readonly<{
  readonly kind: 'semantic_rewrite_execution_request';
  readonly seeds: readonly SemanticRewriteFact<R>[];
  readonly rules: readonly SemanticRewriteRule<R>[];
  /** Upper bound for fixed-point rounds; omitted means the authority default. */
  readonly maxRounds?: number;
}>;

export type SemanticRewriteDerivation<R extends string = string> = Readonly<{
  readonly kind: 'semantic_rewrite_derivation';
  readonly ruleId: string;
  readonly fact: SemanticRewriteFact<R>;
}>;

type SemanticRewriteJudgmentBase<R extends string> = Readonly<{
  readonly kind: 'semantic_rewrite_judgment';
  readonly facts: readonly SemanticRewriteFact<R>[];
  readonly derivations: readonly SemanticRewriteDerivation<R>[];
  readonly rounds: number;
  readonly authority: 'upstream_semantic_rewrite_authority';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
}>;

/** A judgment is closed only when the solver actually reaches saturation. */
export type SemanticRewriteClosedJudgment<R extends string = string> = SemanticRewriteJudgmentBase<R> & Readonly<{
  readonly status: 'closed';
  readonly saturated: true;
  readonly closure: 'least_fixed_point';
  readonly closed: true;
}>;

/** Round-limit exhaustion is explicitly incomplete and must not masquerade as closure. */
export type SemanticRewriteIncompleteJudgment<R extends string = string> = SemanticRewriteJudgmentBase<R> & Readonly<{
  readonly status: 'incomplete';
  readonly saturated: false;
  readonly closure: 'round_limit_reached';
  readonly closed: false;
  readonly reason: 'max_rounds_exceeded';
}>;

export type SemanticRewriteJudgment<R extends string = string> =
  | SemanticRewriteClosedJudgment<R>
  | SemanticRewriteIncompleteJudgment<R>;


export type SemanticRelationExecutionRequest<R extends string = string> = Readonly<{
  readonly kind: 'semantic_relation_execution_request';
  readonly seeds: readonly SemanticRelation<R>[];
  readonly rules: readonly SemanticRelationRewrite<R>[];
  readonly maxRounds?: number;
}>;

type SemanticRelationExecutionJudgmentBase<R extends string> = Readonly<{
  readonly kind: 'semantic_relation_execution_judgment';
  readonly facts: readonly SemanticRelation<R>[];
  readonly derivations: readonly SemanticRelationDerivation<R>[];
  readonly rounds: number;
  readonly authority: 'upstream_semantic_rewrite_authority';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
}>;

export type SemanticRelationExecutionClosedJudgment<R extends string = string> = SemanticRelationExecutionJudgmentBase<R> & Readonly<{
  readonly status: 'closed';
  readonly saturated: true;
  readonly closure: 'least_fixed_point';
  readonly closed: true;
}>;

export type SemanticRelationExecutionIncompleteJudgment<R extends string = string> = SemanticRelationExecutionJudgmentBase<R> & Readonly<{
  readonly status: 'incomplete';
  readonly saturated: false;
  readonly closure: 'round_limit_reached';
  readonly closed: false;
  readonly reason: 'max_rounds_exceeded';
}>;

export type SemanticRelationExecutionJudgment<R extends string = string> = SemanticRelationExecutionClosedJudgment<R> | SemanticRelationExecutionIncompleteJudgment<R>;

export interface SemanticRelationExecutionAuthorityCapability {
  readonly resolveRelations: <R extends string>(request: SemanticRelationExecutionRequest<R>) => SemanticRelationExecutionJudgment<R>;
}


/** Semantic authority owns derivation and is the only component allowed to decide closure. */
export interface SemanticRewriteAuthorityInterface extends SemanticConstraintAuthorityCapability, SemanticRelationExecutionAuthorityCapability {
  readonly kind: 'semantic_rewrite_authority';
  readonly authority: 'upstream';
  readonly resolve: <R extends string>(request: SemanticRewriteExecutionRequest<R>) => SemanticRewriteJudgment<R>;
}


export const semanticTextTerm = (value: string): SemanticRewriteTerm => Object.freeze({ kind: 'text_term', value });
export const semanticOrdinalTerm = (value: number): SemanticRewriteTerm => Object.freeze({ kind: 'ordinal_term', value });
export const semanticTruthTerm = (value: 'true' | 'false'): SemanticRewriteTerm => Object.freeze({ kind: 'truth_term', value });
export const semanticAbsenceTerm = (): SemanticRewriteTerm => Object.freeze({ kind: 'absence_term' });
export const semanticVariableTerm = (name: string): SemanticRewritePatternTerm => Object.freeze({ kind: 'variable_term', name });
