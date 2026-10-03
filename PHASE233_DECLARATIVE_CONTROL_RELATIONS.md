# Phase 233 — Declarative Control Relations

Source `if`, `switch`, `while`, and `for` are not semantic authority.

They are normalized into relations:

- `if` → `predicate`, `choice`, `guard`, `merge`
- `switch` → `choice`, `alternative`, `guard`, `merge`
- `while` → `iteration`, `successor`, `guard`, `merge`
- `for` → `iteration`, `successor`, `guard`, `merge`

The semantic ontology is declared in `semanticControlRelationCatalog.ts`.
The relation solver performs fixed-point saturation and rewrite application.

Important boundary:

- Parser/lexer `if`/`switch`/loops may remain as evidence decoding mechanics.
- Solver `while`/`for` may remain as fixed-point/worklist mechanics.
- Semantic consumers must not use those source-control constructs as the source of domain meaning.
