# Phase 164 — Trace AST/ADT Interface

## Target

Raise pagination/window/grouping/conditional query inputs into semantic operation contracts so mutation handlers no longer infer validity directly from raw argument positions.

## Trace

The previous mutation handlers still received `ResourceExpressionModel[]` and independently performed:

- `argumentAt(args, 0)` for pagination/window
- `argumentAt(args, 0)` + `argumentAt(args, 1)` for conditional
- literal decoding for grouping
- direct `undefined` checks to decide operation validity

That meant the operation meaning was still reconstructed inside each handler.

## Repair

The existing canonical query operation model in `resourceQueryOperation.ts` was elevated with operation-specific argument ADTs:

```text
ResourcePaginationArguments
ResourceWindowArguments
ResourceGroupingArguments
ResourceConditionalArguments
```

Their meanings are explicit:

```text
pagination
  framework_default | explicit(value)

window
  value(expression) | invalid

grouping
  properties(PropertyName[]) | invalid

conditional
  condition_callback(condition, callback) | invalid
```

The resolver now has one semantic adapter per operation:

```text
raw expression arguments
        ↓
operation argument adapter (boundary)
        ↓
operation-specific semantic ADT
        ↓
mutation handler
        ↓
ResourceResolvedQueryOperation
```

The handlers no longer decide what `argumentAt(args, 0)` means for these four operations. They consume the operation-specific semantic contract.

## Result

The important invariant is now:

```text
raw arguments may be incomplete
        ↓
boundary resolves their meaning once
        ↓
handler receives semantic operation input
```

No parallel scanner interface was introduced; the existing `resourceQueryOperation.ts` domain vocabulary was enriched.

The remaining conditional expressions in the boundary adapters are structural ADT construction. They do not perform downstream re-classification. The next step can replace even those with the existing ADT matcher style if the goal is zero conditional syntax in the semantic resolver itself.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reports only the pre-existing environment blocker:

```text
packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.
```

No new TypeScript errors were introduced by Phase 164.

## Next trace target

The next remaining semantic reconstruction is the shared `ArgumentSlot` / `argumentAt()` path used by filter, relation filter/load, ordering, and projection. The operation-specific ADTs now provide the pattern for elevating those inputs too.
