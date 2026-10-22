# Phase 2147 — Request Binding Authority Closure, Interface First

## Trace

The Phase 2146 trace showed that `laravelControllerExecutionDependencies.ts` was still deciding the semantic mapping from PHP parameter type judgment to canonical request binding. It invoked `phpParameterTypeAlgebra`, then interpreted `resolved`, `unsupported`, and `malformed` inside production wiring. This preserved failure information but left a semantic decision in the composition layer.

## Change

- Added `LaravelControllerRequestBindingEvidence` as a closed upstream evidence ADT.
- Added `LaravelControllerRequestSemanticBindingAuthorityInterface` and the existing-algebra-backed `laravelControllerRequestSemanticBindingAuthority` implementation.
- Moved the closed mapping from PHP parameter judgment to canonical request-binding judgment into that authority.
- Reduced production wiring to adapting the legacy request descriptor into typed evidence and calling the authority.
- Kept `phpParameterTypeAlgebra` as the single PHP parameter-type authority; no duplicate resolver was introduced.
- Advanced `LaravelControllerActionSemanticJudgmentContract` from version 15 to 16.
- Corrected the remaining ownership obligation: request *kind/evidence selection* is still legacy-owned, while type-resolution judgment mapping is now upstream-owned.
- Kept action derivation through `scanControllerAction(...)` and `resolveControllerActionContract(...)` explicitly open.

## Current ownership boundary

```text
Legacy ControllerRequestBinding
        -> syntax/evidence adaptation in production composition
        -> LaravelControllerRequestBindingEvidence
        -> LaravelControllerRequestSemanticBindingAuthorityInterface
        -> phpParameterTypeAlgebra
        -> closed LaravelControllerRequestSemanticBinding
        -> Action Semantic Judgment
        -> Judgment-forwarding Runtime Executor
```

The authority owns semantic interpretation of the request evidence. The composition still adapts the legacy descriptor and does not yet own request-kind discovery from controller source evidence.

## Verification scope

The Phase 2147 audit checks the interface, closed outcomes, single-authority reuse, version/export alignment, invocation correlation, executor pass-through, and the explicit legacy action derivation boundary. Syntax-only transpilation is performed for the changed TypeScript files. Full build, full typecheck, and Vitest are intentionally not run.

## Design references

- TypeScript Handbook: discriminated unions and narrowing — https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR Interfaces — https://mlir.llvm.org/docs/Interfaces/
