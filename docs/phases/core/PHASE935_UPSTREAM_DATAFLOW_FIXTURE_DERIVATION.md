# Phase 935 — Upstream Dataflow Fixture and Derivation Closure

## Scope

Phase 935 follows the actual semantic path from the upstream dataflow interface through Laravel policy/resource relations and the e-commerce regression boundary. It does not introduce a Laravel-specific dataflow fact kind.

## Trace result

```text
Laravel syntax evidence
  -> route/resource registration or controller evidence
  -> semantic policy/resource relations
  -> effective action semantics
  -> SemanticDataflowInterface
  -> dependency/value_flow/reaches
  -> least-fixed-point closure
```

Policy relations remain separate from `SemanticDataflowFact`. This preserves the boundary between action policy semantics and generic value/data flow.

## E-commerce fixture repair

The historical `examples/ecommerce-shop-source` tree is intentionally absent from the Phase 934 workspace. Three SDK producer tests still referenced that missing external example tree. Phase 935 moves the minimal corpus required by those tests into the test-owned fixture boundary:

- `packages/sdk/tests/fixtures/ecommerce-shop-source/app/Http/Middleware/AdminMiddleware.php`
- `packages/sdk/tests/fixtures/ecommerce-shop-source/app/Http/DTOs/RegisterResponse.php`
- `packages/sdk/tests/fixtures/ecommerce-shop-source/app/Attributes/Response.php`

The tests now consume only this test-owned corpus. No `examples/ecommerce-shop-source` or misspelled `examples/ecomerce-shop-source` authority is recreated.

## Dataflow derivation repair

`SemanticDataflowDerivation` was already part of the closed upstream interface, but the authority previously emitted `derivations: []`. Phase 935 now derives explicit witnesses for:

1. canonical semantic facts;
2. seed reachability derived from dependency/value-flow facts;
3. transitive reachability derived from two reach premises.

The derivations remain immutable and use the existing `AstRuleName` / `AstWitnessName` vocabulary. The fixed-point closure remains the sole dataflow authority.

## Upstream guidance

Laravel's current controller/resource APIs support controller `HasMiddleware`, class/method middleware, resource `middleware`, `middlewareFor`, and `withoutMiddlewareFor`. These are best modeled as policy/effect relations composed into effective action semantics, not as generic dataflow facts.

MLIR's interface model supports the same architectural boundary: generic analyses interact through interfaces without embedding concrete operation/dialect knowledge. Its data-flow framework also separates the fixed-point solver from analysis-specific state.

CodeQL's path-query model provides the useful downstream property of explaining a source-to-sink path as individual steps. RouteSync adopts that principle as semantic derivations/witnesses without adopting CodeQL's source/sink vocabulary as its internal authority.

## Audit

`audit:phase935-upstream-dataflow-fixture-derivation` verifies:

- both historical example directories remain absent;
- no SDK producer test retains a dangling reference to `examples/ecommerce-shop-source`;
- all three test-owned fixture files exist;
- the upstream dataflow authority consumes `derivationsFor(facts, closure)`;
- canonical, reach-seed, and transitive derivation rules are present.
