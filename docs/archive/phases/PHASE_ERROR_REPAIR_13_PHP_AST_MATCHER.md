# Phase Error Repair 13 — PHP AST Matcher

## Root
`packages/core/src/types/domain/phpAst/kinds.ts`

## Trace
`PhpAstKind` → `PHP_AST_KIND_REGISTRY` → `PhpAstKindVisitor<R>` → `matchPhpAstKind()`.

The ADT and registry were complete, but `matchPhpAstKind()` accepted `PhpAstKind` as a union. TypeScript therefore saw `visitor[kind]` as a union of functions whose parameter types intersected to `never`.

This was a type-correlation problem, not missing PHP AST data.

## Repair
Changed matcher to a correlated generic:

```ts
export function matchPhpAstKind<R, K extends PhpAstKind>(
  kind: K,
  visitor: PhpAstKindVisitor<R>,
): R {
  return visitor[kind](PHP_AST_KIND_REGISTRY[kind]);
}
```

No fallback, no new AST kind, no string reclassification, no runtime switch, and no cast at the public dispatch boundary.

## Verification
`tsc -p tsconfig.phase87.33.narrow.json --noEmit --pretty false` no longer reports the `phpAst/kinds.ts` diagnostic.

Remaining diagnostics are outside Root 13:
- `compiler/utils/Hash.ts` — Node `crypto` type environment
- `routeHandlers.ts` — `FormRequestDescriptor` / `ClassName` boundary
- `semantic/index.ts` — stale `TraceNode` export
- `semanticTypes.ts` — `PropertyName` still passed to string APIs

## Status
Root 13 closed. Next upstream semantic root: `routeHandlers.ts` / `FormRequestDescriptor`.
