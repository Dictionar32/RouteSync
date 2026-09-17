# Phase 100: ecommerce_shop Source -> AST ADT Trace

## Ground truth

The source of truth for this phase is the Laravel project from the Library archive:
`ecommerce_shop-main (8).zip`.

Local materialized source used for inspection:
`/mnt/data/ecommerce_shop/src/ecommerce_shop-main`

The generated `routesync.manifest.json` is deliberately not used as AST truth. It is downstream derived data and may contain fallback mappings that contradict the PHP source.

## Source inventory

- 50 PHP files under `app/` and `routes/` were inspected.
- 35 API routes are present in `routes/api.php`.
- Source constructs observed include nullsafe access, null coalescing, short ternary, array offsets, casts, function calls, binary/unary operations, and `match` expressions.
- Approximate source occurrence counts from the Laravel tree: `?->` 42, `??` 253, `?:` 15, array-access patterns 27, `match (` 5, explicit casts 48.

## Interface corrections

### Before

- `TokenDescriptor.line`, `startOffset`, `endOffset` were plain numbers.
- `PhpArrayEntry` used `key` plus optional `keyExpression`.
- `PhpStatement.expression` was optional.
- `PhpAstValue` collapsed several real Laravel constructs into `unsupported`.

### After

The scanner vocabulary now has explicit variants for:

- `array_access`
- `function_call`
- `short_ternary`
- `null_coalesce`
- `binary_expression`
- `unary_expression`
- `cast_expression`
- `match_expression`
- `return_with_value` / `return_void`
- keyed vs positional array entries
- string/integer/expression array keys

Source coordinates use nominal `SourceOffset` and `SourceLineNumber` values.

## Data-flow invariant

`Laravel Source -> Lexer Token ADT -> Expression AST ADT -> Statement AST ADT -> Semantic Resolver`

The AST must preserve the source construct instead of converting a known Laravel construct to a generic string or semantic fallback.

## Important remaining boundary

The scanner still has an explicit `unsupported` variant for constructs not yet modeled. That is a syntactic boundary, not a license for downstream re-classification. The next hardening pass should remove `unsupported` occurrences for any construct found in `ecommerce_shop` and expand the ADT only from observed source vocabulary.
