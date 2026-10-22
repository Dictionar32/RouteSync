# RouteSync Phase2456 — Reuse Existing Contracts, Trace Laravel Scanner Ownership

## Why Phase2455's new interface was removed

Phase2455 introduced `RouteManifestLowererInterface` as a separate public contract. That was not justified: the repository already has `RouteManifestProjectionCompositionInterface`, which is the established contract for the complete operation that accepts the upstream manifest, runs authority-backed projection, and produces a downstream `RouteManifest` or a closed blocked outcome.

The lowerer's exact four-argument helper signature does not match the existing composition interface's three-argument `project` operation. Typing the helper as that interface would be dishonest. Therefore, the lowerer is kept as a typed implementation helper, and the existing composition interface remains the contract boundary. No duplicate lowerer interface is introduced.

`integratedRouteManifestAuthority.ts` now delegates through `createRouteManifestProjectionComposition(pipeline)` and maps the existing closed composition result. It no longer invokes the lowerer directly or independently duplicates the projection/lowering sequence.

## Files changed

- `packages/core/src/compiler/scanner/wiring/routeManifestLowererInterface.ts` — removed; this was the unnecessary new interface.
- `packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts` — removed the duplicate interface dependency and direct `semantic/relations` imports; channel projection consumes the existing typed judgment fields.
- `packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts` — delegates to the existing composition contract.
- `packages/core/src/index.ts` — removed the new interface/object exports from Phase2455 and retained the existing helper export for compatibility.
- `package.json` — registered `audit:phase2456-existing-contract-reuse` instead of the audit that enforced the duplicate interface.
- `scripts/audits/audit-phase2456-existing-contract-reuse.cjs` — added audit for contract reuse and explicit open scanner debt.
- `packages/core/src/types/upstream/docs/PHASE2456_EXISTING_CONTRACT_REUSE_AND_LARAVEL_SCANNER_TRACE.md` — documented trace, boundaries, and next cutover requirements.

## Laravel scanner trace — findings, not falsely marked closed

The active dependency boundary is already `LaravelSourceAstPipelineDependenciesInterface` in `packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts`. It should be evolved, not duplicated.

The active `laravelSourceAstPipeline.ts` still imports/invokes implementations from `compiler/scanner/subscanners`, including model, FormRequest, service, middleware, provider, migration, DTO, query, schema, response, and channel scanner paths. Existing interface-shaped wrappers do not change semantic ownership when their implementations still delegate into those legacy modules.

The direct `ChannelScanner.scanCanonicalAsts(sourceProject)` call remains open because `LaravelChannelScannerInterface` requires source-backed client-subscription evidence and `BroadcastChannelKindJudgmentAuthority`; the active pipeline does not currently provide the evidence. Supplying empty evidence or retaining pattern-based classification would violate the contract, so this phase does not disguise that gap with an adapter.

The broader relation/foundation closure is also not claimed. The route lowerer no longer imports `semantic/relations` or `semantic/foundation`, but earlier Phase2452 audit evidence still identifies transitive relation use in `phpAstExpressionSemanticAuthority.ts`, resource-model binding, and semantic rewrite authorities. Full transitive graph audit and migration remain required. Likewise, subscanner retirement is not complete.

## Verification actually performed

- `node --check scripts/audits/audit-phase2456-existing-contract-reuse.cjs` — passed.
- `node scripts/audits/audit-phase2456-existing-contract-reuse.cjs` — 7/7 assertions passed.
- `node scripts/audits/audit-phase2454-laravel-route-dependency-closure.cjs` — 11/11 passed.
- `node scripts/audits/audit-phase2453-laravel-prepared-executor.cjs` — 9/9 passed.
- `node scripts/audits/audit-phase2452-laravel-closure-return-authority.cjs` — 7 scoped assertions passed; 3 architecture debts explicitly remain open.
- `node scripts/audits/audit-phase2446-active-manifest-operation-wiring.cjs` — 14/14 passed.
- `package.json` parse — passed.

Not run: TypeScript typecheck, Vitest, package build, or CLI end-to-end. `node_modules` is not present in this workspace. The passing static audits do not prove type correctness or full scanner migration.
