# Phase 1632 — Scanner Thin, Interface-First Semantic Ownership

## Objective

Reduce scanner-owned runtime and semantic policy. Scanner modules should acquire source evidence, call canonical upstream contracts, and project typed results. Domain inference rules belong to upstream interface policy and semantic authority; generic relation execution is exposed through the canonical upstream runtime executor.

## Trace findings

- `semanticObjectIdentityRelations.ts` held alias inference rules (`by-reference -> may-alias`, symmetric identity links, and alias answers) and called the generic solver directly.
- `semanticConstraintHandlingRules.ts` contained a complete CHR-style constraint solver in the scanner tree, including rule matching, normalization, removal, propagation, and fixed-point iteration.
- `semanticInterproceduralDataFlowRelations.ts` contained callable-boundary inference rules and called `solveSemanticRelations` directly.
- `semanticTypedRelation.ts` was a generic typed relation algebra implementation in the scanner tree.
- `semanticRewriteEngine.ts` re-exported the entire generic solver runtime through the scanner tree and scanner barrel, despite production scanner consumers not needing that runtime surface.

## Changes

1. Added `semanticObjectIdentityInterface.ts` and `semanticObjectIdentityAuthority.ts` under `core/src/types/upstream`. Alias rules now live in `SEMANTIC_OBJECT_IDENTITY_RULES`; the authority delegates relation closure to `semanticRewriteRuntimeExecutor` and preserves the proof and `closed`/`incomplete` status.
2. Added `semanticConstraintHandlingInterface.ts` and `semanticConstraintHandlingAuthority.ts` under upstream. The scanner file is now a compatibility facade. Results are a discriminated `closed`/`incomplete` union, and a zero-round budget is explicitly incomplete. A changed final allowed round is not misreported as saturated.
3. Added `semanticInterproceduralDataFlowInterface.ts` and `semanticInterproceduralDataFlowAuthority.ts` under upstream. Callable-boundary policy is declarative upstream data and the authority delegates relation closure to the canonical runtime executor.
4. Moved generic typed relation operations to upstream; the scanner module remains a facade for compatibility.
5. Narrowed the scanner `semanticRewriteEngine.ts` facade to types only and removed its runtime solver re-export from the scanner barrel. Generic solver unit tests import the foundation directly.
6. Added a Phase 1632 audit and regression assertions for semantic ownership, closure status, round budgets, and absence of direct generic solver calls in production scanner route-AST modules.

## Verification

- Phase 1629 audit: 8/8 checks passed.
- Phase 1630 audit: 6/6 checks passed.
- Phase 1631 audit: 6/6 checks passed.
- Phase 1632 audit: 13/13 checks passed.
- Object-identity regression test: passed.
- CHR constraint-handling regression test, including zero/one-round limits: passed.
- Targeted TypeScript check: no diagnostics in the changed Phase 1632 modules; project-wide transitive check still reports existing diagnostics in foundational relational helpers and older scanner/upstream modules.
- Full project build and Vitest: not run; workspace dependencies are not installed.

## Remaining boundary

This phase removes direct generic solver calls from production `scanner/lexer/routeAst` modules, but it does not claim that all 537 scanner files are free of domain classification. The next trace should inventory semantic rule catalogs and classification branches outside route-AST, then migrate by domain into existing upstream authority contracts. Do not bulk-move parsing/evidence acquisition or generic combinators just to reduce line counts.
