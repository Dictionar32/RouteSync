# Phase 2813 — Upstream Expression Candidate Continuation Audit

## Runtime trace

`classifyAstTokens(tokens)` in `packages/core/src/compiler/frontend/php/astClassifierRuntime.ts`

1. Calls `scannerAstExpressionCandidateContractAlgebra.resolve(...)` with lexical token evidence.
2. Receives the upstream-owned `ScannerExpressionCandidateJudgment<Token>` ADT.
3. Calls `candidateJudgment.continueForAstClassification(...)` to follow either `not_applicable` or `resolved` without downstream switching over the candidate judgment.
4. The `resolved` continuation verifies rule precedence, resolves the existing AST classification rules, verifies their result, and handles the separate AST-classification judgment exhaustively.
5. The resulting AST node is source-located and returned to the parser/scanner path that ultimately feeds CLI manifest composition.

## Existing contract inspection and change

The existing owner `scannerAstExpressionCandidateInterface.ts` already defined the closed `not_applicable | resolved` candidate judgment, so no parallel contract was introduced. Each ADT branch now provides the domain-specific `continueForAstClassification` operation. `scannerAstExpressionCandidateAlgebra.ts` constructs frozen judgment values with that operation. The AST runtime consumes it directly.

This is a domain operation specifically for following the scanner's expression-candidate judgment, not a generic `fold`, visitor, dispatcher, or reasoning primitive. The downstream AST-classification judgment still uses its own exhaustive switch because it is a distinct ADT with distinct outcomes and error semantics.

## Runtime export style and boundaries

The upstream candidate algebra remains exported as an interface-first frozen operation object. No `export function` API or bare exported arrow helper was added. No unrelated exports were mechanically migrated because they are outside this candidate-judgment runtime slice and have separate ownership/compatibility contracts.

`packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Verification

- `npm run audit:phase2813-upstream-expression-candidate-continuation`: **11/11 passed**.
- Focused Vitest command was attempted twice, but both invocations timed out before returning a test result. Therefore the behavioral test suite is **not verified**.
- Full TypeScript typecheck, production build, full test suite, and CLI scan/sync E2E were not verified.
