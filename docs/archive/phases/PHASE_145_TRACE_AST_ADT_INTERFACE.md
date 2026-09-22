# Phase 145 — AST → ADT Interface Trace

## Boundary

ecommerce_shop → PHP scanner AST (`PhpAstValue`) → existing `ResourceFieldExpression` ADT → `ResourceExpressionModel` → semantic/downstream consumers

## Trace finding

The scanner already represented `unary_expression`, `match_expression`, `class_reference`, `construct`, and `instance_of`, but `resourceAstExpressionMapper.ts` converted all five into `unsupported_syntax`. This was semantic information loss at the scanner-to-domain boundary.

## Repair

The existing canonical `ResourceFieldExpression` vocabulary was elevated. No parallel expression interface was created. Added semantic variants to the existing ADT:

- `unary_expression` with `ResourceUnaryOperator` and operand
- `match_expression` with typed match arms and subject
- `class_reference` with `ClassName`
- `construct` with `ClassName` and arguments
- `instance_of` with expression and `ClassName`

`ResourceExpressionBindingRequirement` was elevated at the same boundary so binding requirements carry the same meaning instead of reconstructing it later.

## Result

The mapper now preserves these constructs as domain meaning. Downstream can dispatch on an already-semantic ADT instead of interpreting raw PHP syntax. The centralized `matchResourceFieldExpression` remains the only runtime discriminator for this ADT.

## Remaining gap

Regular PHP closures still have a statement block (`PhpBlock`) and arrow functions have their own closure semantics. They remain rejected because the existing resource expression domain has no canonical closure-body statement vocabulary. The next elevation should reuse/elevate an existing domain statement model rather than leaking `PhpBlock` or creating a parallel scanner-shaped interface.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reaches the pre-existing environment blocker:

`packages/core/src/compiler/utils/Hash.ts: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript error was introduced by this phase.
