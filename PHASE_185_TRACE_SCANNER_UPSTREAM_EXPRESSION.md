# Phase 185 — Scanner → Upstream Expression ADT

## Trace
`ecommerce_shop → LaravelSourceLexer → PhpAstValue → ResourceScanner → upstream Expression`

## Finding
The scanner-level PHP AST contains meanings that the older upstream `Expression` contract could not carry directly: null literals, modulo/positive/bitwise-not operators, short ternary, class references, arrow functions, keyed arrays, resource cardinality, and function-name vocabulary.

## Repair
Raised the upstream vocabulary and connected the scanner through `ResourceScanner.mapAstValueToUpstreamExpression()` and `resourceUpstreamExpressionCanonical.ts`.

The adapter is an **origin-boundary translation**. Its closed-source syntax elimination may use centralized matchers/switches; downstream consumers must not reconstruct these meanings from loose values.

## Important remaining trace
Closure statement bodies now have an explicit upstream `ClosureBody`/`ClosureStatement` vocabulary, but `for` and `try/catch/finally` still need dedicated upstream statement variants before that bridge can be called fully lossless. They are therefore the next upstream gap, not hidden as `undefined` or `null`.

## Invariant
```text
ecommerce_shop
  ↓
PHP scanner AST
  ↓
upstream Expression ADT
  ↓
semantic/domain binding
  ↓
manifest/domain graph
  ↓
downstream reads meaning
```

## Verification
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reports only the pre-existing `Hash.ts` / missing `crypto` type declaration blocker. No new TypeScript errors were introduced by this phase.
