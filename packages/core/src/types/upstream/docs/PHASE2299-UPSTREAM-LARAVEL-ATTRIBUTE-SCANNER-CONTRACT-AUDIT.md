# Phase 2299 — Upstream Laravel Attribute Scanner Contract Audit

## Scope

This phase continues from Phase 2298 and keeps the existing `LaravelAttributeScannerInterface` as the only upstream scanner contract. It does not introduce a second scanner interface, a generic authority wrapper, or a new semantic owner.

## Existing authority contract

`packages/core/src/types/upstream/laravelAttributeScannerInterface.ts` already defines:

- `LaravelAttributeScannerInterface` v15;
- a closed complete-or-blocked `LaravelAttributeScanJudgment`;
- a source-ordered discovery receipt whose file sequence binds each source path to its AST and contextuality evidence;
- a typed directory-enumeration witness;
- a closed recursive blocker sequence;
- contextuality judgments that retain source declarations and resolved PHP interface evidence.

## Contract clarification

The interface documentation now explicitly states the cross-field invariant for a complete judgment: the source project and `app/Attributes` scope in the result, receipt, and contextual inventory must all refer to the same scan. The scanner authority owns this invariant. Consumers must not repair or reclassify an inconsistent complete result.

The documentation also makes an important filesystem rule explicit: a missing `app/Attributes` directory cannot be represented as a successful empty scan. An empty inventory is valid only after successful enumeration of the declared scope.

## Trace through the CLI

`packages/cli/src/commands/scan.ts` → `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` → `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` → `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` → injected `LaravelAttributeScannerInterface.scan(...)`.

## Findings that remain open

This phase is interface-first and does not claim the implementation migration is complete. The Phase 2298 implementation still needs to be aligned with v15:

1. `attributeAstCanonical.ts` advertises v7 and returns the legacy `attributes` shape rather than a v15 receipt and contextual inventory ADT.
2. The pipeline still reads `attributeScan.attributes` and wires `scanAttributeAsts` as contract v7.
3. `attributeProducer.ts` returns `AttributeAst` directly and throws when the constructor is missing, while `AttributeProducerInterface` v2 requires a complete-or-blocked judgment.
4. `scannerUtils.ts` treats a missing scan directory as an empty file list, which violates the clarified completeness contract.
5. The legacy path still imports `semantic/relations`; it must not be treated as the target architecture.

These are implementation and wiring defects, not a reason to create another upstream interface. The next migration must make the existing implementation satisfy the current contract, then update the pipeline and CLI path, and only then retire the old subscanner path.

## Validation boundary

This phase changes contract documentation only. It does not claim TypeScript typecheck, unit tests, or build success. `npm run build` was not run.
