# Phase 1423 — Scanner Expression Form Algebra

## Scope

This phase moves two expression-shape decisions out of `core/src/compiler/scanner/lexer/astClassifierRuntime.ts`:

- matching the top-level conditional `?` with its corresponding `:` while accounting for nested ternaries;
- selecting a prefix unary operator and rejecting a prefix token that has no operand.

## Boundary

`scannerExpressionFormAlgebra.ts` is language-neutral. It receives token observations, top-level candidate collection, and a prefix operator vocabulary through explicit contracts. It returns closed resolution variants (`resolved`, `not_found`, `malformed`, `contract_violation`).

The PHP scanner runtime remains responsible for PHP-specific operator facts and `PhpAstFactory` construction. It no longer owns the conditional marker pairing loop or unary operator candidate-selection decision.

## Validation

- Phase 1423 structural audit: 10/10 checks.
- Strict TypeScript check of the new algebra and token-structure algebra: passed.
- Direct compiled runtime assertions: 5/5 passed.
- Prior Phase 1420, 1421 and 1422 audits: passed.
- Whole-project build remains unverified because the workspace does not have the `tsdown` executable installed.
- Runtime-wide TypeScript check remains blocked by existing diagnostics in unrelated scanner imports, `semanticEvidenceRelations.ts`, and `queryEvidenceProducer.ts`; no diagnostic was emitted for the new algebra or the edited `classifyTernary` / `classifyUnary` functions.

## Next migration frontier

Continue with coalesce/short-ternary and expression precedence composition, then separate generic traversal from Laravel/Eloquent inference in `queryEvidenceProducer.ts`. Do not replace local code with a nominal interface unless the decision algorithm actually moves behind the contract.
