# Phase 554 — Relational Resolver + Parser-Lowering Frontier

Phase 554 extends the relational cutover beyond the scanner/resolver boundary into the semantic resolver kernel and TypeScript parser/lowering adapter surface.

## Research basis

The design follows three complementary lines:

- Statix: scope graphs and static semantics expressed as constraints over scopes, edges, declarations, and queries.
- MLIR PDL/PDLL: declarative match/rewrite programs with a dedicated rewrite substrate rather than hand-written dispatcher boilerplate.
- Relational/fixed-point execution: candidate selection, projections, folds, and recursive closure are represented as relation operations.

## Implemented

### Semantic resolver kernel

Converted remaining host control/equality composition in the active semantic resolver surface to relation predicates/resolution:

- resolver dispatch equality
- control candidate admissibility
- decision-calculus conjunction/disjunction
- type mapping predicates
- conditional wrapper predicates
- binary-expression unresolved checks
- property-access target classification
- framework rule selection
- Eloquent method target selection
- aggregate type selection
- relational syntax cursor navigation
- primitive resolver status selection

### Parser/lowering adapter

Converted the TypeScript lowering adapter surface to relation projection/resolution:

- TypeScript syntax collection projection and branch selection
- primitive semantic rewrite catalog lookup
- lowering-operation relation lookup
- semantic node collection/object/union/intersection projection
- object-type deduplication and compilation stream closure
- property rendering presence selection

The generated TypeScript tokens such as `undefined` and `null` remain target-language output evidence; they are not host semantic sentinels.

## Audit

`node scripts/audit-phase554-relational-resolver-lowering-frontier.cjs`

Result:

- scanned files: 482
- host semantic leaks: 0
- leaking files: []
- transpile diagnostics: 0
- closed surface: true

The audit uses the TypeScript AST. This intentionally distinguishes host-language constructs from PHP/TypeScript source-language vocabulary represented as strings or model discriminants.

## Remaining boundary

The wider `compiler/domain/common` surface still contains older lowering/descriptor modules outside this Phase 554 closed frontier. They are not silently claimed clean. The next high-value cutover is the remaining response/object/type-expression lowering graph, using the same relation-program substrate rather than more local substitutions.
