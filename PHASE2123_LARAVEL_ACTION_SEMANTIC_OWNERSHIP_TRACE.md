# Phase 2123 — Laravel Action Semantic Ownership Trace

## Scope and constraints

This phase traces the current Phase 2122 archive. It is deliberately limited to interface/ADT review, source tracing, and a static audit. It does not modify runtime implementation, scanner wiring, authority implementation, or controller subscanner behavior. No `relation/foundation` or `semantic/foundation` subscanner is introduced. No package build or typecheck is claimed.

## End-to-end trace

1. `LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt` supplies the source-correlated invocation judgments.
2. `laravelControllerScanner.ts` parses the declaration from each exact invocation judgment and closes declaration selections through the existing declaration semantic authority and inventory closure authority.
3. For each selected action method, the scanner calls `executionDependencies.actionJudgment.judge(...)` with the same invocation judgment and source-associated method evidence.
4. `LaravelControllerActionSemanticJudgmentInterface` expresses a generic correlation: the completed action judgment retains the exact `TInvocationJudgment`, an `ActionName`, canonical `ControllerResponse`, projection contract, and dependency sequence.
5. The scanner sends that single judgment to `LaravelControllerActionExecutionInterface.execute(...)`. The executor result type preserves the same semantic judgment as one value.
6. Independently, the scanner invokes `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse(...)` with the same invocation judgment and declaration evidence, then forwards the exact pair to AST projection and the controller artifact.
7. The invocation judgment itself is a four-case ADT: not connected, source binding rejected, complete, and blocked. `ControllerResponse` is a separate two-case ADT: response present or response absent.

## Root issue found

The interface boundary is stronger than a loose runtime signature, but semantic ownership is not yet truly upstream/interface-first in production: `laravelControllerExecutionDependencies.ts` imports `scanControllerAction` from the controller subscanner, and its `judge` implementation calls it. That reaches `resolveControllerActionContract` in `descriptors/request/controllerActionContract.ts`, where method/body/return/response/dataflow decisions are still assembled. Thus the current judgment interface wraps a legacy semantic owner rather than consuming a fully closed upstream semantic judgment.

A second ownership split remains: action judgment carries `contract.semanticResponse`, while integrated response is independently produced by `judgeIntegratedResponse`. The response pipeline has its own closed evidence/source-binding/response judgment contracts, so these must not be casually merged or reconstructed. The next actual migration needs to evolve the existing action/response ADTs so action semantic meaning is produced upstream and the executor only forwards it, while retaining the existing response pipeline's source correlation and rejection outcomes.

## Relation/foundation trace

The controller scanner path does not have a `subscanners/relation` or `subscanners/foundation` replacement directory. However, upstream semantic authorities still directly import relation utilities; for example, `controllerDataflowVariableIdentityAuthority.ts` imports `relationalSequence` and `semanticRelations`. This is a transitive semantic utility dependency, not evidence that a relation/foundation subscanner exists. Repository-wide retirement is not established by this phase.

## What changed

- Added `scripts/audits/phase2123-laravel-action-semantic-ownership.audit.cjs` to lock in both verified boundaries and the known legacy ownership defect.
- Added this trace report.
- No semantic implementation or runtime/wiring/subscanner source was changed, consistent with the requested scope.

## Verification

The static audit is run directly with Node and reports its check count. This is not a TypeScript typecheck, package build, or Vitest result.
