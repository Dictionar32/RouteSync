# Phase2451 — Laravel Route Producer Boundary

## Scope

This change closes one specific hidden dependency boundary: `routeDeclarationEvidenceFromAst` no longer captures a module-local closure-return producer. The existing `ControllerReturnSemanticProductionInterface` is passed explicitly at the source-adapter call site, and the adapter is a function declaration rather than a `const` arrow function.

## Changed files

- `packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts`
- `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`
- `scripts/audits/audit-phase2451-laravel-route-producer-boundary.cjs`

## Verified architecture improvement

- Route declaration evidence conversion now requires an explicit `ControllerReturnSemanticProductionInterface` input.
- `routeDeclarationComposition.ts` no longer imports `controllerAstCanonical` directly.
- The route scanner passes the producer explicitly to the evidence adapter.
- `execute()` remains parameterless.

## Explicitly unresolved

This is not a complete subscanner retirement. `laravelRouteScanner.ts` still binds the producer to `controllerReturnSemanticFromValues` from `subscanners/controller/controllerAstCanonical`. The adapter still delegates semantic production to that legacy implementation. Moving this binding elsewhere would only hide the dependency, so it is intentionally reported as open.

The broader `semantic/relations` / `semantic/foundation` migration is also not complete. The resource-model binding authority still uses relation collection operators and the relation rewrite solver. This patch does not claim those dependencies can be deleted.

## Verification

Run:

```bash
node scripts/audits/audit-phase2451-laravel-route-producer-boundary.cjs
```

The audit passes only the explicit-boundary checks; it reports the legacy producer binding as a known open migration item. Full typecheck, build, Vitest, and CLI E2E were not run in this artifact environment.
