# Phase 2079 — Interface-First Laravel Semantic Authority Trace

## Scope and non-goals

This phase performs a source-level trace against the Phase 2078 archive. It does not move folders or add a parallel interface that has no production consumer. No production source was changed in this trace phase. The next implementation should change the existing action/declaration authority contracts and their call sites atomically.

## Canonical path traced

`Laravel source evidence → LaravelControllerInvocationSemanticJudgmentInterface (four outcome-indexed variants) → controller declaration/action derivation → LaravelControllerResponseSemanticPipelineInterface → LaravelControllerAstProjectionSemanticAuthorityInterface → correlated LaravelControllerScanArtifact → downstream consumers`.

## Evidence in source

- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts` models invocation judgment as an outcome-indexed discriminated union and explicitly distinguishes a semantic value from a callable runtime boundary.
- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` imports `RelationMembership`, `Sequence`, and `relation*` from `semantic/relations`; it also calls `scanControllerAction` from `subscanners/controller`.
- `packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts` calls `resolveControllerActionContract`, then reconstructs a `ScannedControllerActionDescriptor` from the returned contract. This remains a subscanner/runtime orchestration boundary.
- `packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts` contains action-level derivation and imports relation operations and several controller/resource subscanner helpers. A new interface wrapper around this function would not relocate semantic ownership.
- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts` contains imperative declaration/action selection and ancestry traversal helpers. The existing authority must be evolved rather than duplicated.
- Integrated response and AST projection contracts already exist. They should remain their existing owners; do not create replacement authorities or recompute outcome/provenance downstream.

## Interface-first implementation order

1. Evolve the existing action-contract ownership so typed source evidence enters and a closed action judgment exits. Reuse current `ControllerActionContract`, request/response/dataflow ADTs, and existing rejection/blocker domain types where compatible. Do not create an unused parallel interface.
2. Evolve the existing declaration authority to return closed, outcome-indexed declaration and ancestry judgments. Encode terminal ancestry outcomes and action selection in the result; do not merely replace `if` with `switch` or move helper functions.
3. Migrate the action-scanner call site and descriptor production to consume the already-closed judgment. Preserve `ControllerActionContract` data without rebuilding or losing variants.
4. Migrate collection/relation consumers coherently. Do not relocate `Sequence` solely to change imports, and do not leave a second canonical collection definition.
5. Keep invocation → integrated response → AST projection outcome correlation intact. Scanner becomes an executor of completed contracts only after upstream contracts own all required semantics.
6. Remove the controller subscanner and runtime relation imports only after all consumers use the new contracts and static searches show no hidden dependency.

## Prohibited shortcuts

- Adding a new folder or parallel interface solely to make imports look cleaner.
- Wrapping `resolveControllerActionContract` in an interface while the same runtime function still performs semantic classification.
- Moving functions between files while retaining the same semantic ownership.
- Reclassifying invocation, response, request, or AST outcomes downstream.
- Claiming the runtime is free of `function`, `const`, or `class` without a repository-wide static audit and justified distinction between data declarations and semantic decision logic.

## Validation status

This is a trace/audit artifact only. No production source changed. Build, typecheck, and Vitest were not run. Current verdict: invocation ADT and integrated response/projection contract shapes exist; relation-free, subscanner-free, and executor-only scanner requirements remain unmet.
