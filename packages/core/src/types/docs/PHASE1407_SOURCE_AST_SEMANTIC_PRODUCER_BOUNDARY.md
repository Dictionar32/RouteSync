# Phase 1407 — Source AST Semantic Producer Boundary

Date: 2026-10-09

## Migration completed

`sourceAstScanner.ts` previously mixed orchestration of source bundles with PHP statement traversal, method acceptance rules, expression/assignment production, and model property production. These responsibilities now cross one explicit upstream interface:

`SourceProjectIdentity -> SourceAstSemanticProducerInterface -> SourceAstSemanticProducts`

The producer owns expression, assignment, and property production. The source scanner orchestrator consumes those products and continues wiring them into `SourceAsts`; it no longer imports the expression/assignment/property producers, parses PHP methods for this semantic path, or traverses PHP statements to select semantic products.

The interface is exported from `types/upstream/index.ts` and returns immutable typed collections for expressions, assignments, and properties. This is an implementation boundary, not a claim that all source evidence acquisition has been separated: the producer still performs file discovery and syntax parsing, which remains the next decomposition point.

## Ownership model

- Source bundle orchestration: `compiler/scanner/orchestrator/sourceAstScanner.ts`
- Semantic source products: `compiler/semantic/sourceAstSemanticProducer.ts`
- Contract: `types/upstream/sourceAstSemanticProducerInterface.ts`
- Structural audit: `scripts/audits/audit-phase1407-source-ast-semantic-producer-boundary.cjs`
- Report: `scripts/audits/reports/phase1407-source-ast-semantic-producer-boundary.json`

## Residuals

1. Separate lexical/source evidence extraction from semantic producer selection inside `sourceAstSemanticProducer.ts`.
2. Move duplicate action-name resolution from `cli/src/generators/classifier/routeGrouper.ts` into upstream route identity closure, including alias-merging semantics.
3. Resolve the existing relational-calculus/dataflow audit failures before claiming full semantic ownership closure.
4. Run full project typecheck, build, and Laravel example integration tests in an environment with the declared dependencies installed.

## Verification

The Phase 1407 structural audit checks the interface contract, producer ownership, orchestrator delegation, and upstream export. It is not a substitute for a full TypeScript build or integration test.
