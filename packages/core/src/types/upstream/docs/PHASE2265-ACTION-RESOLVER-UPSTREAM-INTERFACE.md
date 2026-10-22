# Phase 2265 — Existing Action Resolver Upstream Interface

## Trace

The production CLI path reaches `LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)` through `laravelControllerExecutionDependencies.ts`. Before this phase, that authority directly called `resolveControllerActionContract(...)`, coupling the action judgment composition to the resolver function.

## Change

- Added `LaravelControllerActionContractResolverInput` and `LaravelControllerActionContractResolverInterface` to the existing upstream action semantic contract module.
- Added the resolver interface as an explicit dependency of `LaravelControllerExecutionDependencies`.
- Changed action judgment composition to invoke `actionContractResolver.resolve(...)`.
- Kept the current function behind a composition adapter, preserving behavior and source provenance.
- Evolved the existing action semantic judgment contract version from 46 to 47.
- Added a static audit at `scripts/audits/audit-phase2265-action-resolver-interface.cjs`.

## Honest boundary

This phase establishes the upstream interface seam; it does **not** eliminate semantic derivation inside `resolveControllerActionContract`. The current adapter still delegates to that function. The next phase must replace its derivation with existing closed upstream judgments, then retire the adapter only after source-correlated output parity and all production consumers are accounted for.

No `semantic/foundation` dependency or new semantic relation layer was added. No build or TypeScript check is claimed.
