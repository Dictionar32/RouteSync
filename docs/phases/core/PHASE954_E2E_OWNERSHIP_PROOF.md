# Phase 954 — E2E Ownership and Provenance Proof

## Ownership

The generic relation substrate is owned by `semantic/foundation`.
Production compiler/graph/scanner code must not import the compatibility facades under `semantic/kernel` for:

- `relationFoundation`
- `presenceRelations`
- `relationalSequence`
- `semanticRelations`
- `relationMembership`

`semantic/kernel` remains a compatibility surface only.

`types/upstream` remains upstream-owned: production files under `types/upstream` have no imports back into compiler, scanner, graph, or IR.

## Physical Laravel fixture

The maintained fixture is:

`packages/sdk/tests/fixtures/ecommerce-shop-source`

It now contains route, controller, request, resource, model, middleware, and policy source. The controller uses Laravel 13-style `#[Middleware]` and `#[Authorize]` evidence.

Historical `examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` trees remain absent.

## Provenance proof

The executable Phase 954 scanner test consumes the physical fixture through:

`fixture -> StaticLaravelScanner.scan -> CompleteLaravelSourceModel -> SemanticRelationGraph`

Policy relations are asserted as canonical semantic relations and remain outside structural graph projection.

The Phase 760 dataflow regression now reads the physical controller fixture and proves:

`controller fixture -> scanner semantic evidence -> SemanticDataflowJudgment -> semanticDataflowInterfaceFromJudgment`

The Phase 954 scanner test then proves downstream graph consumption:

`CompleteLaravelSourceModel.relations -> structural semantic filter -> GraphEdgeRelation -> ServiceGraph.edges`

This is stronger than checking file existence or import wiring: the tests are executable consumers of the physical fixture. Full test execution still depends on the repository's Vitest dependency installation; this workspace does not contain `node_modules`.
