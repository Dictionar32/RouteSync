# Phase 2619 — CLI / Manifest / Upstream Interface Evolution

## Scope

This phase continues from Phase 2618 by removing the route declaration parser's direct dependency on the generic relational sequence barrel, formalizing the route-constraint ADT elimination operation using the existing upstream owner, and exposing the canonical operation through the public Core entrypoint.

## Root cause

`routeDeclarationParser.ts` used `projectRelation`, `selectRelation`, and `expandRelation` from `compiler/relational/sequence` for ordinary parser-local projection/filter/flattening. That barrel itself imports `semantic/relations/relationalSequence`, unnecessarily coupling these parser operations to the semantic relation implementation.

The route constraint ADT already had an exhaustive `matchRouteConstraintArgument` function, but consumers did not depend on a named interface-bound operation. This phase adds `RouteConstraintArgumentAlgebraInterface` and the canonical value:

`export const routeConstraintArgumentAlgebra: RouteConstraintArgumentAlgebraInterface = Object.freeze({ match: matchRouteConstraintArgument })`.

The parser consumes `routeConstraintArgumentAlgebra.match(...)`. The existing ADT and exhaustiveness check remain authoritative; no duplicate ADT was introduced.

## Changes

- Removed the parser's import of `compiler/relational/sequence` and replaced parser-local projection/filter/flattening with the already-used syntax-range results and array transformations.
- Follow-up source correction: removed `syntaxRange.ts`'s direct imports of both `semantic/relations/semanticRelations` and `compiler/relational/sequence`. Range traversal, filtering, presence projection, and string-pair projection now use syntax-navigation-local operations. `findPresence` also now returns the explicit `Presence<TokenCursor>` result rather than forwarding an indexed cursor value.
- Added `RouteConstraintArgumentAlgebraInterface` and `routeConstraintArgumentAlgebra` in `core/src/types/upstream/routeConstraints.ts`.
- Exported the canonical operation and related types through `packages/core/src/index.ts`.
- Updated the Phase 2618 audit to recognize the interface-first operation.
- Added `scripts/audits/audit-phase2619-cli-manifest-upstream-interface-evolution.cjs` and its package script.

## Validation

Phase 2619 structural audit: 10/10.

The audit verifies that `syntaxRange.ts` has no direct imports from `semantic/relations` or `compiler/relational/sequence`. The full parser path is still not free of `semantic/relations`: `semanticRouteSyntaxRelations.ts` imports relation helpers directly. Phase 2619 therefore closes the syntax-navigation dependency edges, not the entire transitive CLI/Core boundary.

The structural audit passes 10/10, and the audit script passes `node --check`. Full TypeScript typecheck, package build, Vitest, and Laravel end-to-end execution have not been run in this workspace.

## Laravel domain relevance

Laravel supports route declarations targeting `[Controller::class, 'method']`, invokable controllers, and resource declarations that expand into multiple actions. Route parsing must preserve syntax evidence and route identity before downstream semantic judgment; parser-local sequence transforms should not silently become the semantic authority.

Reference: https://laravel.com/framework/docs/12.x/controllers
