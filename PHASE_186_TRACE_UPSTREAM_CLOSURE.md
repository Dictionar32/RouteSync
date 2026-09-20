# Phase 186 — Trace Upstream Closure/Statement Interface

## Trace

ecommerce_shop → LaravelSourceLexer → PhpAstStatement → ResourceScanner → upstream Expression/Closure ADT → ResourceAst/domain.

## Finding

`resourceUpstreamExpressionCanonical.ts` was already the scanner bridge, but `for_statement` and `try_statement` were being lowered to an ordinary expression. `for` lost initializer/condition/update/body; `try` lost catches/finally/body and became an unsupported expression. This violated the invariant that syntax meaning must be carried upstream.

A second loss existed in property assignment targets: only the root and terminal property were retained, dropping intermediate property-path steps.

## Repair

The upstream closure vocabulary now explicitly contains:

- `ClosureForClause`: `empty | expression | assignment`
- `ClosureCatchClause`
- `ClosureFinallyClause`: `absent | present`
- `ClosureStatement.for` with initializer/condition/update/body
- `ClosureStatement.try` with body/catches/finally

The scanner bridge now maps these structures losslessly through the existing `matchPhpStatement` algebra. Property assignment targets preserve the complete `PhpPropertyPath` chain.

## Result

```text
PHP statement
  ↓
PhpStatement ADT
  ↓
matchPhpStatement
  ↓
ClosureStatement ADT
  ├── for
  │   ├── initializer
  │   ├── condition
  │   ├── update
  │   └── body
  └── try
      ├── body
      ├── catches
      └── finally
  ↓
upstream Expression
```

No downstream classification is required to reconstruct these meanings.

## Verification

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reports only the pre-existing environment blocker:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by this phase.
