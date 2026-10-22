# Phase 1702 — Laravel Scanner Interface-First Contract Correction

## Decision

This phase corrects the semantic judgment contract only. It does not wire production scanners and does not claim migration completion.

## Trace and correction

- `laravelSourceAstPipeline.ts` still directly calls concrete scanner implementations. This remains a known wiring blocker and is intentionally unchanged.
- `RouteScanner.scanCanonicalBundle` consumes a legacy controller index, while `LaravelRouteScannerInterface` accepts canonical controller action flow contracts. A meaning-preserving adapter/authority is still required before wiring.
- `ResourceScanner` derives resource-model knowledge through `resolveInitialModel`, `propagateRelationEdges`, `resourceModelResolutionFor`, and `SemanticResourceBinder`. The current `resourceModelResolutionFor` returns the first matching resolution fact, and `resolveInitialModel` selects the first controller resource binding. Therefore, the earlier judgment type must not claim ambiguity has been modeled by production code.
- The prior `ResourceModelBindingJudgmentInput` accepted `ResourceDefinition`, whose `model` field already represents the answer. This is circular for a judgment authority that is supposed to derive that model.

## Contract correction

`ResourceModelBindingJudgmentInput` now takes a `ResourceModelBindingSubject` that has resource identity/name/source but no model result, plus model candidates, controller action knowledge, and relation evidence. Outcomes encode resolved with non-empty evidence, unresolved with an explicit reason, or ambiguous with at least two models and evidence for the alternatives. The judgment no longer bundles controller actions into the resolved model outcome.

This is a contract correction, not a claim that the authority exists. The existing scanner/dataflow must later be migrated to produce this evidence and use the closed judgment rather than selecting the first match.

## Invocation semantic judgment

The existing invocation semantic path remains the authority: `invocationSemanticPipeline` delegates to `invocationSemanticRuntimeExecutor`, which validates through the invocation semantic authority; `controllerDataflowAnalyzer` uses `analyzeKnowledge`. No duplicate invocation resolver was introduced.

## Verification boundary

- Contract audit checks type-level closure, evidence cardinality, no pre-resolved `ResourceDefinition` input, existing invocation pipeline reuse, and no scanner wiring changes.
- Build/typecheck are not claimed unless they run successfully in the available environment.
- No dependency on `core/src/semantic/foundation` is introduced.
