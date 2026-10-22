# Phase 1409 — Upstream Syntax, Semantic Reasoning, and Dataflow Boundary

## Implemented pipeline

`Laravel source -> SourceAstEvidenceAcquisitionInterface -> SourceAstFileEvidence -> SourceAstSyntaxParserInterface -> syntax AST -> sourceAstSemanticProducer -> ExpressionAst / AssignmentAst / PropertyAst -> SemanticDataflowJudgment -> wiring/projection -> runtime executor -> manifest / graph / IR / CLI / SDK / React`

### Ownership boundaries

- `SourceAstEvidenceAcquisitionInterface` owns file discovery and source text acquisition for the currently migrated model/resource/controller/service families.
- `SourceAstSyntaxParserInterface` is a generic upstream contract. Its generic syntax types avoid importing compiler implementation types into `types/upstream`.
- `sourceAstSyntaxParser` owns tokenization and parsing into the existing PHP method/property AST types. It does not decide operation identity, endpoint capability, route semantics, or dataflow closure.
- `sourceAstSemanticProducer` maps parsed syntax into typed semantic products. This is an improvement over mixing parsing and product construction, but semantic origin assignment still needs a dedicated source-family reasoning judgment.
- `semanticDataflowAuthority` remains the upstream owner of relation closure, derivations, paths, and the closed `SemanticDataflowJudgment`. `semanticDataflowDataFlowAdapter` only projects a closed judgment to a read-only runtime query surface.
- AST dataflow aliases (`AstDataflowFact`, `AstDataflowInput`, `AstDataflowJudgment`) reuse the canonical semantic ADT rather than defining a second fact vocabulary.

## Audits

Run:

- `npm run audit:phase1408-upstream-evidence-and-action-identity`
- `npm run audit:phase1409-upstream-syntax-reasoning-dataflow-boundary`
- `npm run audit:phase918-semantic-dataflow-upstream-boundary`
- `npm run audit:phase729-semantic-relation-calculus-frontier`
- `npm run audit:relational-authority`

Phase 1408 checks 10 structural conditions; Phase 1409 checks 12. These audits prove source-boundary properties only, not full type correctness or end-to-end output equivalence. The parser runtime smoke test is currently blocked by a pre-existing module-initialization `ReferenceError` (`relationRuleEntries` is not defined in `queryEvidenceProducer.ts`); this must be repaired before claiming runtime execution.

## Residual migration frontier

1. Move semantic-origin/source-family resolution into an upstream closed reasoning judgment; the producer should consume that judgment instead of deciding origin by nested source-kind gates.
2. Migrate the remaining Laravel source families through their canonical acquisition and syntax contracts without creating a parallel scanner.
3. Resolve the Phase 918 dataflow boundary, Phase 729 fixed-point/stratum closure, and strict relational-authority audit failures at their actual authorities.
4. Audit manifest, graph, IR, CLI, SDK/Axios, Zod/mapper, and React/TanStack consumers for semantic reconstruction and data-loss. Query-key inputs must include every variable that changes returned data.
5. Run the repository's declared TypeScript 7 / tsdown build and ecommerce fixture integration tests once dependencies are installed.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- CodeQL JavaScript/TypeScript data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- TanStack Query keys: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- TypeScript 7.0: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
