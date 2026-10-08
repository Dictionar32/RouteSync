# Phase 942 — Upstream Reverse Ownership Closure

## Result

The upstream semantic contract is `packages/core/src/types/upstream`. There is intentionally no `packages/core/src/upstream` namespace.

`compiler/scanner/upstream` is the producer/adapter layer and depends on canonical upstream types. The reverse direction is forbidden: files under `types/upstream` must not import any `compiler/scanner/*` implementation.

## Cleanup

Four historical tests that lived under `types/upstream/__tests__` but directly imported scanner implementation were moved to scanner-owned test locations:

- Eloquent lexer fixture → `compiler/scanner/symbols/model/__tests__`
- route/controller action descriptor contract → `compiler/scanner/descriptors/request`
- route-group resolver boundary → `compiler/scanner/descriptors/route/__tests__`
- controller contextual attribute boundary → `compiler/scanner/subscanners/controller`

This is a test ownership correction only; no semantic contract was moved into the scanner layer.

## Dataflow invariant

The production path remains:

```text
scanner evidence
  -> scanner/upstream adapters
  -> types/upstream semantic contracts
  -> SemanticDataflowInput (dependency | value_flow seeds only)
  -> AstDataflowAuthority fixed-point closure
  -> SemanticDataflowJudgment (derived reaches)
  -> canonical SemanticDataflowInterface
  -> analysis/path/graph projections
```

`reaches` remains authority-owned and cannot be supplied by a producer.

## Laravel boundary

Laravel-specific middleware, controller-policy, resource-flow, and authorization semantics remain framework-specific upstream relations. They are lowered to generic dataflow seeds only after effective semantic policy resolution.

Laravel 13's controller attributes (`Middleware`, `WithoutMiddleware`, `Authorize`) and resource middleware APIs are therefore evidence/semantic inputs, not new generic dataflow fact kinds.

## Example corpus

`examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` remain absent from production. The maintained ecommerce workload is the SDK test fixture under `packages/sdk/tests/fixtures/ecommerce-shop-source`.
