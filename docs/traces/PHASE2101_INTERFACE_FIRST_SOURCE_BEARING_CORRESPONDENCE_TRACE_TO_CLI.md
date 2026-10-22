# Phase 2101 — Interface-First Source-Bearing Declaration Correspondence

## Goal

Strengthen the canonical declaration judgment boundary before further scanner wiring changes. Replace a positional array contract (`declarations[i]` paired with `selections[i]`) with one source-bearing correspondence value that keeps the exact parsed source record and its closed declaration selection together.

## Production trace

```text
CLI scan command
  -> PHP invocation manifest composition
  -> source invocation pipeline / frontend AST adapter
  -> invocation semantic authority
  -> validated invocation inventory receipt
  -> ManifestBuilder
  -> LaravelSourceAstScanner
  -> LaravelSourceAstPipeline
  -> LaravelControllerScannerExecutor
      -> parse controller declaration
      -> ControllerDeclarationSemanticJudgmentAuthority.correspondences
          -> source-bearing ControllerDeclarationSemanticSubject
          -> closed ControllerDeclarationSemanticSelection
          -> ControllerDeclarationSemanticCorrespondence { source, selection }
      -> declaration inventory blocked/complete gate
      -> action scan / integrated response judgment / AST projection
  -> CompleteLaravelSourceModel
  -> semantic dataflow and manifest/IR projection
  -> CLI outputs
```

This is a source-level path through the main scan pipeline, not a claim that every CLI command or dynamic runtime branch has been executed in this phase.

## Root cause fixed

Previously, the declaration authority returned only a selection array. The scanner paired it with the separately-held declaration array by index. The interface described the positional guarantee, but the type did not carry the source record with its judgment. A caller could accidentally reorder, truncate, or otherwise desynchronize the two arrays while still satisfying the broad array types.

The new interface defines:

- `ControllerDeclarationSemanticSubject<TSource, TMethod, TAttribute>` — the exact parsed source record and its semantic candidate.
- `ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute>` — the source record and closed selection as one correlated value.
- `ControllerDeclarationSemanticJudgmentAuthorityInterface.correspondences(...)` — the only authority boundary for this pairing.

The runtime authority computes each selection from its subject's candidate and returns the original source reference with that selection. The scanner consumes `correspondence.source` and `correspondence.selection` directly; it no longer zips parallel arrays or performs a second identity lookup for this pairing.

The public core barrel exports both new types. The scanner contract version is now 30.

## Related semantic contracts reviewed

- Invocation outcomes remain a closed discriminated union.
- Integrated response remains indexed by the exact invocation judgment subtype.
- AST projection forwards the exact invocation/response pair rather than reconstructing it.
- Declaration selection still distinguishes complete and blocked ancestry.
- The ancestry lattice fields `heightBound`, `rounds`, and `knownAncestors` remain numeric runtime witnesses; TypeScript does not prove their arithmetic relationship or the lattice laws.

## Dependency status — explicitly not complete

The change does **not** remove the old architecture. The controller scanner still imports relation helpers and subscanner implementations. Current direct-import scan counts in `packages/core/src` are:

- `semantic/relations`: 379 files
- `subscanners`: 24 files
- direct imports from `semantic/foundation`: 0 files

These are counts of files containing matching import declarations, not counts of runtime calls. Zero direct foundation imports is not sufficient evidence that the foundation directory is safe to delete. The route/resource pipeline and CLI consumers still need a separate dependency trace and migration.

The controller scanner still calls `scanControllerAction`, `controllerProducer`, relation folds/projections, integrated response judgment, and AST projection. This phase fixes declaration-to-selection correspondence only; it does not claim those runtime dependencies have been retired.

## Validation

- `scripts/audits/audit-phase2101-source-bearing-declaration-correspondence.cjs`: 12/12 static checks passed.
- `scripts/audits/audit-phase2100-controller-declaration-correspondence.cjs`: 12/12 static checks passed after updating its assertions to the new correspondence contract.
- Build, TypeScript typecheck, and Vitest were not run.

## Next migration boundary

The next interface-first target is the action execution boundary. It must accept a closed selected-action judgment plus source-bound invocation/declaration evidence and return a source-correlated action result. Only after that contract exists should `scanControllerAction` and controller producer wiring be migrated. Relation/subscanner removal should happen only after all consumers, including route/resource scanners and CLI projections, use the canonical contracts.
