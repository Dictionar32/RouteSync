# Phase 229 — Semantic Control-Flow Knowledge Elevation

Phase 228 audited `if`, `while`, `switch`, and `for` usage. This phase removes
three remaining semantic policy decisions from analysis consumers.

## Elevated knowledge

- assignment operator -> memory effect
- assignment reference mode -> alias semantics
- data-flow role -> callable boundary semantics

The catalogs are canonical semantic definitions. Consumers query them instead
of embedding domain policy in branch predicates.

## Remaining control flow

`if`/`while`/`switch` may remain where they perform traversal, fixed-point
solver mechanics, presence handling, validation, or discriminated-union
interpretation. They are not semantic authority in those cases.
