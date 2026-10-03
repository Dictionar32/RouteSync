# Phase 342 — Syntax Evidence Relations

The canonical parser boundary now has an explicit relation vocabulary:

`token`, `position`, `delimiter`, `separator`, `operator`, `argument`, `end`.

Parser adapters publish `SyntaxEvidenceFact` values. Presence is represented by
`RelationOption<T>`, so absence is represented by a typed witness.

The next migration replaces legacy `TokenCursor` getters with these facts and
moves syntax classification into solver rules. `syntaxErrorRelationCore` already
uses relation patterns and rewrite closure and therefore becomes a downstream
consumer rather than a second parser authority.

## Design invariant

```text
source tokens
  -> evidence facts
  -> candidate / requirement / exclusion
  -> constraint closure
  -> syntax diagnostic / AST witness
  -> rewrite closure
```

This follows the same broad separation seen in WebAssembly's declarative
validation rules, Souffle relation/constraint declarations, and MLIR's
pattern/rewrite model.
