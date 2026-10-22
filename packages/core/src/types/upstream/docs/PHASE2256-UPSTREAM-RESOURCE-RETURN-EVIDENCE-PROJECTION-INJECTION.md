# Phase 2256 — Upstream Resource Return Evidence Projection Injection

## Change

The existing `ControllerResourceReturnSourceEvidenceProjectionInterface` is now an explicit dependency of `ControllerActionContractResolverContext` and `LaravelControllerExecutionDependencies`. The production composition injects the parser-owned `controllerResourceReturnSourceEvidenceProjection` adapter, and `resolveControllerActionContract(...)` consumes only the injected interface.

The resolver no longer imports or selects the concrete route-AST projection itself. The interface remains a syntax-to-evidence boundary: it projects each returned expression into typed resource-candidate evidence while preserving that expression's source range. `ControllerResourceBindingAuthorityInterface` remains the sole owner of resource applicability and closed resource judgments.

## Trace after the change

`LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)`
→ `LaravelControllerExecutionDependencies.resourceReturnSourceEvidenceProjection`
→ `ControllerActionContractResolverContext.resourceReturnSourceEvidenceProjection`
→ `ControllerResourceReturnSourceEvidenceProjectionInterface.project(...)`
→ `ControllerResourceBindingAuthorityInterface.judge(...)`
→ existing canonical resource-binding publication.

The legacy action resolver still owns other derivations and still imports subscanner helpers. This phase does **not** claim the Laravel scanner is free of subscanners, `semantic/relations`, or `semantic/foundation`; it closes only the hidden concrete resource-evidence adapter dependency. The next root-level migration must replace the remaining action resolver derivation with existing upstream closed judgments and remove transitive relation dependencies without adding a duplicate authority.

## Verification boundary

A static audit verifies that the resolver's concrete adapter import is gone, the typed projection is required in its context, and the production wiring injects the existing adapter. Vitest, typecheck, and build are not claimed as run in this snapshot.
