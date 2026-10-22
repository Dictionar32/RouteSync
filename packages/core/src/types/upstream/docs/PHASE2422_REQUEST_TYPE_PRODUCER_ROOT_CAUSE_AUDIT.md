# Phase2422 — RequestType Producer Root-Cause Audit

## Scope

Trace the current RequestType derivation route from manifest lowering to the existing upstream semantic pipeline, and determine whether a production producer can be wired without manufacturing proof evidence.

## Source trace

1. `packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts` calls `requestTypeDerivationProjectionPipeline.derive(...)`.
2. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts` delegates to `createDerivationContext` and `aggregateRequestTypeGroups`.
3. `aggregateRequestTypeGroups` in `requestTypeDerivationSolver.ts` emits `RequestType[]` directly. It does not emit `RequestTypeDerivationJudgment`, `RequestTypeDerivationProof`, source receipts, contribution receipts, a closure ledger, or verified-law coverage.
4. `RequestTypeDerivationSemanticPipelineAssembler` can assemble injected reasoning, verifier, decision, and authority capabilities, but no concrete production implementations of those four capabilities exist in `packages/core/src`.
5. `createAuthorityBackedRouteManifestProjection` accepts a pipeline by injection, but the active `routeManifestTypeLowering.ts` path does not call it.

## Root cause: the source evidence contract cannot always prove distinct route occurrences

`RequestTypeDerivationRouteOccurrenceLocation` currently contains only `file` and `line` (`requestTypeDerivationInterface.ts`, `RequestTypeRouteOccurrenceLocation`). The route flow's `RouteProvenanceContract` likewise carries source file, source line, and URI; the route boundary options do not carry a source span. However, the proof contract includes `duplicate_occurrences_are_distinct_source_locations`, `all_duplicate_occurrence_locations_are_pairwise_distinct`, and `source_occurrence_key_matches_source_coordinates`.

Two duplicate route declarations on the same source line can share file, line, URI, and semantic identity. The current route location evidence has no source-span coordinates to distinguish those occurrences. A producer cannot honestly satisfy the pairwise-distinct-location laws for this case. Minting occurrence keys from traversal order or object identity would violate the contract's own comments.

## Decision

Do not wire the legacy solver's `RequestType[]` into the proof-backed pipeline and do not synthesize a `derived` judgment or verified-law coverage around output that has not been checked. That would make the interface look connected while fabricating proof semantics.

## Required upstream correction before producer implementation

1. Extend the canonical route provenance contract to retain the original `SourceSpan` from route declaration evidence.
2. Propagate that span through route boundary input, `RouteProvenanceContract`, and `RouteSemanticFlow` without deriving it from line numbers.
3. Change `RequestTypeRouteOccurrenceLocation` to carry the canonical span and define the occurrence key from file/start/end coordinates.
4. Implement source-evidence inventory and duplicate witnesses against those canonical coordinates.
5. Implement the existing `RequestTypeDerivationSemanticReasoningInterface` and proof verifier against the complete law ADT; do not use the legacy solver's bare array as proof.
6. Only after these capabilities exist, assemble the pipeline, wire it into active manifest lowering, and preserve all non-projectable outcomes through CLI.

## Validation boundary

This phase is an evidence-backed root-cause audit. It intentionally does not claim a production fix, a passing full typecheck, a successful build, or an end-to-end CLI run. No production source was changed in this phase because the missing source-span contract is upstream of the missing proof producer; wiring the current solver would violate the existing proof laws.

## Superseded diagnosis note (Phase 2538)

The source-span portion of the original root-cause diagnosis above is historical and must not be treated as the current blocker. The current `RouteProvenanceContract` carries `declarationSpan`, and `requestTypeDerivationSourceEvidenceInventory` derives route occurrence keys from the span's file/start/end coordinates. See `PHASE2538_REQUEST_TYPE_PRODUCER_ROOT_CAUSE_RETRACE.md` for the current active-path trace. The remaining root cause is the absent concrete semantic judgment producer/proof verifier and their missing connection to active manifest lowering; the legacy solver still emits bare `RequestType[]`.
