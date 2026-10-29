# Phase 276 — Relational Semantic Ontology Purge

## Goal

Remove construct-shaped control ontology from the canonical RouteSync semantic pipeline.
The parser may recognize source syntax, but semantic truth is represented only as typed
relations and derived closure.

## Canonical boundary

```text
PHP source
  ↓
syntax parser / AST
  ↓
syntax evidence projection
  ↓
typed semantic facts
  ↓
canonical semantic relations
  ↓
constraint + relational solver
  ↓
rewrite / normalization
  ↓
proof-carrying closure
  ↓
semantic compilation artifact
  ↓
target lowering
```

## Removed from canonical ontology

- `SemanticChoice`
- `SemanticRepetition`
- `SemanticFact.kind = choice`
- `SemanticFact.kind = repetition`
- `SemanticControlRelationFact`
- `SemanticKnowledgeDataFlow.controlRelations`

The expression adapter represents conditional/coalescing/pattern behavior using
`region`, `predicate`, `outcome`, `candidate`, and guarded dependencies. Guard polarity
is projected into `requires` / `excludes` relations and is solved declaratively.

## Legacy quarantine

Historical `semanticControl*` implementation and phase tests remain under:

`routeAst/legacy/control/`

They are migration artifacts only. The canonical adapter, relation theory, relational
behavior kernel, closure engine, rewrite engine, and lowering artifact do not import them.

## Syntax boundary

Concrete parser spellings remain confined to the syntax/evidence layer. This is intentional:
syntax recognition is evidence acquisition, not semantic authority. The semantic adapter
receives the projected evidence and emits only relation-oriented semantic facts.

## Verification

- Targeted TypeScript compilation: passed.
- Construct-free adapter smoke test: passed.
- Relational boundary smoke test: passed.
- Canonical model audit: no choice/repetition/controlRelations ontology.
- Canonical solver/closure/rewrite/lowering audit: no legacy control dependency.

This phase does not claim full Vitest-suite success; only the targeted checks above were used.
