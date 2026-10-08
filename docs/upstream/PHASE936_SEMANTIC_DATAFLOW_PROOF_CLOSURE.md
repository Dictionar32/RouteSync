# Phase 936 — Semantic Dataflow Proof Closure

## Trace

The physical upstream boundary is split between:

- `packages/core/src/types/upstream`
- `packages/core/src/compiler/scanner/upstream`

The historical `examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` trees are not physical source authorities. Test-owned fixtures remain under `packages/sdk/tests/fixtures/ecommerce-shop-source`.

## Upstream guidance applied

Laravel resource/controller middleware has action-scoped semantics (`middleware`, `middlewareFor`, `withoutMiddlewareFor`) and controller middleware can be supplied through framework interfaces. The RouteSync boundary therefore keeps Laravel policy/resource middleware relations separate from generic semantic dataflow.

MLIR's data-flow framework separates a generic fixed-point solver from analysis-specific state, while MLIR interfaces decouple analyses from concrete operations. CodeQL separates source/sink/path-step modeling from the global data-flow computation. Soufflé models analysis facts as relations and derives closure through declarative rules.

## Change

`astDataflowAuthority.ts` now treats derivations as proof-carrying closure metadata:

1. every derivation conclusion must occur in the final closure;
2. every derivation premise must occur in the final closure;
3. transitive derivations require exactly two `reaches` premises;
4. the first premise target must equal the second premise source;
5. the composed endpoints must equal the derivation conclusion;
6. direct reach seeds are not duplicated by a transitive proof;
7. duplicate derivations are removed deterministically;
8. the authority throws if its proof invariant is violated.

The validator is exported as `validateSemanticDataflowDerivations` so future tests/audits can verify the same contract without duplicating the rule logic.

## Intended next frontier

Keep Laravel-specific upstream relations authoritative at their own interfaces, then project them into generic dataflow only where a typed semantic relation exists. Add source/step/sink path projection only as a derived view over the closed judgment, never as a second dataflow authority.
