# Phase 2744 — Fully Typed AST/ADT Runtime Operation

## Scope

This phase continues the interface-first migration after the `subscanners/` directory was erased in Phase 2742. It migrates the route-handler constructor in `packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionTypes.ts` and removes this operation's direct dependency on the empty `semantic/relations/` directory.

## Source changes

- `buildRouteHandler` is now an internal `buildRouteHandlerImplementation`.
- The public runtime API is `controllerActionTypeOperations: ControllerActionTypeOperationsInterface = Object.freeze({...})`.
- `controllerActionDescriptor.ts` uses `controllerActionTypeOperations.buildRouteHandler(...)` in both descriptor construction paths.
- `routeDeclarationComposition.ts` uses the same operation object for route declaration composition.
- The old `relationGate(relationEqual(...))` expression is replaced with an explicit equality branch on the action-name discriminant. The two output ADT variants are preserved: `InvokableController` for `__invoke` and `ControllerAction` for named methods.
- A focused test covers both branches.

## Runtime trace

```text
CLI scan / sync
  -> shared manifestScanOperation.scan(...)
  -> upstream manifest composition
  -> routeDeclarationComposition / controller action descriptor
  -> controllerActionTypeOperations.buildRouteHandler(...)
  -> RouteHandlerDescriptor ADT
  -> manifest builder complete | blocked
  -> manifest projection
```

This phase changes one route-handler construction operation; it does not replace the manifest authority or alter the CLI's shared scan operation.

## Audit

Command:

```bash
npm run audit:phase2744-controller-action-type-runtime-operation
```

Result: **14/14 static checks passed**. Checks include operation interface typing, frozen operation object, production caller migration, both ADT branches, no local `semantic/relations` imports in the changed runtime module, no `subscanners/` directory, both semantic directories empty, and the CLI shared manifest operation and manifest complete/blocked variants remaining present.

Syntax-only transpilation passed for all four changed TypeScript files; `node --check` passed for the audit script.

## Important unresolved debt

The semantic directories are intentionally empty and no replacement wrapper/foundation was created. The repository still has **598 import/reference lines across 316 TypeScript files** mentioning `semantic/relations` or `semantic/foundation`. Those references are not fixed by this phase. Consequently, this phase does **not** claim that full project typecheck, unit tests, build, or CLI end-to-end succeeds. `node_modules` is unavailable in this workspace, so those validations were not run.

There are still **35 exported free-function declarations** under `packages/core/src/compiler/scanner`; this phase migrates one of them, not the whole scanner API surface. The next work should continue from actual production callsites and remove remaining relation dependencies by ownership-specific migration, without repopulating the empty directories or introducing replacement abstractions.
