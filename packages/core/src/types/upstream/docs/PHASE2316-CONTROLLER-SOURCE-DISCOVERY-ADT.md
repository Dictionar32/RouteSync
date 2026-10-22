# Phase 2316 — Controller Source Discovery ADT and Executor Boundary

## Audit finding

Phase 2315 preserved inventory-rejection and manifest-builder blocked judgments, but the CLI composition still mapped `ENOENT` during controller-directory enumeration to `[]`. That allowed a missing `app/Http/Controllers` root to be presented as a completed empty source inventory. This violated the existing inventory completeness witness: an empty source set is only valid when discovery actually completed.

## Existing contracts retained

- `LaravelControllerInvocationSemanticJudgmentInventoryResult` remains the semantic closure ADT for source-to-judgment correspondence.
- `ManifestBuilderJudgment` remains the complete/blocked manifest result.
- `LaravelControllerScannerInterface` v42 still requires an authority-produced invocation inventory receipt rather than a loose source list.
- No duplicate invocation judgment or scanner interface was introduced.

## Changes

- Added `LaravelControllerSourceDiscoveryBlocker`, `LaravelControllerSourceDiscoveryResult`, `LaravelControllerSourceDiscoveryInput`, and `LaravelControllerSourceDiscoveryInterface` to the existing upstream inventory contract module.
- The discovery result is closed: complete discovery carries project identity, canonical root, and source identities; blocked discovery carries the same project/root, partial source identities, and one typed blocker.
- The CLI composition implements the upstream discovery interface as a filesystem executor. It sorts directory entries deterministically and propagates missing nested directories, non-directory paths, and unreadable directories as blocked judgments.
- The composition terminal ADT now preserves the exact upstream discovery-blocked result. `scan`, `sync`, and drift audit present that blocker at the CLI boundary and exit unsuccessfully.
- An existing empty controller directory still yields a valid complete empty discovery. A missing directory no longer masquerades as that case.
- The composition reasoning contract version advances to 3 because root-discovery closure is now a required step.

## Trace

`scan/sync/drift` → `ControllerInvocationManifestCompositionAuthorityInterface.compose` → `LaravelControllerSourceDiscoveryInterface.discover` → `LaravelControllerSourceDiscoveryResult` → if complete, source documents and invocation judgments → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close` → existing inventory ADT → `ManifestBuilderJudgment` → CLI output boundary.

## Runtime executor assessment

Runtime remains necessary for filesystem enumeration, reading PHP files, invoking the source invocation pipeline, wiring authorities, writing outputs, and displaying results. The discovery executor now implements an upstream contract and does not infer invocation semantics. This phase does not claim that `laravelSourceAstPipeline` or `upstreamManifestBuilder` is entirely free of semantic decisions; those remain explicit audit targets.

## Verification limits

The phase audit checks contract/consumer wiring and forbidden imports. A TypeScript syntax/transpilation pass is run for touched TypeScript files. The full project typecheck and build are not run, and syntax transpilation is not a substitute for semantic typechecking or runtime fixtures.
