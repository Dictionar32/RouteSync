# Phase 193 — Trace whenLoaded Relation Argument Interface

## Trace

ecommerce_shop → PhpArgument[] → whenLoadedBinder → readRelationName → raw PhpAstValue checks

The previous boundary still leaked raw argument syntax into the binder. The binder had to know that the first argument must be a string literal and reconstruct a RelationName.

## Upstream repair

The scanner boundary now resolves the argument into the existing upstream `RelationName` vocabulary:

```text
PhpArgument[]
  ↓
readWhenLoadedRelation()
  ↓
Lookup<RelationName>
  ├── found → RelationName
  └── missing → invalid/missing argument meaning
```

`whenLoadedBinder` now consumes `Lookup<RelationName>` and does not inspect `PhpAstValue`, literal kinds, argument arrays, or strings.

## Interface elevation

No new semantic parallel model was introduced. Existing `RelationName` and `Lookup<T>` were reused.

The scanner performs syntax elimination through the existing `matchPhpAstValue` algebra. Literal dispatch is represented by a typed reader registry rather than consumer-side `if`/ternary/switch logic.

## Downstream result

Before:

```text
binder → argumentsAst[0] → literalType === string → value
```

After:

```text
binder → Lookup<RelationName>
```

The semantic binder receives the meaning directly.

## Verification

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Only the pre-existing blocker remains:

```text
packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.
```

No new TypeScript errors were introduced by this phase.
