# Phase 386 — Scanner/Resolver Relational Closure

## Authority change

Phase 386 continues the migration from source-language control flow toward a
relation-first semantic architecture. Scanner and resolver code are treated as
producers/consumers of semantic evidence; they are not semantic authority.

The architecture is:

`syntax evidence -> transition/candidate relations -> constraint closure -> fixed point -> rewrite/saturation -> projection`

This is deliberately aligned with established declarative systems:

- MLIR PDLL/DRR describes matching and rewrites declaratively.
- Souffle models facts as relations and derives new facts through Datalog-style rules.
- K defines executable semantics with configuration and rewrite rules.
- egglog combines equality saturation with Datalog.
- JastAdd circular attributes express fixed-point analyses through monotone equations over lattices.

## Scanner migration

`packages/core/src/utils/naming/lexer/tokenizer.ts` no longer uses imperative
`for`/`switch` dispatch. Character classification is evidence, the transition
table is a relation, and recursive closure consumes the stream.

The scanner's FSM state remains an implementation carrier, but transition
selection is data-driven. No semantic decision is delegated to a source
control-flow construct.

## Resolver migration

`SemanticResolutionKernel` now selects resolver plugins through a candidate
relation and relation-first resolution rather than an imperative plugin loop.

`PrimitiveResolver` now expresses primitive type selection as a finite relation
catalog plus relation gates.

## Remaining frontier

Phase 385 identified 82 files with remaining forbidden constructs in the
scanner/resolver authority surface. Phase 386 intentionally migrates only the
highest-authority scanner/resolver nodes first. The remaining files stay
explicitly measurable rather than being cosmetically rewritten.

## Non-goals

This phase does not claim repository-wide elimination. Tests, compatibility
layers, generated examples, and historical phase artifacts remain outside the
canonical authority boundary unless explicitly promoted.
