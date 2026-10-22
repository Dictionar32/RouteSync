# RouteSync Phase 2568 — CLI Semantic Pipeline Resolution ADT

## Root cause

The CLI guarded source acquisition with `requireRequestTypeDerivationSemanticPipeline`, which throws when the host has not supplied a production pipeline. The failure is safe (no legacy `RequestType[]` fallback), but the missing composition is represented as an exception instead of a closed upstream result. The commands therefore bypass the same typed-outcome discipline used by the manifest, identity, inventory, and RequestType judgment boundaries.

This phase does **not** fabricate a semantic producer. Repository tracing confirms that the canonical reasoning/verifier/decision/authority interfaces and assembler exist, but the repository still lacks a concrete production composition implementing source reasoning plus the complete 32-law verifier. Turning the legacy solver into a fake proof would violate the semantic contract.

## Change

- Added `RequestTypeDerivationSemanticPipelineResolution` and `RequestTypeDerivationSemanticPipelineResolutionInterface` to `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- Added the named operation `requestTypeDerivationSemanticPipelineResolution` to `requestTypeDerivationProductionComposition.ts`.
- Resolution returns either `request_type_semantic_pipeline_available` with the existing pipeline, or `request_type_semantic_pipeline_unavailable` with the explicit `production_composition_missing` reason and the four required capabilities.
- Kept `requireRequestTypeDerivationSemanticPipeline` as a compatibility guard for callers outside the CLI commands.
- Updated `scan` and `sync` to consume the closed resolution ADT before source-project identity creation, discovery, or manifest composition. An unavailable pipeline terminates the command with a clear diagnostic and nonzero exit code; no source acquisition or legacy fallback occurs.
- Exported the operation and types through the core public barrel.

## Path after change

`CLI composition input → upstream pipeline resolution ADT → [available: existing semantic pipeline] / [unavailable: terminal CLI failure] → source identity → manifest composition → source inventory authority → RequestType semantic judgment → downstream projection`

## Validation

The dedicated Phase 2568 static audit checks the upstream ADT, operation export, both CLI paths, and pre-acquisition ordering. Full package typecheck/build/Vitest/end-to-end execution have not been claimed.

## Remaining root cause

The missing production semantic capability composition remains the next major blocker. The next implementation must supply actual source-evidence reasoning, a complete verifier for the contract's 32 laws, decision construction, and authority evaluation using the existing upstream interfaces. This phase makes the missing composition explicit and safely terminal; it does not claim to implement those capabilities.
