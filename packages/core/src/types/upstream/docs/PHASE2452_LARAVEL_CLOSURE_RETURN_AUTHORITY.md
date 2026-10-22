# RouteSync Phase2452 — Laravel Closure-Return Authority

## Scope

This phase replaces the active route scanner's direct closure-return delegation to `controllerAstCanonical.ts` with an implementation in `compiler/semantic/controllerReturnSemanticProductionAuthority.ts`. It reuses the existing `ControllerReturnSemanticProductionInterface<readonly PhpAstValue[]>` and emits the existing `ControllerReturnSemantic` ADT. No duplicate upstream interface was introduced.

## Changes

- Added a source-evidence semantic producer for route closure return values.
- Preserved the existing response forms handled by the closure producer: response JSON/JSONP/no-content/file/stream/view forms, redirects, string literals, nested arrays, and nested `DB::transaction` closure returns.
- The producer consumes typed PHP AST and uses the existing expression projection boundary.
- `laravelRouteScanner.ts` now injects `controllerReturnSemanticProductionAuthority` directly. It no longer imports `controllerReturnSemanticFromValues`, `ControllerReturnSemanticProductionInput`, or the legacy `controllerAstCanonical` subscanner.
- The runtime-local `routeClosureReturnSemanticProduction` const object/arrow adapter has been removed. The scanner factory was also converted from a const-bound arrow function to a function declaration.
- A no-return closure now produces the explicit `absent` ADT variant rather than constructing a branch judgment with a missing first expression.

## Verification

Run:

```bash
node scripts/audits/audit-phase2452-laravel-closure-return-authority.cjs
```

The scoped audit checks the producer contract wiring and direct legacy-import removal. It deliberately reports unresolved architecture debts separately.

## Explicitly not claimed complete

- The expression projection used by the producer still has a transitive `semantic/relations` dependency.
- `resourceModelBindingAuthority.ts`, `semanticRewriteAuthority.ts`, and `semanticRewriteInterface.ts` still depend on `semantic/relations`.
- Full removal of `semantic/foundation`, `semantic/relations`, and all `subscanners` has not been established.
- Full typecheck, package build, Vitest, and CLI end-to-end tests were not run in this artifact environment.

The next root-cause task is to migrate the expression-projection operation and the resource-model fixed-point solver to their correct upstream-owned contracts/implementations, then verify the entire transitive import graph before deleting legacy directories.


## Phase2453 follow-up: prepared executor boundary

The active Laravel route scanner now performs source acquisition, route declaration parsing, semantic judgment composition, and route outcome construction during asynchronous `prepare(input)`. The returned `LaravelRouteScanOperationInterface` captures the completed outcome; `execute()` takes no parameters and only returns that outcome. The public contract version is 35 and prepared operation version is 2. This closes the route operation's execution boundary, but does not claim global removal of `semantic/relations`, `semantic/foundation`, or all `scanner/subscanners` imports. Those remain separate transitive migration debts.
