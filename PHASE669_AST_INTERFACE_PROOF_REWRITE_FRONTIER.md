# Phase 669 — AST Interface Proof-Carrying Rewrite Frontier

Phase 669 elevates the semantic rewrite boundary from boolean candidate requirements to a typed refinement-witness interface.

## Architectural elevation

The semantic decision/rewrite engine now exposes `SemanticVariantRewriteCandidate` and `variantRewriteCandidate`. A candidate carries a source subject and a discriminant variant; the engine derives the typed witness through the relational `relationVariant` relation before invoking the rewrite. This removes consumer-side discriminant assertions from the migrated scanner/upstream mapping frontier.

The lexical boundary also now has explicit `TokenEvidence`/`TokenEvidenceInterface` plus relational `tokenValueOr` and `tokenKindOr` projections. Scanner classifiers consume lexical evidence through the interface rather than optional host property access.

## Migrated frontiers

- scanner token evidence and AST classifier evidence
- PHP expression syntax evidence registry
- controller return/declaration parser boundaries
- resource upstream expression canonicalization
- resource upstream expression mappings
- resource AST expression mapper
- resource upstream closure mapper
- TypeScript semantic lowering boundary remains relation-driven and is included in the audit contract

## Legacy vacuum

The legacy `semanticRelationSolver.ts` and `syntaxErrorRelationCore.ts` remain zero-byte compatibility remnants. Phase 525 inactive-file vacuum reports no non-empty inactive candidates.

## Verification

- Phase 666 audit: PASS
- Phase 667 audit: PASS
- Phase 668 audit: PASS
- Phase 669 audit: PASS
- Phase 525 inactive-file vacuum: PASS
- full source TypeScript transpilation: PASS, 1285 files, 0 transpile failures
- full `tsc --noEmit`: still environment-blocked by missing `node` and `vitest/globals` type definitions; this is not treated as a source correctness proof

## Research alignment

The model is deliberately aligned with interface-driven compiler transformation and declarative rewriting: MLIR separates generic transformations through interfaces and uses rewrite patterns/type conversion; K defines executable semantics with configurations and rewrite rules; SeaHorn separates syntax/semantics/verification and lowers verification conditions to Horn clauses; Rosette exposes solver-backed symbolic reasoning. These references inform the architecture but do not replace RouteSync's own semantic authority.
