# Phase 2315 — CLI Composition Blocked ADT

## Finding: an upstream ADT existed, but it did not cover the full composition boundary

`LaravelControllerInvocationSemanticJudgmentInventoryResult` already closes inventory validation into two variants: `laravel_controller_invocation_semantic_judgment_inventory_validated` (with the authority-produced receipt) and `laravel_controller_invocation_semantic_judgment_inventory_rejected` (with the source inventory and non-empty rejection ledger). `ManifestBuilderJudgment` already closes manifest construction into complete/blocked variants.

The missing contract was the composition boundary between those two existing ADTs. Previously, composition converted inventory rejection into `ControllerInvocationManifestCompositionRejectedError`, so callers could not receive one closed terminal result for all semantic blocks.

## Change

`ControllerInvocationManifest` now composes the existing `ManifestBuilderJudgment` with `ControllerInvocationManifestInventoryRejectedJudgment`. The latter preserves the exact upstream rejected inventory result instead of copying/reclassifying its rejection data. The adapter consumes the upstream inventory result directly; the duplicate `ControllerInvocationManifestCompositionTerminalOutcome` wrapper and exception class were removed.

`scan`, `sync`, and drift audit now present both inventory rejection and source-AST projection blocking at the CLI boundary and exit non-zero without converting either judgment into a thrown semantic exception. Drift audit also consumes the typed `routeFlows` property directly instead of asserting `as any[]`.

## Trace

`CLI scan/sync/drift` → `ControllerInvocationManifestCompositionAuthorityInterface.compose` → source discovery and invocation pipeline → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close` → existing inventory ADT → composition terminal ADT **or** `ManifestBuilderInterface.build` → existing `ManifestBuilderJudgment` → CLI presentation/exit boundary.

## Remaining runtime / limits

This is not a claim that the entire CLI path is runtime-free. Filesystem discovery, source document construction, pipeline invocation, dependency wiring, output generation, and CLI presentation remain runtime operations by design. `laravelSourceAstPipeline` and `upstreamManifestBuilder` still need a separate ownership audit to determine whether any semantic classification remains in executor code. This phase does not migrate scanner implementation into a new file and does not add `semantic/foundation` or `semantic/relations` dependencies.

## Validation

Run `node scripts/audits/audit-phase2315-cli-composition-blocked-adt.cjs`. This structural audit does not replace a TypeScript typecheck or runtime tests. The project build was not run.
