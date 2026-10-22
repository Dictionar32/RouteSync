# Phase 2275 — Interface-first semantic vocabulary closure

## Changes

- Strengthened the existing `ResourceSemanticMappingAuthorityInterface` contract so semantic source and target vocabularies are closed literal unions rather than unconstrained `string` values.
- Reused the existing upstream authority and existing mapping algebra; no V2 interface, generic wrapper, or duplicate authority was introduced.
- Typed the upstream semantic mapping pairs against the closed source/target vocabulary.
- Removed the conversion of semantic mapping results through `String(item.arguments[0])`; the authority now returns the target vocabulary type from its declared mapping.
- Retired the unused `compiler/scanner/subscanners/resource/resourceSemanticMappingRelations.ts` compatibility facade because repository search found no consumers. The file remains present and intentionally contains no implementation.

## Remaining work (not claimed complete)

- `phpAstExpressionMappings.ts` still contains projection-side handler tables for several AST variants. Those must be migrated only after tracing their existing upstream ADTs and contracts.
- `resourceAstExpressionMapper.ts` and several resource subscanner files remain active consumers in controller, binder, and resource producer paths. They cannot safely be emptied until each consumer is migrated to the upstream-owned route AST authority.
- `semantic/relations` remains imported by other upstream mapping and projection operations; this phase does not claim full removal from the entire expression path.
- CLI end-to-end behavior, package type-check, and build have not been verified in this environment.

## Acceptance criteria

1. `resolveSemanticKind` accepts only the declared source vocabulary and returns only the declared target vocabulary.
2. No second compatibility implementation remains in the retired resource mapping facade.
3. No new foundation dependency or duplicate V2 interface is introduced.
4. Active subscanner paths are not emptied prematurely; they require consumer migration and CLI trace first.
