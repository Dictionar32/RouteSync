# Phase 138 — Trace Interface AST ADT Repair

## Flow traced

`ecommerce_shop → PHP lexer AST → ControllerExpressionContract → downstream`

## Information-loss findings

1. `PhpClosureCapture` already distinguished `by_value` and `by_reference`, but `ControllerExpressionContract` collapsed both to `AstIdentifier[]`.
2. `resource_single` / `resource_collection` were collapsed to `{ collection: boolean }`, forcing downstream interpretation.
3. `property_access` / `method_chain` carried a semantic `receiver`, but the controller contract retained only a derived `ControllerPropertyPath`. The receiver is now preserved.
4. Lexer variants `construct` and `instance_of` existed in `PhpAstValue` but had no corresponding controller semantic variant. They are now explicit.
5. A dedicated exhaustive `ControllerExpressionVisitor` / `matchControllerExpression` boundary was added so consumers can consume semantic variants through the ADT instead of writing local `if` / ternary / `switch` classification.

## New invariant

The controller semantic boundary must preserve every meaning already known by the scanner. A boolean/nullable/fallback field must not encode a closed semantic distinction when an ADT variant can carry it directly.

## Resulting surface

- `resource_single` and `resource_collection` are separate variants.
- Closure capture mode remains explicit.
- Receiver expression remains explicit.
- `construct` and `instance_of` are explicit.
- `matchControllerExpression()` provides exhaustive downstream dispatch.

## Validation status

The repository checkpoint does not contain its normal dependency installation and its phase TypeScript configuration currently reports many pre-existing unrelated errors. Therefore full-project typecheck cannot be used as a clean regression signal in this checkpoint. The changed boundary was inspected for exhaustive lexer-to-controller coverage and the new ADT exports were wired through the request descriptor index.

## Next trace target

`ControllerExpressionContract → ControllerActionContract → SourceAst/Manifest`

The next repair should look specifically for any semantic boolean, optional field, string discriminator, or re-derived property path that still forces downstream classification.
