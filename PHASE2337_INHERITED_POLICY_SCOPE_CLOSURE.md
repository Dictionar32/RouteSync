# Phase 2337 — Inherited Controller Policy Scope Closure

## Objective

Correct the existing effective controller/action policy resolver so inherited controller policy is composed at the scope Laravel defines. This phase evolves the current resolver and `LaravelRouteScannerInterface`; it does not introduce a parallel interface or authority.

## Root cause

The Phase 2336 policy catalog is derived from controller actions. A controller can therefore appear in several catalog entries, and each entry may contain both class-scoped and method-scoped policy relations. The resolver previously flattened every relation for each inherited controller. That could leak an ancestor's method-only middleware/authorization into a child action with the same action name.

## Change

`packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts`

- Inherited policy retrieval still uses the existing `inheritedFrom` identity and `policyCatalog`.
- Before composition, inherited relations are restricted to `relation.scope.kind === 'class'`.
- The current action's own `policy` remains intact, so its method-scoped policy is not discarded.
- Existing `complete | blocked` ADT and authority ownership remain unchanged.

`packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.phase921.test.ts`

- Adds a regression with class-level `auth` and parent method-only `audit` for `store`.
- Resolving a child `store` action inherits `auth` but does not inherit `audit`.

`packages/core/src/types/upstream/laravelRouteScannerInterface.ts` and `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`

- Contract version advances from 12 to 13 to mark the changed semantics of inherited policy publication.

## Trace

`LaravelControllerScanArtifact.actions` → `ControllerActionFlowContract.policy` / `inheritedFrom` → route binding's resolved candidate action → existing `ControllerPolicyCatalogEntry[]` → `resolveEffectiveControllerActionPolicy` → `RouteSemanticFlow.controllerActionPolicy` → `LaravelRouteScanArtifact.flow` → `laravelSourceAstPipeline.routeFlows`.

No downstream policy is reclassified from route AST. The resolver uses the bound action's upstream evidence.

## Documentation check

Laravel's controller middleware API supports class-wide middleware as well as `only`/`except` method scopes; resource middleware can also be scoped to specific methods. Therefore parent class policy and parent method policy cannot safely be flattened into the same inherited set. See the official [Laravel 12 controller middleware documentation](https://laravel.com/framework/docs/12.x/controllers).

The existing discriminated-union design remains appropriate for the complete/blocked judgment; TypeScript documents discriminated unions as a way to carry distinct variant-specific meaning in the type. See the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html).

## Constraints preserved

- No `semantic/foundation` dependency added.
- No new `semantic/relations` dependency added to the resolver.
- No new interface, generic wrapper, or `V2` contract.
- No `subscanners/RouteScanner.ts` deletion claimed.
- CLI route and artifact wiring remain on the existing canonical scanner path.

## Verification

- Static audit: 11/11 assertions passed.
- Audit script syntax: passed (`node --check`).
- ZIP integrity: checked after packaging.
- Vitest: not run in this environment.
- TypeScript typecheck/build and CLI end-to-end: not run.
- `npm run build`: not run.

## Remaining work

- Trace whether every supported parent controller's class-level policy is present in the upstream policy catalog, including parents without a publishable action of their own.
- Trace the closed policy into manifest/security projection without recomputing it.
- Remove remaining `semantic/relations` usage from the broader scanner path only after migrating each consumer to its proper upstream owner.
- Audit the legacy route subscanner's complete caller/export graph before any retirement.
