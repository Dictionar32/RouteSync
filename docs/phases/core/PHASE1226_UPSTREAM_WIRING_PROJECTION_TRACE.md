# Phase 1226 — Upstream → Wiring → Downstream Projection Trace

## Purpose

Phase 1225 established `UpstreamWiringInterface` as the explicit wiring algebra. Phase 1226 removes the remaining production CLI vocabulary that implied semantic classification after the capability authority had already been resolved upstream.

## Canonical lane

```text
Laravel evidence
  -> semantic relations
  -> rewrite / fixed point
  -> semantic judgment
  -> proof contract
  -> SemanticCapability / DataFlow authority
  -> UpstreamWiringInterface
  -> manifest / graph / IR / CLI projection
```

## CLI correction

Production consumers now use `projectDomainGraph`. `classifyDomainGraph` remains only as a compatibility alias on the canonical projection module. This prevents a regression where downstream naming suggests that CLI is deriving semantic meaning.

## Why this boundary matters

MLIR interfaces allow generic transformations and analyses to consume semantic capabilities without encoding knowledge of every concrete operation or dialect. CodeQL similarly separates AST representation from its data-flow graph and lets a generic solver reason over the graph. RouteSync follows the same direction: semantic meaning is resolved upstream, while downstream receives a closed authority contract and performs projection/materialization.

Laravel route parameters, controllers, middleware, and model binding are source evidence. They should be transformed into semantic relations upstream rather than reconstructed from graph/IR/CLI.

## Remaining semantic frontiers

1. `ResourceModelResolver` — define upstream-neutral resource/model evidence before moving authority.
2. `semanticDataflowRequestProjection` — separate AST traversal from semantic relation/judgment.
3. `effectiveControllerActionPolicyResolver` — move policy judgment into relation/rewrite/fixed-point algebra.
4. Typed presence at the wiring boundary.
5. Materialize `dataflowInputs` in the example manifest fixture.

Build/install is intentionally not part of this phase.
