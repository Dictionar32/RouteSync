# Phase 797 — Semantic Route Upstream Frontier

This checkpoint advances the Laravel route syntax semantic boundary after the Phase 796 scanner token transition frontier.

## Frontier

The build exposed two classes of leakage:

1. `scannerUtils.collectPhpFiles` accumulated an immutable relational sequence into a mutable `string[]` declaration.
2. `semanticRouteSyntaxRelations` allowed relation inference to widen closed route ADTs into `any`/`unknown`, confused `Presence` with `RelationOption`, and accessed cursor host absence directly at semantic classification sites.

## Model elevation

- `RouteTargetMethodResolver` and `ConstraintStrategy` are explicit callable relation strategies.
- Route constraint values are represented by the existing `RouteConstraintValueAst` value object instead of free strings at the semantic AST boundary.
- Token classifier calls consume `Presence` through `presenceFold`; cursor `void` does not enter semantic facts directly.
- Route target descriptions remain a closed ADT and are lowered through `relationVariantFold`, not property assumptions or casts.
- Route invocation requirements are a closed interface rather than an open `Object.fromEntries` record.
- Semantic judgment facts are constructed through typed closed-fact constructors, preventing literal widening.
- `collectPhpFiles` exposes an immutable relational sequence as `Promise<readonly string[]>`.

## Laravel ecommerce workload alignment

This remains route syntax evidence feeding the existing upstream AST/semantic pipeline. No ecommerce descriptor ontology is introduced. Route facts can therefore continue into the existing Laravel ecommerce workloads (orders, products, resources, requests, controllers) through the higher AST semantic/dataflow interfaces.

## Audit

Run:

`node packages/core/scripts/audit-phase797-semantic-route-upstream-frontier.cjs`

Expected: `allPass: true`.
