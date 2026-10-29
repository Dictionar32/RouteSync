# Phase 3000 — Typed Schema Evidence Domain Continuation: Upstream → CLI → Manifest

## Objective

Upgrade the route-request schema evidence ADT so it is not a passive data carrier. Both the available-evidence and unavailable-evidence variants now own `continueWith(...)`, an explicit domain continuation that lets the next operation handle the semantic outcome without rebuilding a `kind` switch at the consumer.

This is a focused continuation of Phase 2999, not a claim that every runtime export in the repository has been migrated.

## Implemented

### 1. Upstream ADT and operation contract

Changed `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts`:

- Added `RouteRequestSchemaEvidenceHandlers<TSourceIdentity, Result>` with separate `onAvailable` and `onUnavailable` handlers.
- Added `continueWith(...)` to `ControllerActionSchemaRouteRequestEvidence<TSourceIdentity>`.
- Introduced named `RouteRequestSchemaEvidenceUnavailable<TSourceIdentity>` and added `continueWith(...)` to that outcome too.
- Kept `continueToSchema()` as the existing schema projection operation.
- Bumped `ControllerActionSchemaSemanticJudgmentAuthorityInterface.contractVersion` from 6 to 7 to reflect the public contract change.

Changed `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts`:

- Available evidence is created once by the canonical schema authority and its `continueWith(...)` dispatches to `onAvailable`.
- Added `routeRequestSchemaEvidenceFactory: RouteRequestSchemaEvidenceFactoryInterface`, an interface-typed frozen operation that constructs explicit unavailable evidence and dispatches its continuation to `onUnavailable`.
- Unavailable evidence continues to the existing canonical empty schema payload; it does not fabricate schema provenance.

The factory and contracts are exported from the upstream and core public barrels.

### 2. Applied to the runtime route path

Changed `packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts` to use the canonical unavailable-evidence factory rather than reconstructing an inline payload-only object.

Changed `packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionDescriptor.ts`, `packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts`, and the relevant SDK fixtures to use the factory for unavailable schema evidence.

The `controller_reference` route composition now consumes evidence through its domain continuation:

```ts
schema: schemaEvidence.continueWith({
  onAvailable: evidence => evidence.continueToSchema(),
  onUnavailable: evidence => evidence.continueToSchema(),
}),
schemaEvidence,
```

The two handlers currently project the same schema operation because unavailable evidence already owns the canonical empty-schema continuation. Their separate branches preserve the semantic distinction for downstream consumers without re-deriving it from `kind` or field cardinality.

Added focused tests at `packages/core/src/types/__tests__/controller-action-schema-evidence-continuation-phase-3000.test.ts` for both available and unavailable continuation outcomes.

## Runtime trace

```text
Laravel route declaration + controller action source
  → controller body inline-validation evidence / Form Request evidence
  → controllerActionSchemaSemanticJudgmentAuthority.judge(...)
  → ControllerActionSchemaSemanticJudgment
  → routeRequestEvidence (canonical source identity + origin + schema + inline entries)
  → ControllerActionRouteCorrelationAuthority.judge(...)
  → ControllerActionJudgmentRouteSelection.continueToRouteSchemaEvidence()
  → RouteRequestSchemaEvidence.continueWith(...)
  → routeDeclarationComposition / RouteBoundaryOptions.schemaEvidence
  → RouteBindingContract.schemaEvidence
  → RouteSemanticFlow.binding
  → route manifest lowerer
  → ManifestGenerator
  → ManifestSerializer preserves route.binding
  → serialized route manifest
```

The CLI invocation manifest remains a separate projection. This phase does **not** claim that schema evidence is bridged field-by-field into the invocation manifest or that the route manifest and invocation manifest have become one model.

## Interface-first export audit

The following reachable modules were scanned for `export function` declarations:

- `packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts`
- `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts`
- `packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts`
- `packages/cli/src/generators/ManifestGenerator.ts`
- `packages/cli/src/generators/ManifestSerializer.ts`

No `export function` declarations were found in this scoped set. No mechanical replacement was made where no such declaration exists. The new factory follows `export const routeRequestSchemaEvidenceFactory: RouteRequestSchemaEvidenceFactoryInterface = Object.freeze({...})`.

This is a scoped trace, not a repository-wide guarantee that every runtime export has been migrated.

## Static audit and syntax verification

Repeatable audit:

```sh
npm run audit:phase3000-schema-evidence-domain-continuation
```

Structural result: **15/15 checks passed**.

TypeScript `transpileModule` syntax checks: **11 changed TypeScript files, zero syntax diagnostics**.

Full repository typecheck and Vitest suite were not run. `node_modules` is absent from this workspace; syntax transpilation is not a substitute for semantic typechecking or executing the new tests.

The audit also confirms:

- `packages/core/src/types/upstream/collections.ts` remains empty.
- Deleted relation-foundation modules remain absent and were not restored.
- Unavailable schema evidence construction is centralized through the domain factory on the traced route path.

## Laravel/PHP semantic basis

Laravel distinguishes closure routes from controller-action routes and supports inline request validation as well as Form Request validation. These are different source evidence paths; preserving the schema origin and source identity upstream avoids making the CLI guess how the schema was produced. PHP type declarations likewise establish declared type contracts, but they do not by themselves prove Laravel request-validation rules.

- Laravel Routing: https://laravel.com/framework/docs/routing
- Laravel Controllers: https://laravel.com/framework/docs/13.x/controllers
- Laravel Validation: https://laravel.com/framework/docs/validation/latest
- PHP Type Declarations: https://www.php.net/manual/en/language.types.declarations.php

## Remaining work

1. Run full typecheck and the focused Vitest tests once dependencies are installed.
2. Add an executable Laravel fixture that proves source identity, schema origin, inline validation entries, and schema payload survive through the serialized route manifest.
3. Trace the CLI invocation-manifest projection separately and prove any needed bridge field-by-field before introducing a shared domain value.
4. Continue auditing data-only ADTs in `core/src/types/upstream` by semantic ownership, not by mechanically adding methods to every union.
5. Continue the runtime export inventory only along reachable upstream → CLI → manifest paths.

**Architecture rule:** raise knowledge into typed domain models; do not lower semantic decisions into scattered control flow.
