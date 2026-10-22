# Phase 2272 — Static Expression Semantics Owned Upstream

## Change made

This phase evolves the existing `ResourceSemanticMappingAuthorityInterface`; it does not add a second authority or a generic wrapper.

- `resolveStaticReceiverKind(...): string` became `resolveStaticReceiver(...): StaticReceiver`.
- `resolveStaticActionKind(...): string` became `resolveStaticAction(...): StaticMethodAction`.
- The upstream algebra now returns complete, existing expression ADTs for `DB`, `Attribute`, ordinary class receivers, `DB::raw`, and domain static actions.
- `phpAstExpressionMappings.ts` no longer classifies those results through string-keyed constructor tables or performs a second conversion.
- The resource compatibility facade now re-exports the new authority operations.
- The existing authority test now checks completed semantic values instead of string labels.
- Obsolete static receiver/action string mapping entries were removed from the general mapping rule table.

## Intended boundary

`PHP AST evidence -> existing upstream resource semantic authority -> completed StaticReceiver / StaticMethodAction ADT -> expression projection`.

The projection delegates; it no longer performs a second semantic lookup for static receiver/action.

## Verification status

- Source references to the removed `resolveStaticReceiverKind` and `resolveStaticActionKind` authority API were searched; no remaining references were found in `packages/core/src` after updating the compatibility facade and test.
- Build and type-check were not run. This environment does not have project dependencies installed, and the repository workflow explicitly avoids running `npm run build` here.
- This phase does not claim that all `semantic/relations` imports have been eliminated from PHP expression projection. Other expression and structural mappings remain a separate migration surface.
- No `semantic/foundation` imports or dependencies were added.

## Next trace target

Continue from the remaining structural mapping functions in `phpAstExpressionMappings.ts`, then trace the injected `PhpAstExpressionSemanticAuthorityInterface` through controller dataflow, service, model, provider, request, resource, and CLI wiring. Migrate each decision at its existing upstream owner before removing any compatibility surface.
