# Phase 273 — Parser Adapter Relational Boundary

The PHP parser adapter is now construct-free at the semantic boundary.

## Rule

`if`, `while`, `for`, `foreach`, and `switch` may exist as parser evidence because the source language contains those syntactic forms. They must not become semantic ontology nodes.

The adapter projects their observations into neutral entities and relations:

- predicate/condition evidence
- candidate evidence
- dependency evidence
- value/data-flow evidence
- region/entity identity

The solver derives higher-order properties such as `permits`, `reaches`, `converges`, `recurs`, and `invariant`.

## Explicitly forbidden from the canonical adapter output

- `choice`
- `decision`
- `branch`
- `loop`
- `repetition`
- `controlRelations`
- `SemanticChoice`
- `SemanticRepetition`

The compatibility `SemanticControl*` modules remain available for historical migration/tests, but the parser adapter no longer imports or invokes their relation materializer.

## Architecture

```text
PHP syntax
  -> parser evidence
  -> neutral facts/data-flow
  -> typed semantic relations
  -> constraint calculus
  -> relational fixed point
  -> rewrite/saturation
  -> proof-carrying semantic closure
  -> target lowering
```

The source construct is therefore evidence about relations, not the semantic meaning itself.
