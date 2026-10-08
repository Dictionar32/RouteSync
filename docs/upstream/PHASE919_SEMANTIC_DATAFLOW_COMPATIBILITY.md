# Phase 919 — Semantic Dataflow Compatibility Closure

## Finding

The Phase 918 canonical `SemanticDataflow*` algebra correctly removed AST-shaped dataflow authority, but the older Phase 910 scanner contract names (`SemanticDataFlow*Contract`) were still imported by `semanticDataFlowAnalyzer.ts` and its contract test.

## Fix

Retain those generic contracts as an explicitly deprecated compatibility surface in `semanticDataflowInterface.ts`.

They are not the canonical production authority and contain no concrete AST types. The canonical production algebra remains:

- `SemanticDataflowIdentity`
- `SemanticDataflowFact`
- `SemanticDataflowJudgment`
- `SemanticDataflowInterface`

This preserves source compatibility without reintroducing AST coupling.

## Laravel / dataflow direction

Laravel controller middleware and authorization declarations should be normalized as controller policy relations first. Laravel 13 exposes route/controller middleware, `HasMiddleware::middleware()`, `#[Middleware]`, `#[WithoutMiddleware]`, and `#[Authorize]`; action applicability (`only`/`except`) and inherited exclusions are semantic policy, not AST dataflow.

The next useful upstream boundary is an effective controller-action policy relation that joins route middleware with controller policy relations before global semantic dataflow closure.

## E-commerce fixture

`examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` remain absent. No fixture is fabricated. Existing inline e-commerce regression corpus remains the authoritative workload.
