# Phase 343 — Relational Cursor Authority

The parser cursor is now split into a transport adapter and a semantic authority.

- `tokenCursorAuthority.ts` is the adapter boundary.
- `cursorDecisionRelations.ts` is the semantic cursor relation.
- `CursorFact` represents position, token evidence, and terminal evidence.
- absence is carried by `RelationOption<TokenDescriptor>`, not an `undefined` semantic atom.

The legacy `TokenCursor` remains available only for migration compatibility. It is not the semantic specification.

The intended closure is:

`tokens -> CursorRelation -> SyntaxEvidenceRelation -> constraints -> decision witness -> rewrite closure`.

The authority layer intentionally uses relation gates rather than conditional syntax. This keeps the host language from becoming the semantic decision mechanism.
