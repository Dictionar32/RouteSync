# Phase 192 — Semantic Binding and Availability as Data

## Architectural correction

RouteSync now raises variable binding knowledge into the canonical typed Knowledge/Data-Flow Model.

The semantic model contains `SemanticBinding` facts with:

- a semantic variable knowledge identity;
- an optional semantic value source;
- a typed binding origin (`parameter`, `assignment`, `iteration`, `exception_handler`);
- availability represented as semantic presence of another knowledge fact, rather than a statement index/path;
- source provenance.

Binding relationships are represented in canonical `dataFlow` and are therefore independent of statement ordering.

## Why this matters

The previous controller data-flow representation stored:

- `statementIndex`;
- `branchPath`;
- AST values as definition payloads.

Those fields describe parser/traversal-oriented observations. They are still retained for compatibility because existing controller/resource consumers use them, but they are not the semantic source of truth.

The canonical direction is now:

```text
syntax/parser evidence
        ↓
semantic facts
        ├── choice
        ├── repetition
        ├── predicate
        ├── comparison / operator application
        ├── binding
        └── ...
        ↓
typed data-flow
        ↓
compatibility projections / indexes
```

## Availability rule

Availability is knowledge, not control-flow bookkeeping. A binding can depend on another semantic fact that explains its availability. This avoids encoding semantic meaning as numeric statement paths.

The current producer raises assignment, iteration, and exception-handler bindings. Branch-sensitive assignment availability remains the next migration target: recursive semantic scopes should carry the enclosing `choice`/`repetition` identity as data so assignments inside those regions can reference their semantic availability without introducing CFG edges.

## Parser boundary

The canonical semantic model remains parser-neutral. PHP AST is consumed only by the concrete evidence adapter. Tree-sitter remains an evidence mechanism rather than the ontology.


## Phase 192 correction — availability is populated semantically

The binding availability field is now populated from semantic context rather than `not_applicable`:

- assignments inherit the current semantic availability context;
- `if`/`else` branch bodies use typed outcome knowledge as availability;
- `while`/`for`/`foreach` bodies use their typed repetition knowledge as availability;
- `switch` case bodies use typed outcome knowledge as availability;
- `try`/`catch`/`finally` bodies use typed exception/handler context.

The legacy controller dataflow projection may still expose `statementIndex` and `branchPath` for compatibility, but those values are not the canonical semantic source of truth.
