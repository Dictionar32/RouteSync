# Phase 358 — Route Syntax Relational Cutover

`routeSyntaxModel.ts` is physically empty. Its production consumers now import
`semanticRouteSyntaxRelations.ts`.

The canonical model is catalog + Presence + relation selection/projection/expansion/
accumulation + recursive cursor relations. The legacy syntax model is not an authority.

PHP source `null` remains semantic data through the tagged null atom; absence is Presence.
