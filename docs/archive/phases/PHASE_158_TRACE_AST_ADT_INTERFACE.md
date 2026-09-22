# Phase 158 — Trace AST → ADT → Interface → Query Operation

## Trace

The query-operation resolver still interpreted raw argument positions directly:

- `argumentAt(...)` returned `ResourceExpressionModel | undefined`.
- pagination used a non-null assertion (`!`) to recover an argument.
- operation dispatch used `switch (meaning.operation.kind)`.
- several operation branches mixed argument absence with operation meaning.

## Semantic gap

The interface did not distinguish an argument that is present from an argument that is structurally absent. That forced the operation resolver to reconstruct argument state repeatedly.

## Repair

### 1. Argument slot ADT

`resourceModelMethodResolverOperation.ts` now introduces:

- `present { value }`
- `missing { index }`

`argumentAt()` returns this semantic slot rather than exposing an optional expression directly.

### 2. Removed non-null assertion

Pagination now derives `ResourcePaginationSize` from the argument slot without `argumentAt(...)!`.

### 3. Mutation registry

`resolveResourceQueryOperation()` no longer switches over `meaning.operation.kind`.

A typed `mutationHandlers` registry contains one handler per closed mutation ADT variant.

The resolver uses the existing `matchResourceQueryMutation()` algebra to narrow the operation before selecting the typed handler.

### 4. Meaning remains SSOT

`ResourceQueryMutation` remains the domain vocabulary. No scanner-shaped interface was introduced.

## Result

Before:

```text
ResourceExpressionModel[]
  ↓
argumentAt() → optional
  ↓
if / ternary / !
  ↓
switch(operation.kind)
  ↓
ResourceResolvedQueryOperation
```

After:

```text
ResourceExpressionModel[]
  ↓
ArgumentSlot ADT
  ↓
typed mutation registry
  ↓
ResourceResolvedQueryOperation
```

The downstream resolver no longer needs a `switch` to recover mutation meaning and no longer uses a non-null assertion to recover required argument data.

## Validation

Command:

```text
npx tsc -p tsconfig.phase87.33.narrow.json --noEmit
```

Only the pre-existing environment blocker remains:

```text
packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.
```

No new TypeScript errors were introduced by Phase 158.

## Next trace target

`relationLoadTargets()` and `projectionFromArguments()` still decode raw expression shape into semantic query arguments. The next elevation should make relation-load and projection argument contracts explicit ADTs so downstream does not have to rediscover literal-vs-array/property meaning.
