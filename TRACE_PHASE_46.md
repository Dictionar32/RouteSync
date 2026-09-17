# RouteSync Phase 46 — High-Level Expression Contract Boundary

## Goal
Raise controller runtime expressions from PHP syntax AST into a semantic ADT before they enter the controller action contract. The semantic contract must not carry raw PHP expression strings or token arrays.

## Flow
PHP source → tokenizer → Laravel AST → ControllerExpressionContract → ControllerActionContract → Route semantic contract → Manifest/IR → lowerers → emitter.

## Changes
- Added `ControllerExpressionContract` as the semantic ADT for controller expressions.
- `RuntimeReturnContract` now carries `ControllerExpressionContract`, not `PhpAstValue`.
- `resolveControllerActionContract()` resolves expressions exactly once at the upstream semantic boundary.
- Object/array expressions become explicit `object.properties[]` data.
- Unknown syntax becomes `{ kind: 'unknown' }`, not a raw expression payload.
- PHP AST remains syntax-level and may still contain `raw_expression`; it cannot cross into the semantic controller contract.
- `PhpArrayEntry.key` is now an `AstIdentifier`, preserving typed identity at the AST boundary.

## Ecommerce register
`return response()->json([success => true, message => string, data => null])` reaches the semantic layer as a structured object expression. No downstream action scanner needs to inspect PHP tokens or reconstruct the expression from source text.

## Remaining upstream work
The next boundary is resource/model expression resolution: replace semantic strings such as `target`, `property`, `argument`, and raw model-operation names with explicit expression ADTs (`VariableRef`, `PropertyPath`, `ModelQuery`, `ResourceInvocation`, etc.). Then remove the remaining raw-expression fallback from resource binders.
