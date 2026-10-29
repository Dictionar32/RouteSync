# Phase 2863 — Fully Typed Runtime Scanner Operations Audit

## Scope and findings

This phase creates a reproducible audit of the actual CLI manifest path and the export shapes on the scanner/upstream/CLI production path. It does not invent a new generic relation/foundation utility and does not modify `collections.ts`. Existing upstream contracts are reused.

## Runtime trace: CLI manifest

```text
CLI scan / sync command
  → composition.manifestScanOperation
  → routeSyncCliManifestScanOperationFactory.create(authority)
  → controllerInvocationManifestCompositionAuthority.compose(input)
  → ControllerInvocationManifest judgment
  → scannedManifest.continueForDriftAudit(handlers)
  → complete manifest OR explicit blocked/rejected domain handler
  → CLI projections, request-resolution preflight, output generation
```

The manifest judgment already exposes the domain operation `continueForDriftAudit`, so it is actionable rather than passive data. The scan factory already uses `export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface = Object.freeze(Ellipsis)`. The phase preserves this established interface instead of adding a redundant wrapper ADT.

The AST-semantic proof path is related but distinct from manifest construction. `AstSemanticStageProofResult` and `AstSemanticTerminalResult` expose `continueWith`, and `astSemanticStageProofOperations` is interface-first. This does not replace or stand in for the CLI manifest builder.

## Interface-first export audit

The scanner/upstream/CLI production scope contains 790 TypeScript files. It has 0 `export function` declarations, but 201 exported callable `const` declarations whose exported value is a bare arrow/function expression without an explicit interface/type annotation. There are 409 interface-annotated `Object.freeze` exports in the scanned scope.

Therefore, the requirement to convert all `export const name = (params): output => ...` forms into interface-first contracts is **not complete**. The 201 findings are recorded in `PHASE2863_AUDIT.json` by file and name. Each should be reviewed with its call sites before converting to `export const name: ExistingInterface = Object.freeze(Ellipsis)`; not every callable function can safely be changed into an object without updating the public API and all consumers.

## Relation status

The scan finds 175 `semantic/relations` import statements in 87 files across the scanner/upstream/CLI scope. CLI itself has no such imports. Relation migration remains incomplete. Keep domain relation ADTs (for example, explicit semantic data-flow relations); remove generic relation utilities only where domain-owned operations can replace them. Do not reintroduce a generic foundation.

## Structural audit results

- **PASS** — manifestScanFactoryInterfaceFirst
- **PASS** — manifestScanOperationIsConsumedByScanAndSync
- **PASS** — manifestOutcomeUsesDomainContinuation
- **PASS** — manifestCompositionAuthorityIsCanonical
- **PASS** — stageProofIsActionableAdt
- **PASS** — stageProofAuthorityInterfaceFirst
- **PASS** — noExportFunctionDeclarationsOnProductionRuntimePath
- **PASS** — cliHasNoSemanticRelationsImports
- **PASS** — collectionsRemainEmpty
- **OPEN** — `noUnannotatedExportedArrowConstOnAuditedRuntimePath`: 201 callable exports remain to review and migrate.

`packages/core/src/types/upstream/collections.ts` remains 0 bytes.

## Reproduction and limits

Run `npm run audit:phase2863-fully-typed-runtime-scanner-operations`. This audit intentionally exits non-zero while the callable export migration check remains open. It is a structural audit, not a substitute for TypeScript typecheck, Vitest, package build, or CLI E2E. The supplied snapshot has previously exhibited unresolved `semantic/relations` imports and unavailable Vitest tooling; no full build/test success is claimed.
