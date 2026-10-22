# Phase 1701 — Laravel Scanner Migration Readiness Trace

## Decision

**Do not claim migration complete and do not wire the six scanner interfaces yet.** This phase audits the actual Phase 1700 source tree and identifies blockers that must be solved before wiring. It intentionally does not add another aspirational interface or perform an unsafe adapter conversion.

## Trace evidence

- `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` directly invokes concrete `ModelScanner`, `FormRequestScanner`, `ControllerScanner`, `ResourceScanner`, `RouteScanner`, and `ChannelScanner` APIs.
- `LaravelRouteScannerInterface` accepts `ControllerActionFlowContract[]`, but `RouteScanner.scanCanonicalBundle` accepts `RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>`. No adapter/authority currently maps the canonical contract to the legacy controller index.
- `LaravelResourceScannerInterface` accepts model/controller ASTs and action contracts, but `ResourceScanner.scanCanonicalBundle` consumes `ModelSymbolTable` and `ControllerResourceDataflow`. The interface inputs are not sufficient to call the current implementation without deriving missing structures.
- `RouteControllerBindingJudgmentAuthority` and `ResourceModelBindingJudgmentAuthority` are type declarations in `laravelScannerSemanticJudgment.ts`; no production implementation is found elsewhere and the pipeline does not call either authority.
- The invocation path is materially different: `invocationSemanticPipeline` delegates to `invocationSemanticRuntimeExecutor`, and `controllerDataflowAnalyzer` calls `invocationSemanticPipeline.analyzeKnowledge(...)`. Reuse this authority; do not duplicate invocation resolution in Laravel scanner wiring.
- Public barrel exports prove API visibility only. They do not prove implementation adoption.

## Required migration sequence

1. **Close source-backed semantic judgments first.** Implement the route/controller authority against actual route source identity and canonical controller action identity, preserving resolved/unresolved/ambiguous outcomes and provenance.
2. **Close resource binding authority.** Derive resource/model/controller binding from upstream definitions and source evidence. Do not rebuild `ModelSymbolTable` or `ControllerResourceDataflow` inside the facade.
3. **Define one canonical judgment result per scanner.** AST acquisition and semantic judgments must be distinguished where their ownership differs; do not label AST-only acquisition as semantic closure.
4. **Build adapters only where they preserve meaning.** If a legacy scanner needs a richer index, create it in a named adapter owned by the appropriate upstream authority. No casts, hidden classification, or fallback inference.
5. **Invert pipeline dependencies.** Inject or import interface implementations and remove direct concrete scanner calls from `laravelSourceAstPipeline` only after implementations satisfy the contracts.
6. **Prove all consumers migrated.** Search direct scanner references and semantic recomputation. Empty legacy files in-place only after all callers have moved; delete only after reference audit.
7. **Verify behavior.** Run typecheck, build, scanner tests, ecommerce fixture, and compare canonical AST/route-flow/resource outputs against the baseline.

## External design references

- MLIR Interfaces explain that transformations/analyses should use interfaces rather than encode knowledge of each concrete operation: <https://mlir.llvm.org/docs/Interfaces/>.
- Laravel controller documentation distinguishes route-to-action invocation, resource routes, model binding, and request injection; these are separate domain behaviors that need explicit evidence and contracts: <https://laravel.com/framework/docs/12.x/controllers>.
- Laravel request documentation describes request injection and request input as source/runtime behavior, supporting a separate FormRequest/request evidence boundary: <https://laravel.com/framework/docs/12.x/requests>.

## Verification status

The audit script reports that all inspected conditions are present. This is a **readiness/blocker audit**, not a migration-success audit. Build/typecheck are not claimed. This phase does not add a dependency on `core/src/semantic/foundation`.
