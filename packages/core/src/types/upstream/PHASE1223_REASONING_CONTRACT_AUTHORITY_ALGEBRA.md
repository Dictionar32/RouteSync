# Phase 1223 — Semantic Reasoning Contract as Authority Algebra

## Objective

Strengthen the upstream → downstream boundary so that semantic capability and
DataFlow authority carry the **closed SemanticReasoningContract itself**, not
only a reasoning-evidence parameter.

## Canonical algebra

```text
Evidence
  ↓
Relation
  ↓
Rewrite
  ↓
FixedPoint
  ↓
Judgment
  ↓
SemanticReasoningProofInterface<Evidence>
  ↓
SemanticReasoningContract<Evidence>
  ↓
SemanticReasoningAuthorityInterface<Evidence, Contract>
  ├── SemanticCapabilityContract
  └── DataFlowAuthorityInterface
          ↓
  InterfaceDependencyBoundary
          ↓
  Manifest / Graph / IR / CLI
```

## Why this is stronger

Previously the authority boundary was parameterized only by
`SemanticReasoningEvidence`. That preserved typing but made the actual proof
contract implicit. The authority boundary now has a second generic:
`Contract extends SemanticReasoningContract<Evidence>`.

This makes the closed reasoning proof a first-class dependency while retaining
the existing evidence generic for compatibility with current DataFlow and
capability call sites.

## External semantic alignment

- CodeQL separates AST nodes from data-flow nodes and models sources, sinks,
  barriers, and additional flow steps as analysis relations. RouteSync follows
the same principle by keeping semantic relations upstream rather than hiding
meaning in downstream traversal.
- MLIR uses interfaces so generic analyses/transformations can depend on
  semantic capabilities without hard-coding concrete operations or dialects.
  RouteSync's `InterfaceDependencyBoundary` applies the same decoupling in the
  upstream → projection direction.
- Laravel routing exposes route parameters, middleware, controllers, and model
  binding as semantic evidence. These should enter RouteSync as upstream facts,
  not be reconstructed by graph/IR/CLI consumers.
- TypeScript 7's native port preserves compiler structure and semantics while
  changing implementation technology. RouteSync similarly keeps the semantic
  contract stable while allowing resolver/solver implementations to migrate.

## Remaining migration frontiers

1. `ResourceModelResolver` semantic ownership.
2. `semanticDataflowRequestProjection` semantic relation ownership.
3. `effectiveControllerActionPolicyResolver` semantic policy ownership.
4. Typed presence at the wiring boundary for optional route evidence.
5. Manifest fixture materialization of canonical `dataflowInputs`.

Build/install is intentionally not part of this phase. Validation is static
architecture audit only.
