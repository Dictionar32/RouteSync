# Phase 357 — Navigator Relational Clean

`relationalSyntaxCursor.ts` is now the canonical syntax navigator. Navigation uses relation selection, presence witnesses, guarded relation resolution, and recursive closure. Host-language absence syntax and imperative collection combinators are not used by the navigator.

The legacy `compiler/scanner/lexer/routeAst/tokenCursor.ts` remains a zero-byte compatibility tombstone. Semantic authority is the relational navigator.

PHP `null` remains representable as a tagged semantic value elsewhere; it is not used as navigator absence.
