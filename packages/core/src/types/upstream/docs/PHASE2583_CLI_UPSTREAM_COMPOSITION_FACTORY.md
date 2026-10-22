# Phase 2583 — CLI Upstream Composition Factory

## Change

Added `composeRouteSyncCliUpstream` as the explicit CLI composition operation. It receives the existing manifest authority and the existing upstream `RequestTypeDerivationSemanticPipelineCompositionInterface`, delegates contract validation and pipeline assembly to `assembleRequestTypeDerivationProductionPipeline`, and returns a closed result:

- `routesync_cli_upstream_composition_available` carries the exact assembled pipeline and manifest authority.
- `routesync_cli_upstream_semantic_assembly_rejected` preserves the upstream assembly rejection ADT.

The semantic capability bundle is still supplied by its semantic owner. The factory does not invent reasoning, verification, decisions, authority, or judgments and does not call the legacy solver.

## Correct path

`semantic capability producers` → `RequestTypeDerivationSemanticPipelineCompositionInterface` → canonical upstream assembler → `composeRouteSyncCliUpstream` + existing manifest authority → `RouteSyncCliUpstreamCompositionInterface` → `createProgram(composition)` → `scan` / `sync` → source acquisition → semantic pipeline → manifest projection.

## Remaining blocker

The production tree still lacks a complete concrete implementation of the four semantic capabilities (reasoning, independent proof verification, decision, and authority) for the current RequestType input. Therefore the composition factory closes the wiring boundary but does not make the default zero-argument executable production-operational. No success claim should be made until those capabilities are implemented upstream and a CLI end-to-end test reaches manifest projection.

## Validation

`node scripts/audits/audit-phase2583-cli-upstream-composition-factory.cjs` checks the composition path, public exports, typed rejection preservation, and absence of semantic fallback. This structural audit is not a substitute for TypeScript typecheck, package build, Vitest, or CLI E2E.
