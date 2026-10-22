# Phase 2296 trace

## Actual CLI path

`packages/cli/src/commands/scan.ts`
→ `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
→ `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts`
→ `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`
→ injected `LaravelAttributeScannerInterface.scan(sourceProject)`
→ `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts`
→ `attributeProducer.produce(...)`
→ `AttributeProducerInterface` contract at `packages/core/src/compiler/scanner/attributeProducerInterface.ts`.

## Contract status

- Upstream scanner contract: `LaravelAttributeScannerInterface`, v13 (Phase 2295).
- Producer structural projection contract: `AttributeProducerInterface`, now separated from implementation.
- Whole-pipeline contract: existing `LaravelSourceAstPipelineInterface`, v9; no duplicate pipeline interface added.
- CLI composition unchanged.

## Known gap

The producer currently emits v7-shaped scanner results, while the v13 scanner contract requires discovery receipts and typed discovery blockers. The pipeline also reads the removed `attributes` field. This is a real integration mismatch and is intentionally reported, not hidden by casts or a false build claim.

## Exclusions

No new dependency on `semantic/foundation`. This phase does not resolve existing `semantic/relations` imports in the producer/utilities. No build or full TypeScript typecheck was run.
