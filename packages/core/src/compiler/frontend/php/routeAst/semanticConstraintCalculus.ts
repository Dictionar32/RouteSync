/** Compatibility facade: constraint semantics are owned by upstream authority. */
export type {
  SemanticConstraint,
  SemanticConstraintAuthorityCapability,
  SemanticConstraintClosedJudgment,
  SemanticConstraintDerivation,
  SemanticConstraintIncompleteJudgment,
  SemanticConstraintProgram,
  SemanticConstraintRule,
  SemanticConstraintSolveResult,
  SemanticConstraintTerm,
} from '../../../../types/upstream/semanticConstraintInterface';
export { toSemanticRelationRewrites } from '../../../../types/upstream/semanticConstraintAuthority';
export { solveSemanticConstraintProgram } from '../../../../types/upstream/semanticConstraintAuthority';
export type { SemanticRelation } from '../../../../semantic/relations/semanticRewriteEngine';
