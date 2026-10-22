# Phase 2078 — Interface-First Trace and Folder Correction

## Scope

This phase corrects the unintended `Sequence` ownership move introduced in Phase 2077. It restores the prior source locations from Phase 2076 and removes `packages/core/src/types/upstream/sequence.ts`. No new folder or parallel type authority is introduced.

## Trace

`Laravel source evidence → canonical invocation semantic judgment (outcome-indexed ADT) → controller declaration/action derivation → integrated response judgment → AST projection judgment → correlated LaravelControllerScanArtifact → downstream consumers`.

## Findings

- The invocation judgment already uses a discriminated union to preserve four integrated response outcomes.
- Integrated response and AST projection interfaces already exist; the scan artifact correlates their outcome-specific types.
- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still imports `RelationMembership`, `Sequence`, and `relation*` from `semantic/relations`.
- The scanner still invokes `scanControllerAction` from `subscanners/controller` and performs orchestration/semantic selection.
- `packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts` still performs action-level semantic derivation and imports relation operations and controller subscanner helpers.
- `controllerDeclarationSemanticJudgmentAuthority.ts` still includes imperative semantic helpers such as action selection and ancestry traversal.
- The response pipeline and AST projection should remain their existing owners; duplicating their authorities would make the architecture worse.

## Architectural decision

Do not solve ownership by relocating `Sequence` to another directory. First evolve existing upstream action/declaration contracts into closed, outcome-indexed judgments using the existing domain types. Then migrate all consumers coherently and retire relation/subscanner dependencies only after equivalent typed contracts own their semantics. The scanner should ultimately forward evidence and closed judgments, not derive or reclassify them.

## Validation disclosure

This phase is a folder-move correction and trace artifact, not a full semantic migration. It restores the affected files to the Phase 2076 versions and removes the Phase 2077 upstream `sequence.ts`. It does not claim the scanner is free of relation imports, subscanners, functions, constants, or classes. No build, typecheck, or Vitest run was performed.
