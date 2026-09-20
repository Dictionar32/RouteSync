# Phase 163 — Trace AST/ADT Interface

## Target

Raise query ordering semantics so the resolver does not reconstruct `property` vs `raw` ordering using ternary/if/switch logic.

## Trace

Previous flow:

```text
ResourceExpressionModel[]
  -> propertyArgument()
  -> literal decoding
  -> ternary target selection
  -> ResourceQueryOrderingTarget
```

This duplicated the projection semantic already established in `projectionFromExpression()`.

## Repair

`ResourceQueryOrderingTargetResolution` was added as a closed domain result:

```text
resolved -> ResourceQueryOrderingTarget
invalid  -> explicit invalid meaning
```

`ResourceQueryProjection` is now the single semantic source for ordering target construction. The ordering resolver consumes it through `matchResourceQueryProjection()` instead of inspecting expression/literal syntax itself.

`matchResourceQueryOrderingTargetResolution()` centralizes ADT dispatch at the domain algebra boundary. The ordering mutation handler only consumes the resolved semantic target.

## Result

```text
expression
  -> ResourceQueryProjection
  -> ResourceQueryOrderingTargetResolution
  -> ResourceQueryOrderingTarget
  -> resolved ordering operation
```

The ordering consumer no longer uses the previous property/raw ternary classification.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reports only the existing environment blocker:

```text
packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.
```

No new TypeScript errors were introduced by Phase 163.

## Next trace target

The remaining query resolver fallbacks are concentrated around pagination/window/grouping/conditional argument presence. The next interface elevation should make those operation inputs explicit ADTs rather than letting mutation handlers infer validity from `undefined` or argument positions.
