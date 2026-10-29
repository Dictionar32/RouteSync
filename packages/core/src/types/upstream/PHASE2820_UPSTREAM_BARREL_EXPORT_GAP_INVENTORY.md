# Phase 2820 — Upstream Barrel Export Gap Inventory

## Finding

Phase 2819 was incomplete: the runtime trace reused existing contracts, but did not audit the upstream public barrel comprehensively. Static inventory before the targeted changes found 52 declaration-bearing source files under `packages/core/src/types/upstream` that had no direct module entry in `packages/core/src/types/upstream/index.ts`. After the three targeted module entries were added, 49 files remain without a direct entry. Some may be intentionally internal; they require an ownership/publication decision rather than blind re-exporting. This is a concrete backlog, not a claim that all 52 are necessarily public API.

## Changes in this phase

Added named public exports for the contracts directly relevant to the manifest/scanner trace that were absent from the upstream barrel:

- Route constraint algebra and its ADT/contracts from `routeConstraints.ts`.
- Controller dependency semantic judgment contracts from `controllerDependencySemanticJudgmentInterface.ts`.
- Controller return semantic production contracts from `controllerReturnSemanticProductionInterface.ts`.

No parallel contracts were introduced. `collections.ts` remains empty (0 bytes).

## Remaining inventory requiring owner-by-owner disposition

The 52 source modules without a direct upstream barrel entry are enumerated by `scripts/audits/audit-phase2820-upstream-barrel-export-gaps.cjs`. The list is an inventory of gaps in direct barrel coverage, not automatic permission to publish every implementation detail. For each file, decide whether its exported declarations are public contract, internal authority, test-only, or superseded; then add named exports for public types/operations and leave internal implementation private.

## Verification limits

This is a structural inventory and targeted barrel change. TypeScript build, package declaration build, full tests, and CLI end-to-end were not run because dependencies are not installed in the workspace.
