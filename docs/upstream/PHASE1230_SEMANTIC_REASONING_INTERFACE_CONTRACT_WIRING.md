# Phase 1230 — Semantic Reasoning Contract + Upstream Wiring Closure

## Canonical direction

```text
Laravel source evidence
  -> semantic relation / rewrite / fixed-point reasoning
  -> proof-carrying SemanticReasoningContract
  -> SemanticCapabilityContract / SemanticDataflowContract
  -> upstream authority
  -> UpstreamWiringInterface
  -> manifest / graph / IR / CLI projections
```

## Changes

1. `SemanticCapabilityContractInterface` is now the explicit contract algebra; `SemanticCapabilityContract` is its closed specialization.
2. `SemanticDataflowContractInterface` is now the explicit dataflow contract algebra; `SemanticDataflowInterface` is its closed specialization and carries the proof-bearing reasoning contract.
3. Concrete manifest/graph/dataflow wiring boundaries now extend `UpstreamWiringInterface`, not the generic dependency boundary directly.
4. The CLI `generate` command no longer invokes `IntentResolver`.
5. The historical CLI intent/cart/path semantic reconstruction surfaces are empty compatibility files. Semantic meaning must be emitted upstream.
6. Added `scripts/audit-semantic-boundaries.cjs` to detect reintroduced downstream semantic reconstruction and direct generic-boundary usage.

## Architectural law

`InterfaceDependencyBoundary` is a primitive dependency relation. `UpstreamWiringInterface` is the architectural specialization used at concrete upstream-to-downstream boundaries. Semantic contracts remain upstream-owned; projections remain downstream-owned.

The downstream CLI may group, render, lower, and emit closed values. It must not infer capability from HTTP method/path/model/schema again.
