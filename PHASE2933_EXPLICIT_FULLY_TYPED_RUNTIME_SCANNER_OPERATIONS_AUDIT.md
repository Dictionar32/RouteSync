# Phase2933 — Explicit Fully Typed Runtime Scanner Operations

## Scope

Audit the supplied Phase2932 archive's upstream CLI manifest construction path and the existing contracts under `packages/core/src/types/upstream`. This is a source-level trace and recommendation report; it does not claim code migration or test success.

## Runtime trace

`CLI scan/sync` → `RouteSyncManifestScannerInterface.scanManifest / scanFlow` → `routeSyncManifestScanOperation` → `routeSyncManifestScanOperationFactory.create(...)` → `ManifestBuilderOperationPreparationInterface.prepare(...)` → prepared builder `.build()` → `ManifestBuilderJudgment` → terminal `continueWith({ onBlocked, onComplete })` → manifest flow projection / CLI terminal result.

The source inventory path documented in the existing upstream contracts is:

`LaravelControllerSourceDiscoveryInterface` → discovery judgment and `SourceFileInventory` → source-read settlement → source identity binding → source/judgment correspondence closure → manifest builder judgment → terminal manifest projection.

Existing contracts and reports are present and should be evolved rather than duplicated: `names.ts` (`SourceFileInventory`), `laravelRouteScannerInterface.ts`, `manifestBuilderInterface.ts`, `RouteSyncManifestScanOperationInterface.ts`, `PHASE2918_SOURCE_FILE_INVENTORY_ADT.md`, `PHASE2919_UPSTREAM_CLI_MANIFEST_RUNTIME_TRACE.md`, and `PHASE2927_SOURCE_OBSERVATION_OWNERSHIP.md`.

## Findings

### P1 — ADT carries operations, but the terminal consumer still owns branch selection

`routeSyncManifestScanOperationFactory.create` calls `judgment.continueWith({ onBlocked, onComplete })`. This is better than exposing a raw data-only union, but the caller still has to provide branch handlers. Under the requested strict “runtime without reasoning” target, evolve the existing `ManifestBuilderJudgment` terminal operations to expose domain-owned continuations such as `publishManifestFlow` / `preserveBlockedManifest` (names illustrative; check existing interface first). Do not add another generic result or a parallel manifest ADT.

### P1 — `SourceFileInventory` still has generic/callback-shaped continuation surface

`SourceFileInventoryOperations` exposes `filter(predicate)`, `countMatching(predicate)`, and visitor-based `visitSources`; these are domain-specific rather than a generic collection file, but they still expose callback protocols and primitive numeric results. The empty variant's `visitSources` implementation is a no-op (`void`). The current CLI trace also documents `continueWith` as generic debt. If the no-generic/no-callback constraint is strict, replace each traced use with source-domain operations for the actual continuation needed (read settlement, rejected-read evidence, formatting, uniqueness/correspondence closure), without recreating a generic collection abstraction. Keep `collections.ts` empty.

### P2 — interface-first exports are present but not universal proof of the whole path

`routeSyncManifestFlowProjection`, `routeSyncManifestScanOperationFactory`, `routeSyncManifestScanOperation`, `routeSyncManifestScanner`, and `manifestBuilderOperationPreparation` are interface-first runtime exports. The scanner wiring file `laravelRouteScanner.ts` also uses an interface-first factory, but its `prepare` implementation still branches on `sourceObservation.kind` to choose blocked versus source-read scheduling. Phase2927 explicitly scopes its ownership change and does not claim all branches in the full scanner/manifest pipeline have been eliminated. Move that decision only by evolving the existing source-observation ADT's domain operation; do not merely wrap the same branch in a helper.

### P2 — conversion rule must apply only to runtime entrypoints in the traced path

Target form:

```ts
export interface RouteManifestOperationInterface {
  readonly execute: (input: RouteManifestOperationInput) => Promise<RouteManifestOperationJudgment>;
}

export const routeManifestOperation: RouteManifestOperationInterface = Object.freeze({
  execute: async (input: RouteManifestOperationInput): Promise<RouteManifestOperationJudgment> => {
    // delegate to existing domain contracts
  },
});
```

Avoid `export function operation(parameter: Parameter): Output`, and avoid the untyped-inference form `export const operation = (parameter: Parameter): Output => ...` for runtime entrypoints. This is not a mandate to mechanically convert every pure local function or every upstream utility without tracing its contract and consumers.

## Required domain model direction

1. Reuse/evolve `ManifestBuilderJudgment`, `SourceFileInventory`, and the source-observation intent/result contracts already present.
2. Make terminal ADT variants provide named domain actions that can continue manifest construction or preserve a blocked outcome, rather than requiring consumers to write discriminator switches or supply generic branch handlers.
3. Preserve distinctions among an intentionally empty inventory, a blocked source observation, a failed AST/source read, and a completed manifest. A failed AST/read must never become an empty successful manifest.
4. Keep source inventory ordering and partial evidence explicit; retain source identity and rejection evidence.
5. Runtime entrypoints should be explicit interface-typed object exports, preferably `Object.freeze({...})` where immutability is part of the contract.
6. Preserve meaningful domain relationships as specific ADTs; do not reintroduce a generic `Relation` utility.
7. Keep `packages/core/src/types/upstream/collections.ts` empty.

## Verification status

- Source archive inspected: yes.
- Trace and existing contract/report references inspected: yes.
- Runtime code migrated by this phase: no.
- Audit scripts, typecheck, unit tests, build, or CLI E2E executed: no.
- Therefore no test or build pass is claimed.
