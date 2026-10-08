# Phase 1240 — Upstream Semantic Interface Algebra / Wiring Trace

## Scope

Trace target:

`interface/dataflow -> scripts/audit -> core/src/types/upstream -> Laravel ecommerce source -> CLI -> manifest -> graph -> IR`

External architectural references were checked against MLIR interfaces, MLIR data-flow analysis, CodeQL JavaScript/TypeScript data flow, Laravel routing/model binding, Datalog/fixed-point semantics, and TypeScript 7.

## Canonical boundary

The intended RouteSync topology is now:

`Laravel source evidence`
`-> upstream semantic facts`
`-> semantic reasoning algebra`
`-> proof-carrying contract`
`-> semantic capability/dataflow authority`
`-> UpstreamWiringInterface`
`-> manifest/graph/IR/CLI projection`

The downstream side must consume closed semantic contracts. It must not reconstruct route meaning from HTTP method/path, AST syntax, controller strings, or legacy classifier helpers.

## Interface algebra

### Semantic reasoning

`SemanticReasoningExecutionInterface`
`+ SemanticReasoningRelationInterface`
`+ SemanticReasoningRewriteInterface`
`+ SemanticReasoningFixedPointInterface`
`+ SemanticReasoningJudgmentInterface`
`-> SemanticReasoningAlgebraInterface`
`-> SemanticReasoningProofInterface`
`-> SemanticReasoningContractInterface`
`-> SemanticReasoningContract`
`-> SemanticReasoningAuthorityInterface`

The execution algebra is intentionally separate from the read-only authority carried to consumers. This prevents a consumer from acquiring the ability to re-solve upstream meaning merely because it needs a semantic result.

### Semantic capability

`identity + evidence + derivation + provenance + closure + reasoning authority`
`-> SemanticCapabilityAlgebraInterface`
`-> SemanticCapabilityContractInterface`
`-> SemanticCapabilityContract`
`-> SemanticCapabilityAuthorityInterface`

Route capability specializes this contract and owns `crudRole`, `actionKind`, security, request/response and execution semantics upstream.

### Semantic dataflow

`judgment facets`
`-> SemanticDataflowAlgebraInterface`
`-> SemanticDataflowContractInterface`
`-> SemanticDataflowInterface`

The generic `DataFlowInterface<Input, State, Node>` remains an execution/state/query surface. Its `DataFlowAuthorityInterface` is the downstream-safe read-only bridge. `SemanticDataflowInterface` remains the semantic authority; the generic interface must not become a second semantic authority.

## Upstream -> wiring -> downstream

`UpstreamWiringInterface<Upstream, Downstream>` is intentionally minimal:

- `project(upstream)`
- `direction: 'upstream_to_downstream'`
- `upstreamAuthority: 'upstream'`

It is wiring, not another semantic inference layer.

Current downstream boundaries include:

- route capability -> CLI `RouteCapabilityProjectionInterface`
- manifest flow -> graph projection
- manifest graph surface -> `ServiceGraphBuilderInterface`
- semantic dataflow authority -> IR `DataFlowProjectionInterface`
- manifest -> manifest projections
- dataflow capability authority -> capability projections

## Important cutover found in this phase

`packages/cli/src/generators/classifier/typeResolver.ts` no longer consumes `CANONICAL_ACTION_MAP` to reinterpret `actionName`. Standard action names are now selected from the already-closed `crudRole` contract. Custom action names are only normalized as output naming.

This removes one more downstream dependency on a method/action semantic mapping vocabulary.

## External alignment

MLIR explicitly uses interfaces so analyses and transformations can operate without encoding knowledge of concrete operation/dialect semantics; interface inheritance is part of the model. This supports RouteSync's contract-first interface hierarchy. citeturn0search1

MLIR data-flow analysis models propagated facts with lattice elements and convergence/fixpoint behavior. This supports keeping RouteSync's closure semantics explicit rather than embedding it in consumer control flow. citeturn1search0

CodeQL distinguishes data-flow graph nodes from AST nodes and exposes local/global flow plus transitive/reflexive closure. This supports RouteSync's separation of AST evidence from semantic dataflow identity and closure. citeturn0search2turn0search7

Clang's data-flow documentation describes repeated propagation until a fixpoint and emphasizes monotonic transfer/lattice structure. This supports the explicit `fixedPoint`/closure facet in the reasoning algebra. citeturn0search6

Laravel routing supplies source evidence such as route parameters, controller actions and implicit model binding. Those are upstream source facts; RouteSync should resolve them before downstream generation. citeturn0search0

Datalog provides a useful declarative analogy: finite rules derive relations, recursive relations can compute transitive closure, and least-fixed-point semantics gives the meaning of positive recursive rules. This reinforces the relation-table/fixed-point direction without requiring RouteSync to become a Datalog implementation. citeturn1search1turn1search2

TypeScript 7 is a native Go port that aims to preserve the prior compiler's type-checking semantics and architecture while changing implementation/performance characteristics. The relevant RouteSync lesson is to keep semantic contracts stable while allowing implementation changes behind them. citeturn0search4

## Audit policy

Active audit lane remains only:

`scripts/audit/routesync-architecture.cjs`

`scripts/audits/` remains historical/specialized evidence and is not the active gate.

No build is claimed for this phase. Validation is source-structure/audit validation only.

## Result

Canonical architecture audit:

`PASS: 86`
`FAIL: 0`
`Architecture: PASS`
