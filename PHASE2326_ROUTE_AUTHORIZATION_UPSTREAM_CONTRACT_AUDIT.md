# Phase 2326 — Route Authorization Upstream Contract Audit

## Existing contracts reused

- `types/upstream/routeAuthorizationSemanticJudgmentInterface.ts` remains the canonical closed judgment and authority contract.
- `types/upstream/laravelRouteScannerInterface.ts` remains the scanner wiring contract (contract version 8).
- No duplicate interface, V2 authority, or generic wrapper was added.

## Changes in this phase

1. The existing authorization evidence authority now recognizes Laravel's documented built-in authentication aliases `auth`, `auth.basic`, and `auth.session`, plus their corresponding built-in middleware class names.
2. Recognition is exact for built-in aliases/classes and delimiter-aware for `auth:<guard>` names. Prefix lookalikes such as `authorization`, `authenticated`, and `authorizer` remain excluded.
3. Removed imports from `semantic/relations` in `routeMiddlewareKnowledgeCatalog.ts`; scope applicability and evidence selection in this authority module use the already-typed upstream values directly.
4. Extended the existing Phase 2325 regression test with the built-in aliases/class names. No new test suite or duplicate authority was introduced.

## Trace findings not falsely marked as solved

- `laravelRouteScanner.ts` still projects the authorization judgment to a boolean `isAuth` before route emission. This loses the richer judgment at the route emission boundary and remains a follow-up defect.
- The current scanner invocation judges middleware names collected from route declaration flow. The existing `RouteMiddlewareSemanticInput` / `resolveRouteMiddlewareFlow` contracts model scoped exclusions and controller middleware, but this scanner path does not yet prove that the effective, action-correlated middleware flow is what feeds the authorization judgment.
- Custom alias/group expansion depends on source application configuration and is not inferred by this phase.
- The current judgment names say “authorization” while the recognized evidence here is specifically authentication middleware. This vocabulary mismatch should be evolved through the existing upstream contract after downstream consumers are traced; it is not silently renamed in this phase.

## Validation

- Static checks verify the authorization authority file no longer imports `semantic/relations` and that exact built-in alias cases are present in the regression test.
- Vitest and TypeScript build were not run: the provided archive has no installed `node_modules`. No build/test pass is claimed.

## External semantics checked

Laravel documentation distinguishes built-in authentication aliases, custom aliases, middleware groups, and controller middleware. See Laravel middleware documentation and controller middleware documentation linked in the completion note.
