# Phase2454 — Laravel Route Scanner Dependency Ownership Correction

## Scope

This phase makes a concrete upstream contract correction on the active Laravel route-scanner path. It does not claim that the full `semantic/relations`, `semantic/foundation`, or `subscanners` retirement is complete.

## Changes applied

1. `LaravelRouteScannerAuthorityInterface` now owns `bindingAuthority: RouteControllerBindingJudgmentAuthority` as a stable scanner dependency.
2. `LaravelRouteScanInput` now contains only per-operation data: `controllerScan` and `sourceSelectionIntent`. It no longer accepts an authority object as if it were source input.
3. `createLaravelRouteScanner()` binds and uses `authorities.bindingAuthority` for route-controller binding judgment.
4. The canonical singleton retains the requested form:

   ```ts
   export const laravelRouteScanner: LaravelRouteScannerInterface = createLaravelRouteScanner({
     bindingAuthority: routeControllerBindingAuthority,
     // other upstream authorities
   });
   ```

5. `LaravelSourceAstPipeline` now passes operation data only to `routeScanner.prepare(...)`; its dependency contract no longer redundantly carries `routeBindingAuthority`.
6. The route scanner contract version was advanced from 35 to 36. The prepared-operation version remains 2 because its `execute()` shape did not change.
7. The existing dependency-closure test now verifies that the canonical scanner singleton owns the canonical binding authority.
8. Added `audit:phase2454-laravel-route-dependency-closure` and an 11-assertion audit.

## Verified results

- `audit-phase2454-laravel-route-dependency-closure.cjs`: 11/11 PASS.
- `audit-phase2453-laravel-prepared-executor.cjs`: 9/9 PASS.
- `audit-phase2447-route-scanner-prepared-operation.cjs`: 11/11 PASS after updating it for contract version 36 and the corrected input shape.
- `audit-phase2451-laravel-route-producer-boundary.cjs`: 6/6 PASS.
- `audit-phase2452-laravel-closure-return-authority.cjs`: 7/7 scoped assertions PASS; it still reports 3 open architecture debts.
- `node --check` passed for the new audit script; `package.json` parsed successfully.

Some historical audit scripts encode older repository states and remain stale or fail on unrelated historical assumptions. They are not reported as passes. The Phase2454 audit is the authoritative check for this change.

## Remaining architecture debt — explicitly open

### `semantic/relations`

The active expression-projection implementation `packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionSemanticAuthority.ts` still directly imports `semantic/relations`. The closure-return producer calls this projection, so the dependency is transitive into the Laravel route path. `resourceModelBindingAuthority.ts`, `semanticRewriteAuthority.ts`, and other consumers also retain relation imports. This phase does not remove them.

### `semantic/foundation`

The route scanner and its immediate composition contract have no direct `semantic/foundation` import. This is not proof that the entire repository or all transitive paths are foundation-free. A repository-wide import-graph audit remains necessary; no new foundation dependency was introduced.

### `subscanners`

The route scanner itself has no direct `subscanners` import, but the controller scanner still imports `controllerPolicyInventoryFromDeclaration` from `scanner/subscanners/controller/controllerAstCanonical.ts`. Other source-AST pipeline components also consume legacy subscanner implementations. Whole-path retirement remains open.

### Preparation boundary

`prepare()` still performs file existence checks, source reads, route parsing, evidence construction, and orchestration of multiple authorities. `execute()` is parameterless and only returns the prepared outcome, but the source-observation/parser operation ownership is not yet fully extracted into existing upstream contracts. Do not describe the whole scanner as semantically thin yet.

## Technical references

- TypeScript Handbook — Interfaces: https://www.typescriptlang.org/docs/handbook/interfaces.html
- TypeScript Handbook — Unions and Intersection Types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- LLVM — Implementing a Parser and AST: https://releases.llvm.org/18.1.6/docs/tutorial/MyFirstLanguageFrontend/LangImpl02.html

These sources support the general contract/ADT/compiler-stage principles; they do not constitute evidence that RouteSync itself is compliant.

## Verification limits

No full TypeScript typecheck, package build, Vitest run, or CLI end-to-end test was performed. `npm run build` was not run. The available verification is static source auditing and JavaScript syntax/config validation only.
