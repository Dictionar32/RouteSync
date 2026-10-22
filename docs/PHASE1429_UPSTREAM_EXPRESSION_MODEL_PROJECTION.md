# Phase 1429 — Upstream Expression Model Projection Trace

## Trace result

This phase traces the existing upstream models before introducing another semantic abstraction.

- `types/upstream/expression.ts` already defines the domain-level `Expression` ADT, including binary, unary, conditional, short-conditional, coalesce, call, and index forms.
- `types/upstream/ast.ts` already defines `ExpressionAst` as the canonical expression AST judgment.
- `compiler/scanner/subscanners/expressionProducer.ts` already projects scanner `PhpAstValue` into the upstream `Expression` and packages it as `ExpressionAst`.
- `types/upstream/scannerExpressionStructure.ts` already defines the earlier, token-level `ExpressionStructure` ADT. It is the correct representation before recursive operand classification and before PHP AST construction.
- `astClassifierRuntime.ts` already resolves that structure, but it also performed the entire structure-to-PHP-AST projection inline. Thus the upstream structure was not missing; its projection boundary was embedded in the runtime classifier.

The domain `Expression` ADT and token-level `ExpressionStructure` are not interchangeable. The former contains semantic/domain values and provenance; the latter carries source token slices so the PHP adapter can recursively classify children. Replacing one with the other would lose stage-specific information.

## Change

Added `compiler/scanner/lexer/phpExpressionStructureProjector.ts` as a projection-only adapter. It consumes the existing closed `ExpressionStructure` ADT and maps its variants into the existing PHP AST factory vocabulary. It does not select candidates, inspect precedence, resolve ternary boundaries, or decide associativity.

`astClassifierRuntime.ts` still owns token-evidence acquisition and calls the existing structural algebra. Once that algebra returns a structure, runtime delegates projection to `projectPhpExpressionStructure`. This phase does not claim that all token-shape reasoning has migrated out of runtime; candidate providers and some syntax recognition remain there and are the next migration frontier.

## Verification

Run:

```sh
node scripts/audits/audit-phase1429-upstream-expression-model-projection.cjs
```

The audit verifies the existing upstream ADTs and producer wiring, the new projection boundary, and that the projector does not own candidate arbitration or precedence resolution.

The full package build and Vitest integration tests require the repository's dependencies to be installed. Their status must not be inferred from this source audit.
