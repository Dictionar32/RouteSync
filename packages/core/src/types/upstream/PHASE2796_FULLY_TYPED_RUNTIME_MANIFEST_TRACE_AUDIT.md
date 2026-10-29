# Phase 2796 — Fully Typed Runtime Scanner Operations: CLI → Upstream Manifest

## Scope
This phase audits the actual manifest-producing runtime path from CLI `scan`/`sync` into the canonical upstream manifest builder. It reuses existing contracts rather than adding a parallel upstream interface or generic reasoning abstraction.

## Runtime trace
```text
packages/cli/src/commands/scan.ts / sync.ts
  -> composition.manifestScanOperation.scan(input)
  -> RouteSyncCliManifestScanOperationInterface.scan
  -> ControllerInvocationManifestCompositionAuthorityInterface.compose
  -> source project identity canonicalization + source discovery + source reads
  -> source-document identity binding + invocation analysis/delivery
  -> upstream inventory authority closes source ↔ judgment correspondence
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelSourceAstProjectionJudgment (complete | blocked)
  -> CompleteLaravelSourceModelBuilderInterface.build(input) (complete | blocked)
  -> SemanticDataflowManifestSurfaceInterface operations
  -> ManifestBuilderJudgment (manifest_builder_complete | manifest_builder_blocked)
  -> CLI projection, validation, serialization and persistence
```

The CLI owns discovery, I/O, dependency wiring, and projection. Core authorities own semantic classification and closure. Blocked AST/source-model outcomes are not converted into an empty successful manifest.

## Interface-first runtime shape
The path already has these contracts; no duplicate upstream interface was added:
- `RouteSyncCliManifestScanOperationInterface` and factory in `packages/cli/src/manifestScanOperationInterface.ts`.
- `ControllerInvocationManifestCompositionAuthorityInterface` and factory in `packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts`.
- `ManifestBuilderOperationPreparationInterface` and `ManifestBuilderInterface` in `packages/core/src/types/upstream/manifestBuilderInterface.ts`.
- `LaravelSourceAstPipelineInterface` in `packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts`.
- `SemanticDataflowManifestSurfaceInterface` in `packages/core/src/types/upstream/semanticDataflowManifestSurface.ts`.

The manifest dataflow surface uses `export const semanticDataflowManifestSurface: SemanticDataflowManifestSurfaceInterface = Object.freeze({...})`. Its redundant exported factory and forwarding functions were removed in Phase 2795. The recursive judgment helper remains private to the owning surface.

## ADT boundary
`ManifestBuilderJudgment` remains the explicit union of `ManifestBuilderCompleteJudgment | ManifestBuilderBlockedJudgment`. The blocked branch preserves stage and blocker domain (`source_ast` versus `source_model`). The source-AST pipeline retains its discriminated judgment. A `switch` or conditional is acceptable when the owning operation exhaustively eliminates its ADT; do not add a wrapper interface solely to conceal branching.

No generic reasoning primitive, generic relation utility, or generic result wrapper was introduced. `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Follow-up recommendations (not silently applied)
1. Continue into downstream CLI projections (`routeSyncManifestFlowProjection`, dataflow/graph projections, and request-resolution preflight). Inspect existing contracts and consumers before deciding whether a function is a redundant forwarding API or a meaningful domain entry point.
2. Inventory exported function declarations by reachable runtime trace, not by repository-wide mechanical replacement. Value constructors, parsers, and pure domain functions may lack an existing object-operation contract; document that gap and ownership before adding one.
3. Preserve semantic ADTs and relation meaning. Do not replace `ManifestBuilderJudgment` or semantic data-flow relation ADTs with booleans, empty collections, generic `Result<T>`, or generic reasoning primitives.
4. A named TypeScript interface describes the operation shape; `Object.freeze` provides only runtime shallow immutability and does not itself prove type correctness or deep immutability.

## Verification boundary
The Phase 2796 structural audit has 12 checks for wiring, named interfaces, frozen operation objects where applicable, ADT branches, retired manifest-surface entry points, and the empty collections file. This is not a full TypeScript typecheck, build, full test suite, or CLI scan/sync end-to-end execution; those are not claimed.
