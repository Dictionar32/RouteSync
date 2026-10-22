# Phase 1726 — Inventory-Bound Coverage Publication Contract

## Trace finding

Phase 1725 defined a total coverage publication authority, but its input still accepted raw `SemanticKnowledgeDataFlow` plus `InvocationSemanticAnalysis`. That boundary made the publication authority responsible for both inventory reconstruction and result-to-source correlation. The repository already has `InvocationSemanticSubjectCoverageInventoryInterface` as the explicit owner of the canonical source-subject inventory.

## Interface-first correction

`InvocationSemanticCoveragePublicationInput` now consumes:

- `inventory: readonly InvocationSemanticSubjectCoverageEntry[]`, produced by the inventory authority;
- `analysis: InvocationSemanticAnalysis`, produced by ordinary invocation analysis.

The publisher no longer accepts raw knowledge and must not reconstruct the inventory. `InvocationSemanticCoverageContract` now declares:

- inventory ownership belongs to the canonical subject inventory interface;
- every inventory entry correlates to exactly one publication entry;
- no publication entry may exist outside the inventory;
- subject form, knowledge identity, and source span remain correlated.

Contract versions advanced to coverage v19, pipeline v35, and Laravel controller invocation boundary v14. The scanner boundary now requires both inventory and publication authorities to exist before wiring.

## Scope and non-claims

This is an interface/contract phase. It does not implement the inventory producer, coverage publication authority, static invocation algebra, static authority, or Laravel production wiring. The existing scanner runtime remains unchanged and must not claim total coverage yet. No dependency on `core/src/semantic/foundation` was added.

## Verification

- Phase 1726 focused audit: 15/15 PASS.
- Phases 1721–1726 interface regression: recorded in `PHASE1726_REGRESSION_AUDIT.json`.
- Full package build was not run.
