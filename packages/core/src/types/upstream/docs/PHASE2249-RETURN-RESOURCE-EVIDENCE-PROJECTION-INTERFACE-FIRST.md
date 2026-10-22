# Phase 2249 — Return-resource evidence projection interface first

## Result

Added `ControllerResourceReturnSourceEvidenceProjectionInterface` in the upstream type layer. This defines the boundary before implementation/wiring: returned-expression AST stays opaque to the upstream contract; the output is typed resource-candidate evidence paired with the exact source location that produced it.

The contract is intentionally not a new semantic authority. `ControllerResourceBindingAuthorityInterface` remains the sole owner of applicability and closed resource judgments; `ControllerDataflowSemanticJudgmentAuthorityInterface` remains the owner of source-correlated dataflow closure and integrated-response composition; `LaravelControllerResponseSemanticPipelineInterface` remains the integrated-response owner; the runtime executor remains a forwarder.

The action semantic judgment contract and its production wiring advance together from version 41 to version 42. Existing migration obligations now name the exact projection boundary rather than a vague generic adapter.

## What this phase does not claim

The new projection interface is **not wired into the production path yet**. The CLI route still reaches `resolveControllerActionContract(...)` and `createControllerDataflowContract(...)`. That implementation still imports `semantic/relations` and performs AST traversal. The canonical `controllerDataflowSemanticJudgmentAuthority` also still imports `semantic/relations`. No claim is made that the scanner is now relation-free or subscanner-free.

## Next migration boundary

Implement the parser-owned adapter for `ControllerResourceReturnSourceEvidenceProjectionInterface`, then inject it through the existing action composition wiring. It must preserve candidate source locations and reuse `ControllerResourceBindingAuthorityInterface.judge(...)`; it must not infer resource applicability itself. Only after the production call graph uses the adapter and all existing outputs remain correlated should the legacy `createControllerDataflowContract` traversal be retired. The separate relation-algebra usage inside `controllerDataflowSemanticJudgmentAuthority` must then be migrated without introducing a parallel algebra or authority.

## Verification

`test-phase2249-return-resource-evidence-projection-interface-first.cjs` checks the interface shape, layer direction, ownership, version alignment, known remaining production imports, integrated-response ownership, and executor boundary. Structural checks do not establish TypeScript compilation or runtime correctness.
