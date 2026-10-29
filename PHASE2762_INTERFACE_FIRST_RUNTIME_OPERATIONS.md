# Phase 2762 — Interface-first runtime operations

## Runtime trace retained

`CLI entrypoint / routeSyncCliProgram` → upstream CLI composition and controller invocation inventory → upstream manifest builder → AST blocker or source-model blocker ADT → manifest validation → serialization → persistence → CLI result.

The CLI/scanner runtime functions in scope remain callable to preserve existing import/call-site contracts. Their exported function declarations were replaced with explicit exported call-signature interfaces and frozen `export const` operation values. Generator functions remain generator-function expressions so their `Iterable<T>` behavior is unchanged; the async pipeline remains async. This removes declaration-style `export function` APIs without changing callers to object-method invocation.

## Interface usage example

```ts
export interface ResolveRouteKeyOperation {
  (routePath: string): string;
}

export const resolveRouteKey: ResolveRouteKeyOperation = Object.freeze(
  (routePath: string): string => {
    // Existing route-key lowering body.
    return routePath;
  },
);

const key: string = resolveRouteKey('/users/{id}');
```

For a generator operation, the interface still states the observable output contract:

```ts
export interface LowerQueryKeySourceOperation {
  (graph: ClassifiedDomainGraph<ClassifiedRoute>): Iterable<string>;
}
```

## ADT and ownership invariants

- Manifest-builder blocker outcomes retain distinct `manifest_builder_source_ast_blocked` and `manifest_builder_source_model_blocked` discriminators.
- Runtime operation boundaries expose parameter and output contracts through interfaces; callers continue to invoke them as functions.
- `Object.freeze` prevents replacing runtime operation properties and keeps the exported operation value immutable.
- This migration does not claim the entire repository has no `export function`; the zero-declaration audit is scoped to `packages/cli/src` and `packages/core/src/compiler/scanner`.

## Verification

Run `npm run audit:phase2762-interface-first-runtime-operations` and `npm run audit:phase2761-runtime-export-inventory`. These checks parse TypeScript ASTs and verify scope-level export/interface invariants. A full semantic TypeScript check, unit suite, package build, and CLI end-to-end run are separate verification gates and must not be inferred from these structural audits.
