# Phase 808 — Route Upstream Semantic Frontier

## Frontier

The local DTS build frontier after Phase 807 was confined to `semanticRouteSyntaxRelations.ts`:

- `RouteConstraintValueAst` is a branded scalar AST value, not an object with a nested `.value` field.
- `GroupPendingKey` selection carried a `Presence<GroupPendingKey>` through a relation option and attempted to project `.value` before eliminating the presence ADT.

## Model correction

1. Constraint group arguments now consume the existing upstream `StringValue` constructor directly from the branded AST value. No new parser-local value object or descriptor is introduced.
2. Group-pending candidate selection now eliminates the `Presence` ADT with `presenceFold` before producing the selected key. The relation layer therefore carries the full absence/presence judgment rather than leaking a host optional access.
3. The obsolete local `PresentGroupPendingKey` helper was removed because the canonical `Presence` eliminator is sufficient.

## Architectural intent

The scanner/lexer remains evidence production. The semantic relation layer consumes the existing upstream route-constraint algebra and presence algebra. No `Parsed*Descriptor` ontology is added.

## Validation

The Phase 808 static audit passes. A full `npm run build` could not be executed in the sandbox because the sandbox copy has no installed `tsup`; the authoritative build remains the user's local build.
