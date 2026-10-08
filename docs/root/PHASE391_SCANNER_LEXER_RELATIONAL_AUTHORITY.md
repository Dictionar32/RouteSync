# Phase 391 — Scanner/Lexer Relational Authority

Phase 391 continues the migration from imperative parser/scanner authority toward declarative semantic relations.

## Research basis

The design follows three complementary ideas:

- MLIR PDLL/DRR: matching is expressed as patterns and constraints, while transformation is expressed as declarative rewrites.
- Soufflé: semantic state is represented as typed relations and Horn-style rules rather than an imperative traversal recipe.
- JastAdd: circular attributes provide declarative fixed-point evaluation for analyses such as reachability and data-flow.

The intended RouteSync pipeline remains:

`syntax evidence → typed semantic facts → candidate relations → constraints → fixed-point closure → rewrite/equality saturation → canonical projection`

## Phase 391 changes

1. `controllerMethodParser.ts`
   - Introduced relation primitives for semantic classification helpers.
   - Replaced parameter type `switch` authority with a typed catalog relation.
   - Replaced direct parameter semantic branching with relation-gated classification.
   - Replaced selected array traversal (`parameters.map`) with relational projection.
   - Reworked imported-class and attribute-end lookup helpers toward recursive relation traversal.

2. `controllerDeclarationParser.ts`
   - Kept the existing compatibility contract intact while this phase establishes the lexer-side relation boundary. Full `RelationOption` propagation is deliberately deferred until the controller AST contract migration is completed.

## Important boundary

This phase does **not** claim scanner-wide eradication. The production scanner audit remains the source of truth for the remaining frontier. The largest current authorities are still:

- `queryEvidenceProducer.ts`
- `astClassifierEvidence.ts`
- `controllerMethodParser.ts`
- `controllerAstCanonical.ts`
- `migrationProducer.ts`
- `ResourceScanner.ts`
- resource/service/request subscanners and resolver families

A syntax-level replacement such as `if → ternary`, `switch → object`, or `for → recursion` is not considered completion. The target is relocation of semantic authority into relations, constraints, closure, and rewrite layers.
