# Phase 1369 — Upstream Reasoning Contract Adoption

## Scope

This phase is intentionally limited to `packages/core/src/types/upstream` and the scanner adapter that supplies route-capability evidence. It does not change SDK, React, CLI projection, manifest, graph, or IR behavior directly.

## Changes

### 1. Model relation alignment uses the canonical identity ADT

`modelRelation.ts` previously compared source model, property, relation, target model, and Eloquent type independently. That duplicated only part of the identity contract and omitted the foreign-key component already represented by `ModelSemanticRelationIdentity`.

The alignment now constructs the canonical identity with `modelSemanticRelationIdentityOf()` and compares `modelSemanticRelationIdentityKey()` values. This makes alignment use the same identity authority as model semantics and graph provenance. A semantic relation with a different foreign-key identity is no longer accepted as an equivalent candidate.

A regression case covers foreign-key mismatch, while the existing reversed-array case continues to prove order-independent alignment.

### 2. Route capability consumes the stronger action ADT

`RouteCapabilitySemanticEvidence` previously carried both `actionKind: RouteActionKind` and `isMutating: boolean`. The latter duplicated information already defined by `ROUTE_ACTION_KIND_REGISTRY` and could contradict the action kind.

The boolean was removed from the upstream evidence contract and its scanner adapter. The authority now derives mutability once from `ROUTE_ACTION_KIND_REGISTRY[input.actionKind].isMutating` and reuses that value for default hook kind, payload inference, and default validation-error behavior.

This keeps semantic derivation inside the upstream authority while ensuring the stronger ADT is the input source of truth.

## Reasoning deliberately retained

- `RouteDomainResolutionJudgment` remains the canonical owner of ranked domain candidates and their source evidence. Its reasoning is intentional upstream inference, not downstream duplication.
- `SemanticReconciliationEvidence` continues to carry the applicability judgment so candidate matching, status derivation, effective-key resolution, and schema evidence share one decision.
- This phase does not attempt to eliminate all reasoning. It replaces weaker duplicated inputs/identity checks with stronger existing upstream contracts.

## Audit

Run:

```bash
npm run audit:phase1369-upstream-reasoning-contract-adoption
```

The audit verifies canonical identity use, foreign-key-aware alignment, action ADT ownership, mutability derivation, and the retained upstream judgment boundaries.

A passing static audit is not evidence of a successful TypeScript build or runtime test. Those still require the repository dependencies.
