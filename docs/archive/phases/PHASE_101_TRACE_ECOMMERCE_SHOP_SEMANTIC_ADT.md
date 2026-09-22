# Phase 101 - ecommerce_shop Semantic ADT Trace

## Ground truth

Laravel source: Library `ecommerce_shop-main`.
Generated manifests are not used as syntax truth.

## Repair

`ControllerExpressionContract` no longer collapses known PHP AST variants into `unknown`.

Preserved variants now include:

- array access
- function call
- short ternary
- null coalesce
- binary expression
- unary expression
- cast expression
- match expression
- closure
- arrow function
- arrays with positional/keyed/computed entries

Arguments use one representation: `PhpArgument[]`. The duplicate `arguments` + `argumentDescriptors` representation was removed.

Match arms use ADT variants:

- `conditional`
- `default`

rather than `isDefault: boolean`.

PHP `=>` is no longer classified as a binary operator.

Assignments were added to the statement ADT so variable-origin data can survive into dataflow resolution.

`ASTNodeData.kind` now uses `ASTNodeKind` instead of `string`.

## Boundary rule

Consumers that require a static string array key explicitly narrow `PhpArrayKey` at their boundary. They do not stringify or silently discard computed keys.

## Remaining work

The lexer still has a generic operator token vocabulary and must be converted to a closed operator ADT. The full statement parser must also be traced against assignments/control-flow used by `ecommerce_shop`.

## Required next trace

`Laravel source -> tokens -> AST variant -> semantic variant -> domain graph -> lowerer -> emitter`, with a count of every remaining `unsupported` and every semantic fallback.
