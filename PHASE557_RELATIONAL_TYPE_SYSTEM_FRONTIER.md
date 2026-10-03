# Phase 557 — Relational Type-System Frontier

This phase extends the closed declarative frontier from scanner/lexer/resolver/lowering into the type-system resolver graph.

## Cutover

- `TypeHierarchy.getParent` now returns an explicit `Presence<SemanticType>` relation instead of a host `undefined` sentinel.
- `subtypingChecker.ts` is expressed as ordered semantic rules with recursive hierarchy closure and generic variance relations.
- `assignabilityChecker.ts` uses relation-driven subtype and union-member witness search.
- `typeLattice.ts` uses relation-driven join/meet selection.
- the rootless constraint hierarchy now returns `absent()` explicitly.

## Verification

The Phase 557 AST audit scans the previous closed frontier plus `compiler/types/system` and `TypeHierarchy.ts`. It treats PHP/model `null` as evidence rather than host-language leakage.

The audit also transpile-checks every scanned TypeScript source file.
