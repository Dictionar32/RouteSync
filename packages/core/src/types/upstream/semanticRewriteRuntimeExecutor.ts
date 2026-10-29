/** Runtime composition only: semantic decisions remain owned by the injected upstream authority. */
import { semanticRewriteAuthority } from './semanticRewriteAuthority';
import type { SemanticConstraintProgram, SemanticConstraintSolveResult } from './semanticConstraintInterface';
import type {
  SemanticRewriteAuthorityInterface,
  SemanticRewriteExecutionRequest,
  SemanticRewriteFact,
  SemanticRewriteRule,
  SemanticRewriteJudgment,
  SemanticRewriteRuntimeExecutorInterface,
  SemanticRelationExecutionRequest,
  SemanticRelationExecutionJudgment,
} from './semanticRewriteInterface';

export const createSemanticRewriteRuntimeExecutor = (
  authority: SemanticRewriteAuthorityInterface,
): SemanticRewriteRuntimeExecutorInterface => Object.freeze({
  kind: 'semantic_rewrite_runtime_executor',
  authority: 'upstream',
  execute: <R extends string>(request: SemanticRewriteExecutionRequest<R>): SemanticRewriteJudgment<R> => authority.resolve(request),
  executeConstraints: <R extends string>(seed: readonly SemanticRelation<R>[], program: SemanticConstraintProgram<R>, maxRounds?: number): SemanticConstraintSolveResult<R> => authority.resolveConstraints(seed, program, maxRounds),
  executeRelations: <R extends string>(request: SemanticRelationExecutionRequest<R>): SemanticRelationExecutionJudgment<R> => authority.resolveRelations(request),
});

/** Canonical production binding: one executor instance for the shared rewrite authority. */
export const semanticRewriteRuntimeExecutor: SemanticRewriteRuntimeExecutorInterface = createSemanticRewriteRuntimeExecutor(semanticRewriteAuthority);


/** Compatibility operation for consumers that submit declarative rules to the canonical executor. */
export const solveClosedSemanticRelations = <R extends string>(
  seeds: readonly SemanticRewriteFact<R>[],
  rules: readonly SemanticRewriteRule<R>[],
  maxRounds = 1024,
): SemanticRewriteJudgment<R> => semanticRewriteRuntimeExecutor.execute({
  kind: 'semantic_rewrite_execution_request',
  seeds,
  rules,
  maxRounds,
} satisfies SemanticRewriteExecutionRequest<R>);
