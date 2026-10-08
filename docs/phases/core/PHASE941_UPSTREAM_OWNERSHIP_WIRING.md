# Phase 941 — Upstream Ownership Wiring

Phase 941 closes the remaining upstream ownership leaks around the semantic dataflow and Laravel route contracts.

## Canonical boundary

The canonical upstream semantic contract remains `packages/core/src/types/upstream/`.
There is intentionally no `packages/core/src/upstream/` namespace.

The producer boundary remains `packages/core/src/compiler/scanner/upstream/`: scanner/Laravel evidence is adapted into canonical upstream semantic contracts there.

## Ownership direction

The required dependency direction is:

```text
scanner evidence
    ↓
compiler/scanner/upstream adapters
    ↓
types/upstream canonical contracts
    ↓
analysis authority
    ↓
semantic projections
```

`types/upstream` must not import scanner implementation.

## Reverse leak removed

Two tests under `types/upstream/__tests__` directly imported scanner implementation:

- `upstream-interface-elevation.phase52.test.ts`
- `route-middleware-flow-resolver.phase899.test.ts`

They now live with their implementation owners under `compiler/scanner/upstream` and continue to consume canonical upstream contracts from `types/upstream`.

The Phase 941 audit verifies zero `types/upstream → compiler/scanner/upstream` imports across both production and tests.

## Dataflow invariant

`SemanticDataflowInput` accepts only `SemanticDataflowInputFact` seed facts:

- `dependency`
- `value_flow`

Derived `reaches` remain owned by `astDataflowAuthority` and its least-fixed-point closure.

## Laravel boundary

Laravel-specific middleware, controller-policy, and resource-flow relations remain framework-specific upstream semantics. They are not collapsed into generic `SemanticDataflowFact` variants. The scanner/upstream layer adapts Laravel evidence into those contracts and then into generic dataflow seeds where appropriate.

## Ecommerce fixture

The old `examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` production/example trees remain absent. The supported ecommerce regression fixture is `packages/sdk/tests/fixtures/ecommerce-shop-source/`.

## External alignment

The ownership/dataflow separation follows the same broad direction as CodeQL's distinction between semantic data-flow graphs and AST structure, MLIR's interface-driven generic analysis, and Souffle's separation of relations from recursive derivation rules.
