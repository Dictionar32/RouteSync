# Phase 2298 Trace — Interface-First Attribute Scanner

## Decision

Do not continue strengthening `subscanners/attributeAstCanonical.ts` as the target design. It is still the current implementation behind the CLI path. That import is migration debt, not the desired ownership boundary. Keep the existing upstream `LaravelAttributeScannerInterface` as the authority boundary and evolve it in place.

## Actual active path

`cli/commands/scan.ts`
→ `cli/parsers/php/controllerInvocationManifestComposition.ts`
→ `compiler/scanner/wiring/upstreamManifestBuilder.ts`
→ `compiler/scanner/wiring/laravelSourceAstPipeline.ts`
→ `dependencies.attributeScanner.scan(sourceProject)`
→ current composition import `scanAttributeAsts` from `compiler/scanner/subscanners/attributeAstCanonical.ts`
→ current `attributeProducer` import from `subscanners/attributeProducer.ts`.

## Contract root cause

v14 receipt had two parallel recursive sequences (`enumeratedSourceFiles`, `scannedFiles`). A comment required equality, but the interface did not bind each enumerated path to its scan evidence. v15 replaces these with one `files` sequence whose entry carries the enumerated `sourceFile` and the corresponding `evidence`. The complete receipt no longer represents the same coverage twice.

## Outstanding implementation cutover

- `attributeAstCanonical.ts` returns scanner v7 shape, not v15.
- `attributeProducer.ts` returns `AttributeAst` and throws for missing constructor, despite `AttributeProducerInterface` v2 describing complete/blocked judgment.
- `laravelSourceAstPipeline.ts` still reads `attributeScan.attributes`.
- `laravelSourceAstPipeline.ts` composition still imports the active scanner from `subscanners`.
- `attributeProducer.ts` and `scannerUtils.ts` still import `semantic/relations`.
- No `semantic/foundation` import is introduced by the upstream interface.

These are explicitly not reported as fixed. The next phase must cut over the authority/producer/pipeline together; merely relocating the old code would not satisfy the semantic ownership change. Subscanner files should be emptied/retired only after the new path is wired and the consumer audit is clean.

## Verification

- Contract audit: expected to pass.
- TypeScript typecheck/build: not run.
- `npm run build`: not run.
