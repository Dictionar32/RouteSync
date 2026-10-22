# RouteSync Phase 2618 — Route Constraint ADT and Upstream Package Boundary

## Objective

Continue from Phase 2617 by fixing source ownership and package-resolution gaps without pretending that the complete CLI dependency closure is already clean.

## Root causes and changes

1. `routeDeclarationParser.ts` directly imported `relationAll` and `relationVariantFold` from `semantic/relations`. The uses were syntax-level boolean conjunction and elimination of the closed `RouteConstraintArgument` ADT, not a need for a semantic relation solver.
2. The ADT already belonged to `packages/core/src/types/upstream/routeConstraints.ts`, but had no canonical exhaustive eliminator. Added `RouteConstraintArgumentVisitor<R>` and `matchRouteConstraintArgument`, with an exhaustive `never` branch. The parser now delegates the closed ADT elimination to this owner.
3. The CLI imports `@routesync/core/upstream`, and tsdown plus TypeScript paths already declared the entrypoint, but root `package.json` did not publish the `./upstream` package export. Added ESM, CJS, and declaration paths for `dist/upstream`. This closes a real package-consumer resolution gap not detected by source-path aliases alone.

## Resulting path

```text
Laravel route tokens
  -> routeDeclarationParser
  -> upstream RouteConstraintArgument ADT eliminator
  -> RouteConstraintArgumentAst projection

CLI host composition
  -> @routesync/core/upstream package export
  -> canonical upstream contract / production pipeline assembler
  -> composition root
  -> scan / sync
  -> manifest projection
```

The parser no longer directly imports `semantic/relations`. This does **not** establish that its entire transitive dependency closure is free of that directory; neighboring syntax helpers still require separate tracing and ownership migration.

## Audit

Added `scripts/audits/audit-phase2618-route-constraint-adt-boundary.cjs`, registered as `npm run audit:phase2618-route-constraint-adt-boundary`. It checks parser dependency removal, ADT ownership and exhaustiveness, package export mapping, and consistency with the existing tsdown and TypeScript entrypoints.

## Laravel domain alignment

Laravel's official controller documentation describes both `[Controller::class, 'method']` actions and invokable controller class actions, and resource routes expand into multiple actions. RouteSync must therefore preserve the source route/action evidence and treat its AST projection as syntax, not prematurely collapse it into one controller-method shape. Source: https://laravel.com/framework/docs/12.x/controllers

## Validation limits

The phase audit is a static structural audit. It is not a full TypeScript typecheck, package build, Vitest run, or real Laravel end-to-end test. The workspace's `node_modules` is absent, so those checks are not claimed. The previous Phase 2615 transitive boundary remains a blocker until all production dependency edges are traced and migrated to their proper owners.
