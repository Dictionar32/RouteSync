# Phase 147 — Trace AST → ADT → Interface: Closure Statement Meaning

## Boundary

ecommerce_shop → PHP AST → ResourceFieldExpression ADT → ResourceExpressionModel → downstream

## Trace finding

Phase 146 preserved `closure` and `arrow_function`, but `ClosureResourceExpression.body` still used `ResourceExpressionModel[]`.
The old mapper converted closure statements into expressions, which erased statement intent:

- `return_with_value` became only its expression.
- `assignment` became only its assigned value.
- `throw_statement` became only its thrown expression.
- control-flow statements were rejected instead of being represented.

That is semantic information loss at the AST → ADT boundary.

## Interface elevation

The existing canonical `ResourceFieldExpression` model was elevated again; no parallel scanner-shaped model was introduced.

`ClosureResourceExpression.body` now carries `ResourceClosureStatement[]`.

The semantic statement ADT preserves:

- expression statement
- return with value
- return void
- assignment
- if / else-if / else
- foreach
- for
- try / catch / finally
- throw

Assignment targets also carry semantic forms:

- variable
- property path
- array element

## Mapper repair

`resourceAstExpressionMapper.ts` no longer contains `mapStatementExpressions`.

Closure statements are mapped through the existing AST algebra boundary `matchPhpStatement`, so the downstream Resource ADT receives statement meaning directly.

No statement is silently converted into an expression to recover its meaning later.

## Result

Before:

source → AST statement → expression → downstream re-interpretation

After:

source → AST statement → ResourceClosureStatement ADT → downstream consumes statement meaning

The only `switch` remains inside the centralized AST catamorphism `matchPhpStatement`; it is syntax dispatch at the origin boundary, not downstream semantic re-classification.

## Validation

Command:

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: only the pre-existing environment blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript error was reported by this phase.

## Trace conclusion

The closure interface now carries statement-level meaning. Downstream does not need a ternary/if/switch to determine whether a closure node represents a return, assignment, control-flow branch, loop, exception, or expression statement.
