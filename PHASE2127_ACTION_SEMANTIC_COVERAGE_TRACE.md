# Phase 2127 — Action Semantic Coverage Trace

## Decision

Do not describe `LaravelControllerActionSemanticKnowledge` as a closed or complete action-semantic model yet. The current contract publishes only `actionName`, `response`, `dependencies`, and `returns`; request binding, body, dataflow, schema, and resource bindings still travel through `ControllerActionContract` as the compiler projection.

Phase 2127 makes this incompleteness a typed, machine-audited contract fact rather than allowing the word “canonical” to imply that the migration is finished.

## Source trace

```text
laravelControllerScanner
  -> actionJudgment.judge(input)
  -> legacyLaravelControllerExecutionDependencies
  -> scanControllerAction(...)
  -> resolveControllerActionContract(...)
       ├─ resolveControllerBody
       ├─ createControllerReturnSet
       ├─ resolveResponse
       ├─ controllerReturnSemanticFromMethod
       ├─ createControllerDataflowContract
       ├─ resolveRequest
       ├─ resolveConstructorDependencies / resolveMethodDependencies
       ├─ resolveRuntimeReturn
       └─ resolveSchema
  -> judgment.semantic + judgment.projection
  -> scanner still reads projection.dataflow.resourceBindings
```

## Findings

1. **Action judgment value vs authority** is separated since Phase 2126.
2. **Invocation correlation** is preserved: the exact invocation judgment is retained.
3. **Integrated response** remains owned by the controller-wide response pipeline; it is not flattened into the per-action `ControllerResponse` ADT.
4. **Semantic knowledge coverage is partial.** The projection is not yet merely a consumer projection because downstream resource-binding construction still reads semantic products from `projection.dataflow`.
5. `resolveControllerActionContract` remains an aggregate derivation point. It combines body, return, response-presence, dataflow, request, dependency, runtime-return, and schema work. Moving this function wholesale to an upstream file would not constitute a semantic migration.
6. An upstream dataflow authority already exists. Trace its input/output compatibility before adding a new authority or another `foundation`/`relation` layer.

## Contract change

`LaravelControllerActionSemanticJudgmentContract` is version 4 and exposes `LaravelControllerActionSemanticKnowledgeCoverage`, a closed ADT that records the currently published members and the semantic products that remain in the projection. This is a boundary correction, not a claim that the legacy resolver has been retired.

## Next implementation order

1. Trace the existing `ControllerDataflowSemanticJudgmentAuthorityInterface` and its concrete authority against `createControllerDataflowContract`; decide whether it can own the same dataflow/resource-binding semantics without duplicate classification.
2. Establish upstream-owned typed contracts for body evidence and request binding only after checking existing ADTs and authority compatibility.
3. Move one derivation responsibility at a time behind its canonical authority; keep parser evidence acquisition separate from judgment closure.
4. Extend `LaravelControllerActionSemanticKnowledge` only when the corresponding values are genuinely produced by upstream authorities, not by copying fields out of the old projection.
5. Stop downstream reads from `projection.dataflow.resourceBindings` only after the canonical judgment carries the exact source-correlated value.
6. Retire `resolveControllerActionContract` after no semantic decision remains owned by it.

## Validation boundary

The Phase 2127 audit is static and deliberately verifies both the contract improvements and the remaining debt. It does not replace TypeScript compilation or tests. No build, typecheck, or Vitest run is claimed for this phase.
