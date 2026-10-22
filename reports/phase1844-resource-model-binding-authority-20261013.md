# Phase 1844 — Resource Model Binding Authority

## Scope

This phase implements the semantic authority behind the existing `ResourceModelBindingJudgmentAuthority` contract. It deliberately does not claim that the production resource scanner has already migrated.

## Trace

- `LaravelControllerScanJudgment` is the canonical source-correlated controller judgment.
- Each `LaravelControllerScanArtifact` keeps `resourceBindings` alongside its integrated `invocationJudgment`.
- `ResourceModelBindingJudgmentInput` accepts the complete controller judgment, canonical model definitions, resource subject, and relation evidence. It does not accept a detached action list or a prefilled `ResourceDefinition`.
- `resourceModelBindingAuthority` derives candidates from resource-specific controller model-origin evidence and Laravel resource/model naming convention evidence.
- The authority preserves `resolved`, `unresolved`, and `ambiguous` as distinct outcomes. A resource with relevant relation evidence but no supported model candidate receives `relation_binding_unresolved`; otherwise it receives `no_model_candidate`.
- Every resolved candidate carries non-empty evidence tied to the resource/model pair.

## Implementation

Added `packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts` and static audit `scripts/audits/audit-phase1844-resource-model-binding-authority.cjs`, registered as `audit:phase1844-resource-model-binding-authority`.

## Explicit remaining gap

`laravelSourceAstPipeline.ts` still calls `ResourceScanner.scanCanonicalBundle()`, and `ControllerScanner.scanCanonicalBundle()` remains in the transitional compatibility path. The new authority is not yet wired into a production `LaravelResourceScannerInterface` implementation because the legacy resource producer currently binds its AST/definition using `ModelSymbolTable` and its own convention/dataflow path. Wiring the judgment after that producer would risk publishing a judgment that disagrees with the model embedded in the produced AST/definition. The next phase must make model binding an input to resource production, retain AST + definition + judgment as one artifact, and then migrate production wiring before retiring the legacy subscanner.

## Verification

Static audits only. Build, TypeScript typecheck, and E2E were not run.
