# Phase 2899 — Manifest Builder Domain Input

## Purpose

Tighten the public upstream CLI-manifest entry point so it accepts one named domain request instead of two positional arguments. This reuses the existing `ControllerInvocationManifestCompositionInput` contract; it does not add a competing request interface or generic helper.

## Runtime trace

`driftAuditor` → `controllerInvocationManifestBuilder.build(compositionInput)` → `routeSyncCliManifestScanOperationFactory.create(authority).scan(input)` → `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)` → source-project canonicalization judgment `continueWith` → controller source discovery judgment `continueWith` → source document read settlements → identity binding batch `continueWith` → read batch `continueWith` → semantic judgment preparation `continueWith` → inventory closure `continueWith` → `ManifestBuilderJudgment.continueWith` → CLI terminal operation → `ControllerInvocationManifest.continueForDriftAudit`.

## Change

`ControllerInvocationManifestBuilderInterface.build` now accepts `ControllerInvocationManifestCompositionInput` as a single argument. The runtime object is explicitly identified by `kind: 'controller_invocation_manifest_builder'` and `contractVersion: 1`; the exported runtime remains `export const ...: Interface = Object.freeze({...})`. The drift-audit caller constructs the existing input ADT explicitly. The CLI scan contract already accepted that same ADT and is unchanged.

## ADT and primitive assessment

- The public builder boundary no longer splits one request across positional parameters.
- The change reuses the existing composition input ADT and does not introduce generic collection/result abstractions.
- Filesystem API boundaries still expose paths as strings internally; those are converted to the existing `SourceFile` domain value before entering the discovery evidence contract.
- The source-discovery implementation still contains internal imperative traversal and discriminant checks. This phase does **not** claim the whole runtime is free of internal branching; those remain a separate root-modeling audit target.
- `collections.ts` must remain empty.

## Validation

Run `node scripts/audits/audit-phase2899-manifest-builder-domain-input.cjs` and prior Phase 2897/2898 audits. These are structural checks, not substitutes for TypeScript typecheck, build, test suite, or CLI end-to-end validation.
