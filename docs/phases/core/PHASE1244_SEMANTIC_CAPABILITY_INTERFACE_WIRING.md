# Phase 1244 — Semantic Capability Interface → Contract → Upstream Wiring

## Canonical architecture

```text
SemanticReasoningInterface
  -> SemanticReasoningAlgebraInterface
  -> SemanticReasoningProofInterface
  -> SemanticReasoningContractInterface
  -> SemanticReasoningAuthorityInterface

SemanticCapabilityAlgebraInterface
  -> SemanticCapabilityContractInterface
  -> SemanticCapabilityContract
  -> SemanticCapabilityInterface
  -> SemanticCapabilityAuthorityInterface

SemanticDataflowAlgebraInterface
  -> SemanticDataflowContractInterface
  -> SemanticDataflowInterface

closed upstream capability
  -> UpstreamWiringInterface
  -> manifest / graph / IR / CLI projection
```

## Phase 1244 change

`SemanticCapabilityInterface` is the consumer-facing closed specialization of
`SemanticCapabilityContract`. It intentionally exposes no semantic execution,
classification, or re-resolution operation.

`ResourceModelKeyCapabilityContract` now specializes `SemanticCapabilityInterface`
and `ResourceModelKeyCapabilityProjectionInterface` explicitly models:

```text
ResourceModelKeyCapabilityContract
  -> UpstreamWiringInterface
  -> downstream projection
```

This makes the capability boundary structurally parallel to
`SemanticDataflowInterface` and prevents a downstream consumer from depending
on the concrete capability construction function.

## Semantic ownership

The Resource -> Model -> primary-key relation remains upstream. The CLI receives
only the closed capability through `RouteManifest.resourceModelKeyCapabilities`.
Generated resource/group names are not used to rediscover the model.

## External model alignment

MLIR interfaces are designed to let analyses and transformations query generic
semantic capabilities without encoding knowledge of every concrete operation or
dialect. MLIR also supports interface inheritance, which matches the RouteSync
interface -> algebra -> contract composition.

CodeQL distinguishes AST nodes from data-flow graph nodes. RouteSync therefore
keeps semantic AST evidence and closed data-flow authority separate rather than
using an AST resolver as a second data-flow authority.

Clang dataflow models propagation through a lattice and reaches a fixed point;
RouteSync's relation -> rewrite -> least-fixed-point -> judgment chain follows
the same broad semantic shape.

Laravel route model binding supplies source evidence for route segment -> model
identity and custom binding keys. That evidence belongs upstream, not in a Next.js
generator.

TypeScript 7's native port preserves compiler behavior while changing the
implementation substrate. This supports the RouteSync principle that stable
semantic contracts should sit above replaceable implementation machinery.

## Audit policy

`scripts/audit/routesync-architecture.cjs` remains the only active canonical
architecture audit lane. `scripts/audits/` remains historical/specialized
evidence and is not promoted to the active lane.

No build is required for this architectural phase.
