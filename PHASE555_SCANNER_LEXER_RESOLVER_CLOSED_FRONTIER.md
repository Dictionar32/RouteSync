# Phase 555 — Scanner/Lexer/Resolver Closed Frontier

Phase 555 closes the remaining AST-detected host-language leak found while auditing the broader scanner/lexer/resolver surface after Phase 554.

## Change

`packages/core/src/compiler/scanner/lexer/routeAst/syntaxRelationProgram.ts`

The relation-program child projection no longer uses an `as unknown`-style assertion. The child collection is represented through the existing erased relation-program storage boundary.

## Architectural direction

The scanner and resolver frontier is treated as a declarative semantic substrate:

`source facts -> semantic relations -> candidate relations -> witness selection -> rewrite/projection -> recursive closure`

This follows the useful architectural ideas from Statix scope-graph constraints and MLIR PDLL/PDL declarative match/rewrite systems, while retaining RouteSync's explicit evidence and relation/fixed-point kernel.

## Verification

AST audit covers:
- scanner
- semantic resolver
- compiler constraints
- TypeScript lowering
- semantic kernel/plugins

Forbidden host constructs include `if`, `for`, `while`, `switch`, ternary, `??`, `===`, `!==`, `&&`, `||`, `map`, `filter`, `reduce`, `flatMap`, `trim`, `slice`, `undefined`, `never`, and `as unknown`.

`null` is reported separately because PHP null is source-language/model evidence in the affected files; it is not counted as a host control leak.
