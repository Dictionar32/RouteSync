/** Upstream contract for declarative CHR-style semantic constraint reasoning. */
import type {
  SemanticRelation,
  SemanticRelationPattern,
} from '../../semantic/relations/semanticRewriteEngine';

export type ConstraintHandlingMode = 'propagation' | 'simplification' | 'simpagation';

export interface ConstraintHandlingRule<R extends string = string> {
  readonly id: string;
  readonly priority: number;
  readonly mode: ConstraintHandlingMode;
  readonly keep: readonly SemanticRelationPattern<R>[];
  readonly remove: readonly SemanticRelationPattern<R>[];
  readonly then: readonly SemanticRelationPattern<R>[];
}

export type ConstraintHandlingResult<R extends string = string> =
  | Readonly<{
      readonly status: 'closed';
      readonly facts: readonly SemanticRelation<R>[];
      readonly appliedRules: readonly string[];
      readonly rounds: number;
      readonly saturated: true;
    }>
  | Readonly<{
      readonly status: 'incomplete';
      readonly facts: readonly SemanticRelation<R>[];
      readonly appliedRules: readonly string[];
      readonly rounds: number;
      readonly saturated: false;
      readonly reason: 'max_rounds_exceeded';
    }>;

export interface SemanticConstraintHandlingAuthorityInterface {
  readonly kind: 'semantic_constraint_handling_authority';
  readonly solve: <R extends string>(seed: readonly SemanticRelation<R>[], rules: readonly ConstraintHandlingRule<R>[], maxRounds?: number) => ConstraintHandlingResult<R>;
}

