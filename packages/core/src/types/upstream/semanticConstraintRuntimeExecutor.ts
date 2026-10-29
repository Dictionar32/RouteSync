/** Compatibility entry point: constraint execution uses the canonical rewrite executor. */
import type { SemanticConstraintProgram, SemanticConstraintSolveResult } from './semanticConstraintInterface';
import { semanticRewriteRuntimeExecutor } from './semanticRewriteRuntimeExecutor';

export const executeSemanticConstraintProgram = <R extends string>(
  seed: readonly SemanticRelation<R>[],
  program: SemanticConstraintProgram<R>,
  maxRounds = 1024,
): SemanticConstraintSolveResult<R> => semanticRewriteRuntimeExecutor.executeConstraints(seed, program, maxRounds);
