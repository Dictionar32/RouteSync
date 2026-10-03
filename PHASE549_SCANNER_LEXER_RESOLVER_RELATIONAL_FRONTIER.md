# Phase 549 — Scanner/Lexer/Resolver Relational Frontier

## Direction

The scanner/lexer/resolver boundary now follows the same semantic authority used by the
relation solver: lexical operators remain language evidence, while host-language semantic
selection is expressed through relation gates, relation equality, recursive relation closure,
and text relations.

The architecture is deliberately aligned with the useful parts of Statix scope-graph
constraints, MLIR PDL declarative pattern/rewrite representation, K rewrite semantics, and
e-graph/Datalog-style saturation. Statix models name resolution with scopes, labelled edges,
and declarations and solves constraints over terms; MLIR PDL models pattern matching and
rewriting declaratively; K makes semantic transitions explicit as rewrite rules; egglog
combines equality saturation with Datalog-style relations.

## Changes

- Added relation-level text primitives: prefix/suffix, lower-case projection, delimiter fields,
  indexed presence, numeric parsing, and boundary-character trimming.
- Removed host string branching from `RouteSecurityResolver` for middleware classification and
  policy field extraction.
- Removed host `startsWith`/`split` decisions from route-path resolution; path segmentation now
  consumes relational text fields.
- Kept PHP lexical evidence such as `&&`, `||`, `===`, `??`, and ternary tokens in the lexer.
  These are facts about the input language, not host semantic decisions.
- Added AST-based frontier audit so lexical string literals are not falsely classified as
  forbidden host-language operators.

## Audit

`npm run audit:scanner-lexer:phase549`

Result:

- `closedSurfaceClean: true`
- `transpileDiagnosticsClean: true`
- `ok: true`

The audit targets the active scanner/lexer/resolver frontier rather than tests or historical
migration artifacts.
