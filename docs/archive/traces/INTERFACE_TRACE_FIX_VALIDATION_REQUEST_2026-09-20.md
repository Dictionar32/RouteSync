# Interface Trace Fix — Validation Recursive Shape + Request Presence

## Boundary repaired

`Laravel validation -> ScannedRouteValidationRuleEntry -> RouteValidationRuleSet -> RequestField/ValidationFieldNode`

## Repairs

1. `ValidationFieldShape` construction now preserves the complete nested wildcard path.
2. `products.*.address.city` becomes `collection -> object(address) -> object(city)` instead of flattening to `city`.
3. `RouteValidationRuleSet` recursively merges sibling nested properties, so `address.city` and `address.zip` remain siblings under `address`.
4. Validation tree construction recursively mirrors the semantic shape instead of flattening every child to a scalar node.
5. `buildRequestTypeWithActions` no longer exposes `required?` / `nullable?`; it consumes the canonical `RequestFieldPresence` ADT.

## Remaining upstream work

- Request identity is still resolved by name normalization in `FormRequestScanner` and `actionValidationExtractor`.
- Collection parent presence can still be `unspecified` when the source contains only a wildcard child rule. This is an explicit absence-of-source-fact state and must not be guessed downstream.
- Full compiler type-check still has pre-existing errors in unrelated controller/resource/semantic files and missing Node typings in the checkpoint environment.

## Verification

Targeted `tsc` invocation was run against the repaired validation/request descriptor files. No diagnostic references the newly added recursive-shape functions or the new `RequestFieldPresence` field. Remaining diagnostics are pre-existing errors in imported project files.
