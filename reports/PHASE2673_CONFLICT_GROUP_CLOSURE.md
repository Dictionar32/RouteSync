# Phase 2673 — Conflict group closure verification

## Root cause

The `conflict` branch in `requestTypeDerivationProofVerifier.ts` accepted an independently correlated identity-conflict ledger without independently closing the `groupReceipts` that can accompany the same conflict judgment. Since semantic reasoning intentionally preserves contributions from unrelated, valid routes when another source occurrence conflicts, a valid conflict ledger alone did not establish that the accompanying groups were replayable, source-bound, AST-bound, or attached to the correct resource identity.

## Implementation

- Added the upstream contract `RequestTypeDerivationConflictGroupVerificationInterface` in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- Implemented `requestTypeDerivationConflictGroupVerification` and exported `requestTypeDerivationConflictGroupsMatchInput` in `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts`.
- Conflict verification now requires both the existing source-grounded collision ledger and conflict-group closure.
- Non-empty groups must independently pass contribution replay, source inventory correlation, AST action/response correlation, and resource-group identity correlation.
- Empty groups are valid only when the judgment output is also empty and no route receipt claims a `contributed` disposition.
- Added regression tests for a forged group receipt attached to a legitimate duplicate-resource conflict and for the valid no-route/no-group conflict case.
- Added `audit:phase2673-conflict-group-closure`.

## Active path trace

`packages/cli/src/index.ts` → `packages/cli/src/standaloneCompositionLoader.ts` → `packages/cli/src/upstreamCompositionFactory.ts` → `packages/cli/src/commands/scan.ts` / `sync.ts` → manifest composition → `routeManifestRequestResolutionPreflight` → injected semantic pipeline → RequestType reasoning/verifier → manifest projection.

The active CLI path still consumes the injected, assembled pipeline. It does not silently convert the legacy solver's bare `RequestType[]` into proof-backed judgments. This path is structurally audited, not end-to-end runtime proven.

## Laravel upstream evidence

- `Illuminate\Routing\Router` registers route declarations and delegates resource registration through pending resource registrations.
- `Illuminate\Routing\ResourceRegistrar` expands resource declarations into per-action routes and applies `only` / `except` filtering.
- `Illuminate\Routing\RouteCollection` owns registered route collections and method/domain lookup organization.

References: [Laravel Router](https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/Router.php), [Laravel ResourceRegistrar](https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/ResourceRegistrar.php), [Laravel RouteCollection](https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/RouteCollection.php).

The fixture's `routes/api.php`, `routes/web.php`, and `routesync.temp.manifest.json` were checked by source audits. This does not substitute for executing the fixture under Laravel.

## Structural audit results

| Audit | Assertions |
|---|---:|
| Phase 2665 — CLI → manifest → upstream | 9/9 |
| Phase 2666 — assessment witness closure | 8/8 |
| Phase 2667 — receipt-derived closure | 6/6 |
| Phase 2668 — mixed-outcome contribution ledger | 8/8 |
| Phase 2670 — source-bound incoming receipts | 10/10 |
| Phase 2671 — AST contribution replay | 12/12 |
| Phase 2672 — resource group identity | 19/19 |
| Phase 2673 — conflict group closure | 12/12 |
| **Total** | **84/84 structural assertions** |

## Verification limitations / remaining work

- The workspace has no project `node_modules`, and Vitest was not available to execute the added runtime tests.
- `examples/ecommerce-shop-source/vendor/autoload.php` is absent, so Laravel runtime route discovery was not run.
- A successful TypeScript build/typecheck has not been established.
- All 34 canonical semantic laws are still not independently verified; the verifier must continue returning `verification_incomplete` for the checked slices.
- Full `scan` / `sync` runtime execution through decision → authority → integrity → manifest remains open.

Structural audit passes are not represented as runtime or semantic-law completion.
