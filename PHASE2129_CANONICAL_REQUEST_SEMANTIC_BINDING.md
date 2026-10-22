# Phase 2129 — Canonical Request Semantic Binding

## Trace finding

Phase 2128 published canonical resource bindings, but request binding remained inside `ControllerActionContract`, a compiler-layer projection. The legacy request ADT also retained a `typed` branch whose payload is PHP AST evidence, which is not suitable as the type of upstream semantic knowledge.

## Interface evolution

- Added `LaravelControllerRequestSemanticBinding` under `packages/core/src/types/upstream/`.
- Reused `FormRequestSource`, `ClassName`, and `TypeExpression` instead of importing compiler AST types into the upstream contract.
- Published `request` on `LaravelControllerActionSemanticKnowledge`.
- Advanced the action judgment contract to version 6.
- Updated coverage: `request` is published; `body`, `dataflow`, and `schema` remain projection remainder.
- Added a compatibility adapter that preserves all four legacy variants and translates the legacy typed parameter AST through the existing `resolveParameterType` mapping.
- Preserved exact invocation judgment forwarding, runtime executor behavior, and the controller-wide integrated response pipeline.

## Remaining debt

This phase does not claim that request derivation has moved into a dedicated upstream authority. The compatibility adapter still receives the request result from `scanControllerAction()` / `resolveControllerActionContract()`. The next phase should trace whether the existing PHP parameter type and FormRequest authorities can own the derivation without duplicating a resolver or adding a foundation/relation layer. Body, dataflow, and schema remain in the legacy projection.

## Validation boundary

Run the static audit with `npm run audit:phase2129-canonical-request-semantic-binding`. TypeScript build, typecheck, and Vitest were intentionally not run in this environment.
