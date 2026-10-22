# Phase 2312 — Manifest Builder Input ADT Closure

## Audit finding

Phase 2311 closed `LaravelSourceAstPipelineInterface.execute`, but left an optional route-selection argument at `ManifestBuilderInterface.build`, `constructRouteSyncManifest`, and the CLI composition boundary. The manifest builder then reconstructed default-versus-explicit intent by checking whether the optional argument was absent. Therefore the public upstream executor was closed while its immediate upstream callers were not.

## Contract correction

- The route-selection intent ADT now belongs to `laravelRouteSourceSelection.ts`, the domain owner of route scan intent.
- `ManifestBuilderInput` binds the authority-produced invocation receipt to a required `LaravelRouteSourceSelectionIntent`.
- `ManifestBuilderInterface.build` accepts exactly one required input object and advances to contract version 3.
- `constructRouteSyncManifest` receives that input directly and forwards the exact route intent to `LaravelSourceAstPipelineInterface.execute`.
- `ControllerInvocationManifestCompositionInput` and `buildManifestWithInvocationPipeline` require the same intent; CLI `scan`/`sync` provide explicit intent and drift audit provides default intent.
- Existing direct test and orchestrator consumers now state default intent explicitly.

## Runtime boundary

The runtime executor branches only on the discriminant supplied by the upstream intent. It does not infer intent from omission. The source-AST output ADT and existing scanner complete/blocked judgments remain unchanged.

## Trace

`CLI scan/sync/drift audit` → `ControllerInvocationManifestCompositionInput` → validated invocation inventory receipt + `LaravelRouteSourceSelectionIntent` → `ManifestBuilderInput` → `ManifestBuilderInterface.build` → `LaravelSourceAstPipelineExecutionInput` → `LaravelSourceAstPipelineInterface.execute` → Laravel scanner judgments → `LaravelSourceAstProjectionJudgment` → manifest publication gate.

## Verification and limits

Run `node scripts/audits/audit-phase2312-manifest-executor-input-closure.cjs` for the structural audit. This phase does not claim a full TypeScript typecheck or integration test. The controller declaration parser still has pre-existing `semantic/relations` imports; this phase did not add them and does not claim to remove them. That dependency remains a separate architectural defect to address at the parser/upstream ownership boundary, not by hiding it in another helper file.

The structural audit passed 13/13 checks. TypeScript `transpileModule` syntax checks passed for 18 changed TypeScript files. These checks establish syntax and expected contract shape only; they are not a full semantic typecheck or integration test.
