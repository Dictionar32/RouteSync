# Phase 284 — Strict Relational Authority Audit

The semantic adapter is now a consumer of syntax evidence, not a dispatcher over PHP statement grammar.

## Authority boundary

```text
PHP parser grammar
  -> phpAstStatementSyntaxEvidenceRegistry
  -> neutral evidence/facts
  -> typed semantic relations
  -> declarative semantic program
  -> constraint + relation solver
  -> rewrite/fixed-point closure
  -> proof-carrying compilation artifact
```

Concrete PHP statement spellings are confined to the syntax-evidence registry. The canonical semantic adapter and semantic kernel do not import or inspect concrete statement kinds.

## Canonical invariant

The following source-level constructs are not semantic concepts:

- conditional statement kinds
- iteration statement kinds
- switch/case statement kinds

They are evidence that produces relations such as `depends_on`, `flows_to`, `requires`, `excludes`, `permits`, `precedes`, `reaches`, `recurs`, `converges`, `produces`, and `consumes`.

The relation program and solver are the semantic authority. Parser dispatch is not.

## External design evidence

The architecture follows a stronger separation also visible in WebAssembly's declarative validation specification: the specification states constraints declaratively while an algorithm executes those constraints. CompCert similarly gives intermediate languages formal semantics and proves transformations preserve semantics. Souffle models analysis as typed relations and rules, while Maude separates rewrite rules from strategies.
