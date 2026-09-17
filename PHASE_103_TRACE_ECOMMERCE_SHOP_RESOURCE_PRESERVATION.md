# Phase 103 - ecommerce_shop Resource Semantic Preservation

## Ground truth

Fixture: Library Laravel project `ecommerce_shop-main (7).zip`.
Generated manifests are not used as syntax truth.

## Source observations

The Laravel source archive contains 50 PHP files under `app`/`routes`. Observed constructs include:

| Construct | Observed |
|---|---:|
| Nullsafe `?->` | 42 |
| Null coalesce `??` | 62 |
| Short ternary `?:` | 15 |
| `match (...)` | 6 |
| Array access | 27 |
| Explicit casts | 48 |
| Assignment occurrences | 229 |
| `if` | 93 |
| `foreach` | 3 |
| `for` | 3 |
| `try` | 1 |
| `catch` | 1 |

## Information-loss trace before repair

Known scanner variants reached the resource mapper and were collapsed to `unsupported_syntax`:

- array access
- function call
- short ternary
- null coalesce
- binary expression
- cast
- ternary

Nullsafe/direct access also used a boolean state instead of an ADT.

## Repairs

### Scanner AST

- `PhpAccessMode = direct | nullsafe`
- `PhpBinaryOperator` is a closed object ADT.
- `PhpUnaryOperator` is a closed object ADT.
- `PhpCastType` is a closed object ADT.
- array access classification uses an outer-bracket scan instead of treating `[` as a top-level operator.
- parenthesized expressions are unwrapped when the parentheses enclose the complete expression.
- explicit casts are classified before generic compound expressions.

### Resource semantic expression

The domain `ResourceFieldExpression` now explicitly carries:

- array access
- function call
- ternary
- short ternary
- null coalesce
- existing binary/cast/method/property forms

The resource mapper now preserves these forms instead of replacing known syntax with `unsupported_syntax`.

### Consumer repair

Consumers of the changed scanner access field were updated from `nullsafe: boolean` to `access.kind`.

## Verification

A focused TypeScript check over the changed scanner AST, controller semantic contract, resource expression mapper, and resource expression domain completed without errors from those touched files.

Full repository type-check still contains unrelated legacy errors in other domain modules. Those errors are not counted as Phase 103 regressions.

## Remaining boundary

The next information-loss boundary is statement/dataflow resolution:

```text
assignment
  -> variable binding
  -> later variable reference
  -> expression semantic resolution
```

Control-flow statements (`if`, `foreach`, `for`, `try/catch`) still require an explicit dataflow representation where they influence bindings or returned response shape.

## Phase exit rule

A known `ecommerce_shop` expression may have unresolved semantic type, but its syntax must remain represented by an explicit domain ADT. `unsupported` is reserved for genuinely unimplemented syntax.
