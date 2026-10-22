# Phase 2297 trace — Attribute scan and producer contracts

## CLI path

`packages/cli/src/commands/scan.ts` → `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` → `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` → `laravelSourceAstPipeline.execute(...)` → `dependencies.attributeScanner.scan(sourceProject)` → `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts` → `attributeProducer.produce(...)`.

## Contract mismatches

- Upstream scanner contract is now v14; producer implementation still emits v7-shaped scan judgments.
- Scanner complete receipts now bind explicit directory-enumeration evidence and ordered discovered files to per-file scan evidence.
- Scanner blocked outcomes now require a non-empty recursive failure ADT.
- Producer contract is now v2 and returns a closed complete/blocked judgment; implementation still returns `AttributeAst` and throws on missing constructor.
- Existing pipeline interface v9 remains the single pipeline contract; implementation still reads `attributeScan.attributes` and must be migrated to consume v14's receipt.
- Producer implementation and scanner utilities still import `semantic/relations`; this remains outstanding. No new `semantic/foundation` dependency was introduced.

## Validation

Phase 2297 audit checks contract shape and accurately asserts the implementation mismatch. Phase 2295 and 2296 structural audits are updated to recognize the evolved contract. No typecheck/build is claimed; `npm run build` was not run.
