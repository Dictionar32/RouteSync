# Phase 2274 — Interface-first structural expression mapping

## Change

- Strengthened the existing `ResourceSemanticMappingAuthorityInterface` structural mapping signature with closed source-domain and target-domain unions.
- Preserved the existing authority and existing AST IR types; no V2 interface or generic wrapper was introduced.
- Changed structural mapping execution to return the target vocabulary from the upstream mapping table directly instead of invoking the semantic rewrite runtime and converting a relation fact back to `string`.
- Kept the change bounded to the structural mapping authority. This does not claim that all expression projection is now a pure executor.

## Remaining work

- `resolveSemanticKind` remains string-based and must be migrated through its existing upstream owner next.
- Scanner call sites still select AST constructors/handlers based on returned target discriminants. Those are the next projection boundary to audit; do not replace them with another string lookup layer.
- `semantic/relations` remains imported elsewhere in the expression pipeline and this phase does not claim it has been removed from the whole route.
- Trace the authority injection and all consumers through CLI before considering the route closed.

## Verification

- Source-level edits were made in the Phase 2273 project archive.
- Build and TypeScript type-check were not run in this environment.
