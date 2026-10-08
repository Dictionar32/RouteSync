# Phase 470 — scanner provider relational cutover

Cutover from imperative closure-statement dispatch in `providerAstCanonical.ts` to a typed handler catalog and recursive relation traversal.

- `switch` dispatch replaced by `CLOSURE_STATEMENT_HANDLERS` keyed by `ClosureStatement['kind']`.
- linked statement-list traversal replaced by `relationResolve` recursion.
- PHP source-language statement kinds remain data vocabulary; they are not host-language control flow.
- This phase intentionally does not claim the entire provider canonicalizer is clean; `semanticBindings` and other legacy nullable/query paths remain the next frontier.
