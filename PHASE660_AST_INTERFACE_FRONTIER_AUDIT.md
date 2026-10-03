# Phase 660 — AST Interface Frontier Audit

Phase 660 raises the Phase 659 cross-stage port from a shared generic fact bag to a closed stage-specific ADT.

## Canonical model

The cross-stage interface now has six closed fact algebras:

- scanner evidence
- upstream mapping
- resolver graph
- analysis
- semantic type lowering
- target projection

Each port carries its stage-specific relation vocabulary. The common AST term algebra is the only shared semantic carrier.

## Rewrite authority

The candidate/requirement compatibility facade moved from `requirementSolver.ts` to `semanticDecisionRewriteEngine.ts`. The former file is now an empty compatibility tombstone. The old route-AST `semanticRelationSolver.ts` is also empty; production imports use `semanticRewriteEngine.ts`.

The syntax diagnostic core was raised from `syntaxErrorRelationCore.ts` to `syntaxJudgmentRewriteEngine.ts`; the former is empty and the route-AST barrel exports the new interface.

## Inactive-file vacuum

Production-unreferenced legacy files were emptied rather than retained as dormant authority. This includes obsolete resource-binding traversal/origin/provenance builders, validation lowerer, PHP lexical symbol table, legacy descriptor/factory files, legacy manifest/mapper lowerers, and the old syntax/solver compatibility surfaces.

## Boundary invariant

Canonical AST semantic interfaces, rewrite engines, syntax-judgment rewrite core, and target projection contain zero occurrences of the prohibited host-language authority constructs checked by the phase audit:

`if`, `while`, `for`, `switch`, collection dispatch (`map/filter/reduce/flatMap`), host absence (`undefined`, `??`, `null`), strict equality operators, `as unknown`, `any`, and constructor-based `Set`/`Map` authority.

Literal target tokens such as TypeScript `null` and `undefined` are data vocabulary, not host-language control constructs; the audit is therefore case-sensitive for the lexical tokens.

## Research trace

The model is aligned with established compiler/verification patterns: MLIR uses interfaces so generic analyses and transformations can operate without encoding dialect-specific knowledge; K uses rewrite rules as executable semantics; Rosette exposes a generic solver interface; and WebAssembly component interfaces use typed contracts. These references support the architectural move from implementation dispatch toward closed semantic contracts and rewrite authority.
