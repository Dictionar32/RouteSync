# Phase 964 — Upstream Dataflow Interface Migration

The semantic dataflow authority now lives under `packages/core/src/types/upstream`.

## Canonical chain

`SemanticDataflowInput -> createSemanticDataflowJudgment -> SemanticDataflowInterface`

The upstream judgment owns:

- dependency/value-flow closure;
- guarded flow predicates;
- least-fixed-point reachability;
- derived semantic paths;
- derivations/provenance of closure facts.

The scanner and compiler analysis layers no longer own a second dataflow solver.

## Compatibility boundaries

`compiler/analysis/astDataflowAuthority.ts` is now a compatibility re-export only.
`compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts` is now a compatibility adapter only.

`ControlFlowGraph` remains compiler infrastructure for SSA/dominator/optimization and is deliberately not migrated into the semantic dataflow interface.

## Route data-flow legacy

`routeDataFlow.ts` still defines a route-specific compatibility projection, but its production consumer count is zero in this phase. It is not the semantic dataflow authority and is a candidate for later vacuum/removal after test/archive references are audited.

## Laravel boundary

`RouteSyncManifestFlow` remains the downstream manifest boundary. It carries `sourceModel` and provenance without `CompleteSourceAst`. Concrete `RouteSyncManifest` remains confined to AST-dependent construction/lowering.

The physical `examples/ecommerce-shop-source` fixture remains the end-to-end semantic source used by the production analysis and manifest-flow audits.
