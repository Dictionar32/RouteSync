# Phase2434 — Upstream Coverage Contract Repair and Manifest Trace

## Source change

`requestTypeDerivationCoverage.ts` previously widened the already-closed `contract.laws` and `verification.verifiedLaws` mapped types to `unknown`, then used reflective property access. The upstream contract already guarantees a complete `Record<RequestTypeDerivationLawId, ...>`; widening it discarded compile-time guarantees unnecessarily.

The coverage operation now reads `contract.laws[law]` and `verification.verifiedLaws[law]` through their canonical mapped types. It remains a coverage-evidence operation only: it does not create or repair judgments, proofs, or verification results.

## Manifest trace result

The active CLI manifest path is still:

`CLI scan/sync` → `projectRouteSyncManifestForRouteManifest` → `routeManifestProjection` → `routeManifestTypeLowering` → `requestTypeDerivationProjectionPipeline.derive` → `createDerivationContext` → `aggregateRequestTypeGroups` → `RequestType[]`.

Existing authority-backed projection and integrated-manifest adapters remain available but unwired as the default path. This phase does not claim that the RequestType proof producer/verifier or CLI authority wiring is complete.

## Remaining upstream blocker

The production tree still lacks a concrete composition that produces a source-bound `RequestTypeDerivationJudgment`, independently verifies the full required law coverage, and supplies the existing `RequestTypeDerivationSemanticPipelineInterface` to the integrated manifest authority. The raw legacy `RequestType[]` cannot be treated as proof.

## Technical reference

TypeScript's official handbook describes discriminated unions and exhaustive checking as compile-time ways to model closed variants. That supports retaining the existing closed ADTs, but does not prove a semantic judgment: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

Laravel response documentation shows the source ecosystem has multiple response forms, which is a reason to preserve response distinctions upstream rather than collapse them in runtime projection: https://laravel.com/docs/13.x/responses

## Validation scope

Run `node scripts/audits/audit-phase2434-upstream-coverage-contract.cjs` for the targeted structural audit. This phase does not claim full TypeScript typecheck, package build, Vitest, or end-to-end CLI success.
