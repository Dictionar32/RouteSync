# Phase2980 — Fully Explicit Simplicity: Semantic Dataflow Runtime Operations

## Intent

Move canonical semantic-dataflow identity and lineage behavior behind explicit runtime operation interfaces. Domain consumers must use these operation objects rather than importing standalone exported arrow functions.

## Runtime ownership

- `SemanticDataflowIdentityOperationsInterface` owns canonical identity keying and equality.
- `semanticDataflowIdentityOperations` is the frozen, interface-typed runtime object.
- `SemanticDataflowFactLineageOperationsInterface` owns producer-lineage attachment.
- `semanticDataflowFactLineageOperations` is the frozen, interface-typed runtime object.
- The implementation helpers are private to `semanticDataflow.ts`.

## Runtime trace

```text
PHP/Laravel syntax evidence
        ↓
Upstream producers: route / controller / request / resource
        ↓
semanticDataflowFactLineageOperations.withLineage(...)
        ↓
SemanticDataflowInput / closed semantic facts
        ↓
semanticDataflowAuthority (upstream-owned closure and proof)
        ↓
semanticDataflowIdentityOperations.key/equal(...)
        ↓
CLI / manifest composition boundaries
        ↓
SemanticDataflowIRProjection
        ↓
IR and manifest graph consumers
```

The CLI and manifest path remains subject to the broader unresolved import inventory. This phase migrates the shared semantic-dataflow operations used by those boundaries; it does not claim every runtime export across all layers has been converted.

## Consumer migration

- Request, route, controller, and input factories now use `semanticDataflowFactLineageOperations.withLineage`.
- Admission, query policy, authority, analysis adapters, and IR projection now use `semanticDataflowIdentityOperations.key/equal`.
- The public upstream interface surface exports the runtime objects and their interface contracts.
- Core's public index exports the typed identity operation object instead of the old standalone equality function.

## Architectural constraints

- No generic relation foundation was restored.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- The judgment remains evidence-bearing; lineage attachment stays in the upstream domain owner.
- No fallback is introduced for missing source evidence.

## Laravel reference

Laravel's Service Container documents interface-to-implementation binding and dependency injection. That is the relevant architectural parallel: consumers depend on a contract and receive a concrete implementation. The TypeScript `export const ...: Interface = Object.freeze({...})` shape is RouteSync's own runtime convention, not Laravel syntax.

Official reference: https://laravel.com/framework/docs/container

## Verification boundary

The phase audit is structural and focused. A focused Vitest file covers identity keying, equality, and lineage attachment. Full workspace typecheck and full test suite are not claimed until run in an environment with the project's dependencies installed.
