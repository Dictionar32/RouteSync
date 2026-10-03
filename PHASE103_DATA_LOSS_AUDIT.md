# Phase 103 — Data-Loss Audit: Syntax Navigation / Free Data Preservation

## Result

The active route-AST traversal boundary has been raised from positional token arithmetic into `TokenCursor` relations. Parser grammar still uses `if`/`while` where it expresses grammar recognition; those branches are not used as a storage location for syntax knowledge.

## Findings fixed

1. `callArgumentCursor` was semantically misnamed/positioned: it advanced to the call method rather than the first argument.
2. `secondCallArgumentCursor` returned the comma cursor instead of the token after the comma.
3. Route-resource parsing contained repeated `advance().advance()` chains for call arguments and fluent traversal.
4. Active route-AST helpers contained direct `tokens[index + N]` navigation and were converted to `TokenCursor` relations.
5. Route controller action extraction now obtains the second argument through `secondCallArgumentCursor` instead of ordinal offsets.

## Free-data invariants

- Unknown values are not converted into control-flow branches.
- Optional syntax is represented as `undefined`/presence at the boundary.
- Token identity is carried by the cursor and token relations, not by ordinal indexes.
- String/literal payloads remain intact; navigation does not normalize or discard them.
- A missing second argument remains absent rather than being replaced by the comma or an invented token.

## Model boundary

`TokenCursor` owns traversal facts such as `current`, `previous`, `next`, `afterNext`, `callOpen`, `callArgument`, `secondCallArgument`, and their cursor relations. The parser may still use control flow to recognize grammar and construct AST facts.

This follows the observed Laravel architecture boundary: route syntax expresses methods, URI parameters, constraints, groups, bindings, and resource declarations; Laravel's semantic behavior such as model binding and route-group behavior is represented downstream as domain facts rather than encoded into token traversal. Laravel's current routing documentation describes these semantics explicitly. See the cited Laravel routing documentation in the audit discussion.

## Remaining scope

Other PHP scanner modules outside the route-AST boundary still contain raw token-index arithmetic (for example controller-method and generic AST classification code). Those are separate migration surfaces and should be moved into the same syntax-navigation model family rather than mechanically deleting their control flow.

## Validation

A dedicated Phase 103 regression test covers:

- first and second call arguments;
- controller action extraction from `[Controller::class, 'action']`;
- resource fluent metadata preservation.

The repository dependency installation was incomplete in the execution environment, so the full TypeScript/Vitest suite could not be executed. Static audit was completed after the changes.
