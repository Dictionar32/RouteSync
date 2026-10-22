# Phase 2587 — Retire the legacy RequestType projection path

## Why this phase exists

The active CLI path already resolves `RequestTypeDerivationSemanticPipelineInterface` before source acquisition and passes the exact resolved pipeline to `projectRouteSyncManifestForRouteManifest`. The active projection delegates to `createAuthorityBackedRouteManifestTypeLowering`.

A competing, unproved path still existed in source: `routeManifestTypeLowering.ts` called `requestTypeDerivationProjectionPipeline.derive(...)`, which delegated to a solver returning bare `RequestType[]`; `subscanners/RequestTypeDeriver.ts` exposed that solver as a scanner entrypoint. This was a second route around the closed judgment/proof boundary, even though it was not the active CLI path in this snapshot.

## Implemented retirement

Removed the competing default path and its forwarding facades:

- `compiler/scanner/subscanners/RequestTypeDeriver.ts`
- `compiler/scanner/subscanners/request-deriver/groupAggregator.ts`
- `compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts`
- `compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts`
- `compiler/semantic/request-type-derivation/requestTypeDerivationProjectionInterface.ts`
- `compiler/scanner/wiring/routeManifestTypeLowering.ts`
- `compiler/scanner/wiring/routeManifestTypeLoweringInterface.ts`

Also removed `RequestTypeDeriver` from the `subscanners/index.ts` barrel.

No replacement solver was added, no legacy `RequestType[]` output was wrapped as a verified judgment, and no imports from `semantic/foundation`, `semantic/relations`, or `subscanners` were added to the active authority-backed lowering.

## Canonical path after retirement

```text
CLI scan/sync
  -> resolve canonical upstream semantic pipeline (fail closed if absent)
  -> source manifest composition authority
  -> source inventory + request/resource resolution preflight
  -> projectRouteSyncManifestForRouteManifest(preflight, resolvedPipeline)
  -> authority-backed type lowering
  -> semantic pipeline operation preparation
  -> integrity gate + authority assessment validation
  -> only a projectable derived judgment becomes RequestType[]
  -> manifest lowering
```

## Still-open root blocker

This phase retires the bypass; it does **not** create the missing production reasoning producer or independent verifier for every law in `REQUEST_TYPE_DERIVATION_LAW_IDS`. The CLI executable still has no zero-argument production composition, so it should fail closed until a real capability bundle is supplied. This is an intentional architectural error state, not successful end-to-end generation.

The next implementation must produce a judgment with complete source dispositions, request/resource resolution evidence, group contribution receipts, closure, conflicts/unresolved ledgers, and a proof ledger; then independently verify every canonical law before composing decision and authority. The old `RequestType[]` solver was not a valid source for those claims.

## Validation boundary

Run `node scripts/audits/audit-phase2587-retire-legacy-request-type-path.cjs` for the structural retirement check. Package typecheck, build, Vitest, and real CLI end-to-end generation are not claimed by this report.
