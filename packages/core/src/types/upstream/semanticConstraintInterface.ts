/** Typed constraint calculus contract shared by upstream authority and runtime executor. */

export type SemanticConstraintTerm = SemanticRelationAtom | Readonly<{ readonly variable: string }>;
export type SemanticConstraint =
  | Readonly<{ readonly kind: 'equals'; readonly left: SemanticConstraintTerm; readonly right: SemanticConstraintTerm }>
  | Readonly<{ readonly kind: 'not-equals'; readonly left: SemanticConstraintTerm; readonly right: SemanticConstraintTerm }>
  | Readonly<{ readonly kind: 'truth'; readonly value: SemanticConstraintTerm }>;

export interface SemanticConstraintRule<R extends string = string> {
  readonly id: string;
  readonly priority: number;
  readonly when: readonly SemanticRelationPattern<R>[];
  readonly constraints: readonly SemanticConstraint[];
  readonly then: readonly SemanticRelationPattern<R>[];
}

export interface SemanticConstraintProgram<R extends string = string> {
  readonly rules: readonly SemanticConstraintRule<R>[];
}

export interface SemanticConstraintDerivation<R extends string = string> {
  readonly fact: SemanticRelation<R>;
  readonly ruleId: string;
  readonly premises: readonly SemanticRelation<R>[];
  readonly bindings: Readonly<Record<string, SemanticRelationAtom>>;
  readonly constraintsSatisfied: true;
}

export type SemanticConstraintJudgmentBase<R extends string> = Readonly<{
  readonly kind: 'semantic_constraint_judgment';
  readonly facts: readonly SemanticRelation<R>[];
  readonly derivations: readonly SemanticConstraintDerivation<R>[];
  readonly rounds: number;
  readonly authority: 'upstream_semantic_rewrite_authority';
}>;

export type SemanticConstraintClosedJudgment<R extends string = string> = SemanticConstraintJudgmentBase<R> & Readonly<{
  readonly status: 'closed';
  readonly saturated: true;
  readonly closure: 'least_fixed_point';
  readonly closed: true;
}>;

export type SemanticConstraintIncompleteJudgment<R extends string = string> = SemanticConstraintJudgmentBase<R> & Readonly<{
  readonly status: 'incomplete';
  readonly saturated: false;
  readonly closure: 'round_limit_reached';
  readonly closed: false;
  readonly reason: 'max_rounds_exceeded';
}>;

export type SemanticConstraintSolveResult<R extends string = string> =
  | SemanticConstraintClosedJudgment<R>
  | SemanticConstraintIncompleteJudgment<R>;

export interface SemanticConstraintAuthorityCapability {
  readonly resolveConstraints: <R extends string>(
    seed: readonly SemanticRelation<R>[],
    program: SemanticConstraintProgram<R>,
    maxRounds?: number,
  ) => SemanticConstraintSolveResult<R>;
}
