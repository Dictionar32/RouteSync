# Phase 149 — Trace AST → ADT → Interface Semantic Elevation

## Flow

`ecommerce_shop → PHP AST → AST algebra → domain ADT → downstream`

## Trace finding

Two semantic losses remained after Phase 148:

1. `ResourceExpressionBindingRequirement.closure.body` still used `ResourceExpressionModel[]`.
   This erased statement semantics that had already been preserved by `ResourceClosureStatement`.
2. `ModelAccessorExpression` rejected PHP `match_expression` even though the scanner AST already carried its subject and arms.

A secondary implementation smell was a ternary used for mapping `PhpMatchArm`. This was moved to the existing AST algebra boundary rather than making consumers classify `kind` themselves.

## Repairs

### 1. Closure contract elevated

`packages/core/src/types/domain/resourceExpressionModel.ts`

Closure binding requirement now carries:

`readonly body: readonly ResourceClosureStatement[]`

instead of:

`readonly body: readonly ResourceExpressionModel[]`

This keeps statement meaning intact from the AST through the binding requirement.

### 2. Match arm dispatch elevated to AST algebra

`packages/core/src/compiler/scanner/lexer/phpAstAlgebra.ts`

Added `PhpMatchArmVisitor` and `matchPhpMatchArm()`.

The mapper now consumes the algebra instead of using a ternary to decide whether an arm is conditional or default.

### 3. Model accessor match semantics elevated

`packages/core/src/types/domain/eloquentTypes.ts`

Added `ModelAccessorMatchArm` and the `match` variant to `ModelAccessorExpression`.

`packages/core/src/compiler/scanner/subscanners/model/modelAccessorExpressionMapper.ts`

`match_expression` now maps to the semantic `match` ADT with:

- subject
- conditional arms
- default arms
- recursively mapped expressions

It is no longer converted to `rejected / unsupported_syntax`.

## Re-trace

Before:

`PHP match → scanner AST → rejected`

After:

`PHP match → scanner AST → Match ADT → downstream semantic consumer`

Before:

`closure → statement ADT → closure requirement → expression-model body`

After:

`closure → statement ADT → closure requirement → statement ADT`

The semantic contract is now continuous.

## Validation

Command:

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: no new TypeScript errors.

Remaining environment blocker:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

## Architectural conclusion

The remaining `if`/ternary/switch occurrences in the scanner mapper are mostly origin-boundary syntax decoding. They do not represent downstream re-classification. The important semantic rejection boundaries identified in this trace were repaired by enriching existing ADTs rather than adding parallel interfaces.

Next trace target: resource binding origin/traversal, especially places where a rich expression ADT is reduced to `unsupported_expression`, and the null-literal semantic type boundary.
