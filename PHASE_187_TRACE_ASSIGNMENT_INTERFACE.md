# Phase 187 — Trace Scanner → Upstream Assignment Meaning

## Flow

ecommerce_shop → PHP scanner AST → ResourceScanner → upstream ClosureStatement → downstream semantic binding

## Trace finding

`PhpAssignmentTarget` already carried four meanings:

- variable
- variables
- property path
- array element

The upstream closure statement previously represented all of these as `Expression`. That forced downstream code to infer whether an expression was actually an assignment target.

## Repair

Reused the existing `types/upstream/assignment.ts` vocabulary instead of creating a parallel interface:

```text
AssignmentTarget
├── variable
├── variables
├── property(receiver, name)
└── index(receiver, key)
```

`ClosureStatement.assignment.target` and `ClosureForClause.assignment.target` now use `AssignmentTarget`.

The scanner bridge preserves property receiver paths rather than flattening them into a generic expression target.

## Additional loss repaired

`ClosureStatement.if.alternative` previously used `ClosureStatement[]`.
`none` therefore became `[]`, losing the distinction between no `else` and an explicit empty `else` block.

Upstream now carries:

```text
ClosureIfAlternative
├── none
├── else_block
└── else_if
```

## Switch/if rule

The remaining `switch`/`if` statements in the new bridge are syntax-boundary ADT elimination only. They translate closed scanner ADTs into already-defined upstream ADTs. They do not classify domain meaning for downstream consumers.

## Verification

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: only the pre-existing blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

A direct `tsx` runtime probe through `ResourceScanner.mapAstValueToUpstreamExpression()` timed out after 30 seconds, so runtime scanner execution is not claimed as passing.

## Current invariant

```text
scanner syntax meaning
        ↓
upstream ADT carries the meaning
        ↓
downstream consumes meaning
        ↓
no downstream target re-classification
```
