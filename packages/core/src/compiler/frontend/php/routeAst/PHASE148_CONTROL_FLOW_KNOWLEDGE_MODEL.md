# Phase 148 — Control-flow as knowledge model

The RouteSync route AST layer must not treat Tree-sitter control-flow nodes as the semantic model.

Tree-sitter remains the syntax substrate. RouteSync raises the meaning of branch, selection and iteration into explicit data:

- `branch` — alternative knowledge cases and their transitions.
- `selection` — keyed alternatives plus an explicit fallback.
- `iteration` — state, termination fact and transition policy.

`syntaxScan` now consumes an explicit `ControlFlowIteration` model. The runtime loop is only an interpreter of that model; it does not define route syntax meaning.

This is intentionally different from mechanically replacing `if`, `while` or `switch`. The architectural elevation is:

`Tree-sitter syntax -> syntax facts -> control-flow knowledge model -> semantic data flow -> consumer`

Therefore a future Laravel-specific conditional, loop or selection rule belongs in a fact/catalog/ADT and data-flow edge, rather than becoming another parser predicate.
