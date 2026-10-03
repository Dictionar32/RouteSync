# Phase 312 — Declarative Parser & Semantic Catalog Migration

Phase 312 extends the relational-authority boundary into concrete parser dispatch
and expression semantic producers.

## Migrated surfaces

- `scanner/lexer/astClassifier.ts`
  - expression entry dispatch is now an ordered declarative rule catalog;
  - tokenization excludes EOF through relation selection;
  - `new` construction is resolved through relation choices rather than a
    top-level imperative dispatch chain.
- `scanner/subscanners/queryProducer.ts`
  - comparison operators are a relation catalog;
  - model-static operation selection is catalog-driven;
  - expression operation selection is catalog-driven;
  - argument extraction is catalog-driven and recursive over typed sequences;
  - closure body/statement and `for`-clause projection use catalogs;
  - sequence construction and match/object/array projections are recursive;
  - date-relative/date-part vocabularies remain declarative catalogs.
- `semantic/plugins/expression/binaryHandler.ts`
  - binary type/operator vocabulary is catalog-driven;
  - semantic resolution uses relation choices instead of imperative branching.
- `semantic/plugins/expression/literalHandler.ts`
  - literal type vocabulary is catalog-driven;
  - literal classification uses relation choices.

## Existing relational authority

The following remain construct-free semantic authority surfaces from earlier phases:

- `compiler/constraints/*`
- `semantic/plugins/expression/ternaryHandler.ts`
- `scanner/lexer/routeAst/syntaxErrorRelationCore.ts`
- `scanner/lexer/routeAst/semanticRelationSolver.ts`
- `scanner/lexer/routeAst/semanticRewriteEngine.ts`
- `semantic/kernel/relationalSequence.ts`

## Boundary rule

Concrete PHP syntax may still be represented as evidence. It must not become the
semantic solver's control model. Semantic meaning is represented by candidates,
guards, relations, constraints, rewrites, and fixed-point closure.

Phase 312 is intentionally incremental: the large Laravel query-method dispatcher
and the remaining low-level token scanners still contain imperative implementation
logic and are next migration targets. They are not relabeled as declarative merely
because a surrounding catalog exists.
