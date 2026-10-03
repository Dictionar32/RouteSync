# Phase 341 — Relational Cursor Boundary

`TokenCursor` is no longer the intended semantic authority. The canonical semantic boundary is a relation:

`CursorPosition -> CursorRelation -> RelationOption<TokenDescriptor>`

The cursor remains as a compatibility execution object while parser and adapter migration proceeds. New semantic code must consume the relation boundary and preserve absence as a typed witness.

## Required lowering

- positional lookup -> relation lookup
- optional token -> `RelationOption<T>`
- branch selection -> candidate/requirement relation
- parser failure -> syntax evidence relation
- cursor traversal -> recursive relation closure

This is deliberately an incremental boundary: compatibility code is not counted as migrated semantic authority until it consumes the relation representation.
