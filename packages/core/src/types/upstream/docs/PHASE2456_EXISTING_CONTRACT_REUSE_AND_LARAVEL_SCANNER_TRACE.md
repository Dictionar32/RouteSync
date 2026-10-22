# Phase2456 — Existing Contract Reuse and Laravel Scanner Trace

## Correction to Phase2455

Phase2455 introduced `RouteManifestLowererInterface` even though the repository already had `RouteManifestProjectionCompositionInterface`, the established operation boundary for producing a downstream `RouteManifest` after upstream semantic projection. The new interface duplicated an operation boundary and was removed.

`routeManifestLowerer.ts` is now an implementation helper, not a new public authority contract. `RouteManifestProjectionCompositionInterface` remains the contract for the complete operation. `integratedRouteManifestAuthority.ts` delegates through that existing composition instead of independently invoking the lowerer. The lowerer has no direct `semantic/relations`, `semantic/foundation`, or `subscanners` import.

## Laravel source-AST trace

The existing dependency boundary is `LaravelSourceAstPipelineDependenciesInterface` in `packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts`. It already names the scanner/producer dependencies and should be evolved rather than duplicated.

The active pipeline still imports or invokes legacy scanner implementations from `compiler/scanner/subscanners`, including `ModelScanner`, `FormRequestScanner`, `scanServiceBundle`, `scanMiddlewareAsts`, `scanProviderBundle`, migration/DTO/query/schema producers, response scanner, and a direct `ChannelScanner.scanCanonicalAsts(sourceProject)` call. These calls are not fixed by wrapping their outputs in `LaravelModelScannerInterface`, `LaravelServiceScannerInterface`, etc.; the implementation/semantic ownership still resides in the legacy subscanner path.

The channel cutover is specifically blocked by a real upstream input gap: `LaravelChannelScannerInterface` requires source-backed client subscription evidence and a `BroadcastChannelKindJudgmentAuthority`. The current source-AST pipeline does not supply that evidence. Passing an empty inventory or retaining pattern-based classification would falsify the contract, so this phase deliberately does not add a cosmetic adapter.

## Required next migration

1. Trace the existing producer/authority for each subscanner operation; reuse and evolve its current upstream contract.
2. Move semantic ownership—not merely files or type wrappers—to the appropriate upstream scanner/producer operation.
3. Wire `LaravelSourceAstPipelineDependenciesInterface` to those canonical operation values using `export const name: ExistingInterface = ...` where the operation is an object value.
4. Retire each legacy subscanner only after its consumers have migrated and behavior/provenance tests pass.
5. Close the channel path only after authoritative subscription evidence exists and unresolved/ambiguous judgments remain preserved.
6. Audit the transitive import graph for `semantic/relations` and `semantic/foundation`; absence of direct imports alone is not proof of closure.

## Verification boundary

The Phase2456 static audit verifies reuse of the existing composition interface, removal of the duplicate lowerer interface, delegation through the canonical composition, and explicit visibility of the remaining channel-scanner debt. It does not claim that all Laravel subscanners have been retired or that full typecheck/build/CLI regression passed.
