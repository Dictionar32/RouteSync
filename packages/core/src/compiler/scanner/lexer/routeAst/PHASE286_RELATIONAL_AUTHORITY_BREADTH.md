# Phase 286 — Relational Authority Breadth

This phase tightens RouteSync's semantic boundary beyond the RouteAst adapter.

## Architecture

```text
source syntax
  -> syntax/evidence vocabulary
  -> neutral evidence
  -> typed relation facts
  -> one semantic relation program
       - schemas
       - constraints
       - rewrites
  -> generic constraint/relation solver
  -> fixed-point closure
  -> rewrite normalization
  -> proof-carrying semantic artifact
  -> target lowering
```

## Concrete syntax isolation

Concrete statement spellings are centralized in `phpAstStatementKinds.ts` and the
syntax-evidence registry. Downstream scanner analyzers use neutral vocabulary:

- `conditional`
- `collectionRecurrence`
- `countedRecurrence`
- `preTestRecurrence`
- `multiCandidateDispatch`

The semantic adapter, relation solver, rewrite engine, controller/resource
analysis mappers, and service analysis mappers do not inspect concrete PHP
statement spellings.

The parser AST type definitions, algebra visitor, and AST factory remain syntax
infrastructure. They are not semantic authority and therefore may retain the
source grammar representation required to parse PHP.

## Single semantic program authority

`SemanticRelationProgram` now carries:

```text
schemas
constraints
rules
```

`SEMANTIC_BEHAVIOR_PROGRAM` is the canonical program object. The behavior kernel
executes constraints and rewrites from that object rather than maintaining a
second execution-time rule source.

## Research direction

This is aligned with first-class Datalog constraint systems such as Flix, where
relation constraints can be constructed, composed, and solved as values, and
with newer work such as FlowLog that compiles declarative analysis programs to
incremental relational execution. The relevant architectural lesson is to make
the declarative relation program the specification and keep the solver generic.

## Non-goals

This phase does not claim that the parser itself no longer has PHP grammar.
Grammar recognition necessarily remains at the syntax boundary. The invariant
is that grammar constructs cannot become canonical semantic concepts.
