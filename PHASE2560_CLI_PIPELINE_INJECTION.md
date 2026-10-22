# Phase 2560 — Explicit CLI Semantic Pipeline Injection

## Root cause addressed

The CLI previously called `requireRequestTypeDerivationSemanticPipeline()` with no argument from both `scan` and `sync`. Although the core requirement function accepted an injected pipeline, the command boundary provided no way to pass one. This made the existing injection seam unreachable from the CLI composition root.

## Source changes

- `createScanCommand(pipeline?)` and `createSyncCommand(pipeline?)` now accept the existing upstream `RequestTypeDerivationSemanticPipelineInterface`.
- Each command resolves that same injected value before acquiring Laravel source files and forwards it to `projectRouteSyncManifestForRouteManifest`.
- `createProgram(pipeline?)` is the explicit CLI composition root and passes the same pipeline instance to both commands.
- The core package exports the pipeline interface as a type for consumers composing the CLI.
- The default executable remains deliberately uncomposed and fails closed. No production reasoning/verifier/decision/authority implementation is fabricated in this phase.

## Active path

`host composition → createProgram(pipeline) → scan/sync command factory → require pipeline before source acquisition → manifest/preflight → authority-backed projection → downstream manifest/IR projection`.

## Remaining root cause

This phase fixes the unreachable injection boundary; it does not create the missing concrete production capabilities. A host still needs to assemble real reasoning, complete proof verification, decision, and authority capabilities using `assembleRequestTypeDerivationProductionPipeline` before calling `createProgram(pipeline)`.

## Validation scope

Run `npm run audit:phase2560-cli-pipeline-injection`. The audit checks source-level wiring and syntax transpilation; it is not a full package build or end-to-end semantic proof.
