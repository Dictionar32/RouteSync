# Phase 324 — Relational Fixed Point + CRAG/CHR Core

This phase deepens the semantic authority beyond parser-level control elimination.

## Research-derived architecture

- MLIR PDLL/PDL separates declarative pattern matching from rewrite.
- egglog combines Datalog-style fixed-point reasoning with equality saturation and lattice reasoning.
- Statix models language semantics such as name binding through declarative constraints and scope graphs.
- Circular/reference attribute grammar work motivates explicit attribute dependencies and fixed-point evaluation.
- CHR-style propagation, simplification and simpagation provide a useful relation-rule execution model.

## RouteSync changes

### Relation kernel

Added `relationFixedPoint` as a reusable recursive monotone-closure substrate. A semantic layer supplies:

- seed state
- monotone step relation
- semantic equality relation
- bounded convergence policy

The kernel does not require imperative loop constructs.

### Candidate solver

`candidateSatisfies` now composes requirements/exclusions/dependencies through `relationAll`, keeping candidate selection relational.

### Circular/reference attributes

`semanticAttributeRelations.ts` now models attribute dependencies as `(attribute,node)` references instead of attribute names alone. The evaluator uses the generic relation fixed-point substrate.

### Constraint calculus

`semanticConstraintCalculus.ts` uses relation witnesses for variable resolution and constraint evaluation. Semantic absence is no longer represented by a language-level absence sentinel.

### Constraint handling

`semanticConstraintHandlingRules.ts` models CHR-like propagation, simplification and simpagation through relation matching and recursive saturation. Pattern matching and instantiation return `RelationOption` witnesses.

### Semantic theory

`semanticRelationTheory.ts` replaces nullable theory atoms with the canonical `semantic_null` relation atom and uses relational equality for theory validation.

## Validation

- Production TypeScript source files scanned: 1156.
- TypeScript parser diagnostics: 0 across production source.
- Full `tsc --noEmit` remains blocked by missing workspace type definitions (`@types/node`, `vitest/globals`); this is an environment dependency issue, not a parse failure.

## Remaining migration

The largest remaining production surfaces are `queryProducer.ts`, `astClassifier.ts` sentinel/refinement code, controller/provider/resource canonical adapters, migration/resource producers, and legacy compiler analysis modules. These require semantic-family migration rather than regex substitution because return/continuation semantics must be preserved.
