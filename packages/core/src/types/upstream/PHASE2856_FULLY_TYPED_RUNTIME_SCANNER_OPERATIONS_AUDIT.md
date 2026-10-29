# Phase 2856 — Fully Typed Runtime Scanner Operations Audit

## Scope

This phase audits the runtime trace that builds the upstream manifest and applies one focused domain-ADT improvement to route-domain register evidence. It does **not** claim a repository-wide migration of every semantic relation dependency.

## Runtime trace: CLI → upstream manifest

1. `packages/cli/src/commands/scan.ts` and `packages/cli/src/commands/sync.ts` consume `composition.manifestScanOperation.scan(...)` and continue the returned `ControllerInvocationManifest` through its domain-owned `continueForDriftAudit` operation.
2. `packages/cli/src/upstreamCompositionFactory.ts` composes the manifest scan operation through `routeSyncCliManifestScanOperationFactory`.
3. `packages/cli/src/manifestScanOperationInterface.ts` owns the interface-first CLI scan factory, typed by `RouteSyncCliManifestScanOperationFactoryInterface`.
4. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` composes the source-document, controller-inventory, invocation-inventory and upstream manifest builder authorities.
5. `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` prepares the canonical `ManifestBuilderInterface` using the existing upstream preparation contract.
6. `packages/core/src/types/upstream/manifestBuilderInterface.ts` owns `ManifestBuilderInput`, `ManifestBuilderJudgment`, closed complete/blocked variants, and the judgment continuation contract.
7. `packages/cli/src/commands/scan.ts` validates and persists the projected manifest through `manifestContractValidationOperations` and `manifestGeneratorOperations`; `sync.ts` uses the same persistence ADT before generation.

Separate scanner facade: `packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts` exposes `routeSyncManifestScanner` through `RouteSyncManifestScannerInterface`, its operation factory, and the upstream `ManifestBuilderJudgment`. It is audited as a parallel typed facade, not misrepresented as the sole CLI call path.

## Phase 2856 implementation

`routeDomainAuthority.ts` previously reduced route registration evidence to two local booleans and a combined truthy decision. This phase replaces that domain decision with the closed `RouteRegisterEvidence` ADT:

- `path_register`
- `action_register`
- `no_register`

Each variant exposes `continueWith(RouteRegisterEvidenceContinuationHandlersInterface)`. The interface-first runtime export `routeRegisterEvidenceAuthority` classifies evidence; the route-domain candidate assembly consumes the ADT operation rather than a boolean flag. No generic `Result`, generic continuation framework, `Sequence`, or relation/foundation utility is introduced.

The upstream folder remains the authority owner. `packages/core/src/types/upstream/collections.ts` remains empty (0 bytes).

## Interface-first pattern

Runtime facade example:

```ts
export const routeRegisterEvidenceAuthority: RouteRegisterEvidenceAuthorityInterface = Object.freeze({
  classify: classifyRouteRegisterEvidenceImplementation,
  authority: 'upstream',
  closed: true,
});
```

The implementation function is private. The public operation is an interface-typed frozen object. Domain judgments carry a continuation operation so downstream consumers can act on the judgment through named domain handlers.

## Findings and remaining work

- `semantic/relations` source directory: empty in this snapshot.
- Runtime relation imports remain in other scanner/upstream modules; these need owner-by-owner migration to existing domain contracts before their imports can be removed safely.
- The CLI manifest composition path has no relation imports in `packages/cli/src` in this snapshot.
- Production runtime paths in scanner, upstream types, and CLI have no `export function` declarations; one declaration found by the broad scan is a test helper and is outside the runtime path.
- The full workspace typecheck and Vitest suite are not claimed as passing: the snapshot has no local Vitest executable and contains unresolved imports into the intentionally empty relation directory.

## Verification

Run:

```sh
node scripts/audits/audit-phase2856-fully-typed-runtime-scanner-operations.cjs
```

The audit checks the closed register-evidence ADT, interface-first authority export, empty `collections.ts`, relation-free route-domain authority, and absence of exported function declarations on production scanner/upstream/CLI paths. Counts are generated from the checked-out snapshot; they are not proof of a successful full build.
