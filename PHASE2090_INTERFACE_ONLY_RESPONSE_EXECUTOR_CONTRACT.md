# Phase 2090 — Interface-Only Response Executor Contract

## Scope

This phase changes one existing TypeScript interface declaration only:

- `packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts`

No runtime implementation, authority implementation, scanner wiring, relation/foundation module, or subscanner was changed. No new semantic interface file was introduced.

## Trace finding

The existing response runtime-executor interface exposed both `authority` and `returnResponseProjection` as independently typed dependencies. The projection is already owned by `LaravelControllerResponseSemanticJudgmentAuthorityInterface`. That contract shape permits a consumer to specialize the authority and projection independently, even though they are conceptually one ownership path.

## Interface-only repair

`LaravelControllerResponseSemanticRuntimeExecutorInterface` now has a defaulted authority type parameter:

`Authority extends LaravelControllerResponseSemanticJudgmentAuthorityInterface`

Its `authority` member retains that type parameter and its projection member is indexed as `Authority['returnResponseProjection']`. This makes the declared projection contract dependent on the selected authority type without introducing a second authority or requiring runtime changes.

This is only a type-level dependency. TypeScript structural typing cannot prove that two object-valued properties refer to the same runtime object. The contract documentation explicitly avoids making that stronger claim.

## Preserved contracts

- `LaravelControllerIntegratedResponseJudgment` remains the canonical integrated response ADT.
- The invocation judgment still distinguishes not-connected, source-binding-rejected, complete, and blocked outcomes.
- `LaravelControllerScanArtifact` still correlates the invocation judgment, integrated response judgment, and semantic AST projection.
- The runtime scanner still has relation and controller-subscanner dependencies. They are recorded as unresolved migration work, not described as removed.

## Verification

Run from the repository root:

`node scripts/audits/audit-phase2090-interface-only-response-executor-contract.cjs`

This is a static source audit only. It is not a TypeScript typecheck, build, or Vitest run.
