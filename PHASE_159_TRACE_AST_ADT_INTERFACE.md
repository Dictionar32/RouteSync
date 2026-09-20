# Phase 159 — Trace AST → ADT → Interface → Query Meaning

## Trace

`ResourceModelMethodResolverOperation.comparisonOperator()` was translating raw query operator lexemes with a `switch`. This made the resolver itself responsible for syntax-to-meaning classification.

## Semantic loss / architectural issue

The domain already has `ResourceQueryComparisonOperator`, but the resolver re-derived that vocabulary from raw strings in the middle of operation construction.

## Repair

Introduced a typed comparison-operator vocabulary and canonical registry:

`raw operator lexeme → comparisonOperators → ResourceQueryComparisonOperator`

Supported lexemes:

- `=` / `==` → `equal`
- `!=` / `<>` → `not_equal`
- `<` → `less_than`
- `<=` → `less_than_or_equal`
- `>` → `greater_than`
- `>=` → `greater_than_or_equal`
- `like` → `like`
- `not like` → `not_like`
- `in` → `in`
- `not in` → `not_in`

The resolver no longer contains a `switch` for operator meaning.

## Result

The query predicate now receives an already-defined semantic operator from the canonical operator vocabulary rather than reconstructing it with a branching classifier.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` still reports only the pre-existing environment blocker:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 159.

## Next trace target

`predicateFromArguments()` still derives operand position with `args.length >= 3 ? 2 : 1`, and several operation handlers still encode argument presence through ternary/if chains. The next elevation should make the predicate argument contract itself semantic, so the resolver consumes `property + operator + operand` without inferring operand position from raw array length.
