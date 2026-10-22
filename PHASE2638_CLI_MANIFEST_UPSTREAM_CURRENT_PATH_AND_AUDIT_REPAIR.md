# RouteSync Phase 2638 — CLI → Manifest → Upstream Current-Path Trace and Audit Repair

Date: 2026-10-21

## Scope

Trace the actual active path from the CLI composition root through manifest composition, canonical upstream source inventory, RequestType semantic pipeline, and manifest projection. Repair stale audits so they test the current source path rather than retired modules or old assumptions.

## Actual active path

1. `packages/cli/src/standaloneCompositionLoader.ts` loads a host-owned `requestTypeDerivationSemanticComposition` and checks that the canonical contract and the required `infer`, `verify`, `decide`, `evaluate`, and `validate` operations exist.
2. `packages/cli/src/upstreamCompositionFactory.ts` calls `assembleRequestTypeDerivationProductionPipeline` and connects the resulting pipeline to the manifest composition authority.
3. `packages/cli/src/commands/scan.ts` and `packages/cli/src/commands/sync.ts` require the already-assembled semantic pipeline and manifest authority before creating the Laravel source-project identity or selecting source files.
4. `packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts` constructs the canonical evidence inventory first, then records request/resource resolution ledgers.
5. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts` connects injected reasoning → verifier → coverage → decision → authority/integrity. It is an assembler, not a semantic producer.
6. `packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts` projects only a verified `derived` judgment. Non-projectable outcomes remain typed.
7. `packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts` preserves the non-projectable outcome rather than silently using a legacy solver.

## Changes implemented in this phase

- Repaired `scripts/audits/audit-phase2552-canonical-evidence-identity-integrity.cjs` to inspect the current lowering/projection authorities and current CLI ordering. Removed the unnecessary runtime dependency on the TypeScript package so the audit can run in a source-only archive.
- Repaired `scripts/audits/audit-phase2538-request-type-producer-root-cause.cjs`, which had been reading retired solver/lowering paths. It now asserts the current proof-carrying judgment, inventory/resolution operations, assembler wiring, CLI preconditions, and explicit missing-kernel boundary.
- Added `scripts/audits/audit-phase2638-cli-manifest-upstream-current-path.cjs` with ten assertions covering the active CLI → manifest → upstream path and the current semantic-kernel status.
- Registered `audit:phase2638-cli-manifest-upstream-current-path` in the root `package.json` scripts.
- No duplicate interface, second semantic contract, fake law coverage, legacy `RequestType[]` fallback, or dependency on `semantic/foundation` / `semantic/relation` was introduced.

## Verification executed

- Phase 2638 current-path audit: 10/10 passed.
- Phase 2552 canonical evidence identity audit: 8/8 passed.
- Phase 2538 producer root-cause audit: 8/8 passed.
- Phase 2534 canonical RequestType contract audit: 11/11 passed.
- Phase 2636 upstream manifest authority trace: 11/11 passed.

Total: 48/48 structural assertions passed across these five audit scripts. The result proves these source-structure checks only; it is not a TypeScript typecheck, Vitest run, package build, or Laravel end-to-end test.

## Root cause still open — not misrepresented as fixed

The concrete production `RequestTypeDerivationSemanticReasoningInterface` implementation and independent verifier for all 34 canonical laws are still absent from this archive. Existing source inventory, request/resource resolution, source-occurrence guard, decision/authority contracts, and pipeline assembler are useful upstream operations, but they do not jointly constitute a complete producer/verifier. The CLI therefore remains fail-closed unless a host provides a complete composition.

The next real implementation must build a source-bound proof producer and independently recompute all required evidence relationships and law witnesses, then wire those operations through the existing `RequestTypeDerivationSemanticPipelineCompositionInterface`. It must not manufacture a `derived` judgment from a legacy array or mark the 34 laws valid by literal coverage.

## Laravel source semantics

Route identity must be based on parsed declarations and Laravel's actual route registration semantics, including controller actions, route groups, names, parameters, resource routes, and customization. References: Laravel Routing 13.x (`https://laravel.com/framework/docs/13.x/routing`) and Controllers 12.x (`https://laravel.com/framework/docs/12.x/controllers`).
