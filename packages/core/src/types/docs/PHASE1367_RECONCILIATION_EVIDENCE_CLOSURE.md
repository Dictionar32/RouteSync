# Phase 1367 — Semantic Reconciliation Evidence Closure

## Problem traced

`semanticReconciliationAuthority` already computed the closed `RelationApplicability` judgment, but the candidate matcher and schema-evidence projection independently called `relationApplicability` again. This repeated domain classification and allowed those consumers to reason from a separately reconstructed judgment rather than the authority's original result.

## Change

- Extended `SemanticReconciliationEvidence` into a closed, named contract containing `kind`, the source Eloquent relation, the canonical schema relation index, and the authority-computed `RelationApplicability` judgment.
- Changed the authority to compute applicability once and seal it into that evidence value.
- Changed candidate matching and schema provenance projection to consume the same evidence judgment.
- Changed canonical-key, status, and effective-key operations to accept the same evidence contract instead of independent relation/applicability arguments. This prevents mismatched relation and applicability values from being passed together.
- Kept the semantic algebra as the sole owner of relation applicability classification. No new classifier, fallback, or synthetic consumer was added.

## Boundary

The closed reconciliation evidence is an upstream semantic contract. `SchemaRelationIndexInterface` supplies schema facts; `SemanticRelationReconciliationInterface` seals the result. Graph relation projection remains separate from dataflow and IR semantics.

## Validation

`audit:phase1367-reconciliation-evidence-closure` checks that applicability is computed once and reused through matching, status, key resolution, and provenance projection. This is a static source audit, not a substitute for typecheck, runtime tests, or a full build.
