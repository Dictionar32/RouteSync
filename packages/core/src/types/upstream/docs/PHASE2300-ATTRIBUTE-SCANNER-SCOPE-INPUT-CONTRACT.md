# Phase 2300 — Attribute Scanner Explicit Scope Input Contract

## Objective

Strengthen the existing upstream `LaravelAttributeScannerInterface` in place. Do not create a parallel scanner interface, generic wrapper authority, or new semantic owner.

## Contract change

`LaravelAttributeScannerInterface` advances from contract v15 to v16. Its `scan` operation now receives `LaravelAttributeScanScope` instead of only `SourceProjectIdentity`.

The scope already carries both:

- the `SourceProjectIdentity` to scan;
- the closed relative directory `'app/Attributes'`.

This makes the scan boundary explicit at the interface call site. The scanner must not choose a different directory or silently widen the scope. The complete judgment, discovery receipt, directory-enumeration evidence, and contextual inventory must all preserve the supplied scope and source-project identity. A missing or unreadable directory remains a blocked outcome, not a successful empty scan.

## Why this is a contract correction

Previously, the caller supplied only the project identity, while the scan scope was implicit in the implementation. That left an important input obligation outside the call signature. The v16 signature promotes the scope to an explicit, typed input and preserves the existing complete-or-blocked judgment algebra.

This does not claim TypeScript can prove equality of repeated object values across the result. The scanner authority still owns that invariant, and consumers must not repair a contradictory complete result.

## CLI trace

`packages/cli/src/commands/scan.ts` → `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` → `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` → `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` → injected `LaravelAttributeScannerInterface.scan(scope)`.

## Required follow-up before migration is complete

1. Update the existing pipeline composition to pass an explicit `LaravelAttributeScanScope`.
2. Replace the legacy v7 scanner result with the v16 complete/blocked judgment and source-correlated receipt.
3. Align the producer with `AttributeProducerInterface` v2.
4. Remove the `attributeScan.attributes` assumption and consume the v16 receipt/inventory contract.
5. Change directory enumeration so missing/unreadable scope becomes a typed blocker.
6. Remove `semantic/relations` imports from this migration path and retire subscanner usage only after all consumers are cut over.

This phase deliberately changes the upstream interface first. Until the follow-up wiring is applied, existing call sites are expected to be incompatible with v16. No TypeScript typecheck or project build is claimed. `npm run build` was not run.
