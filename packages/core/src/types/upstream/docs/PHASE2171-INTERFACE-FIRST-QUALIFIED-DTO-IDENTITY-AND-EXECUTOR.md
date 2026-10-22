# Phase 2171 — Interface-first qualified DTO identity and runtime executor

## Scope

This phase changes upstream contracts only. It does not wire a new resolver into the Laravel scanner and does not replace the legacy response-attribute derivation path. The scanner trace is retained here to prevent the new interface from being mistaken for an already-integrated implementation.

## Trace findings

1. `dtoAstCanonical.ts::scanDtoAsts` currently returns `readonly DtoAst[]`, and reads only `app/Http/DTOs`.
2. `scannerUtils.ts::collectPhpFiles` maps a missing directory to an empty array. Therefore the legacy scanner cannot distinguish a valid empty directory from a missing discovery root.
3. `dtoAstCanonical.ts` reads the class token after `class`, but does not retain the PHP namespace/import context as a qualified class-name judgment. It also imports `relation*` helpers; no new relation/foundation layer is introduced here, and removal from this scanner path remains a separate implementation step after the contract boundary is settled.
4. `LaravelControllerScanInput.dtoInventory`, the response evidence producer input, and the integrated response judgment input still accept `readonly DtoAst[]`. They do not yet accept the new complete/incomplete discovery ADT.
5. `responseAttributeScanner.ts` still contains filesystem/name-fallback resolution and remains the legacy source of resolved response descriptors. It is not yet delegated to the DTO declaration authority.
6. Invocation semantic judgment already has a separate upstream authority and transparent runtime executor. This phase does not create a second invocation authority or alter invocation ownership.
7. The response semantic authority already owns the closed response judgment and its runtime executor contract. The DTO declaration authority is an upstream dependency candidate, not a replacement for integrated response judgment.

## Contract changes

- Discovery scope is generic over the source project so its project root is indexed by `Project['root']`.
- A completed discovery receipt retains source files and declarations with explicit class identity evidence.
- DTO class identity is a closed ADT: qualified identity from the existing PHP class-name resolution model, or an explicit unresolved identity. A short class token is never promoted to canonical identity.
- Resolution input carries the existing `PhpClassNameResolution` result instead of a bare `ClassName`.
- Resolution outcomes distinguish missing/incomplete discovery, unresolved request identity, unresolved declaration identity, unique match, and ambiguity.
- A separate runtime executor interface delegates to the selected authority's `resolve` signature. It adds no classification method or fallback behavior.

## Integration gate — intentionally not done in this phase

Before wiring, the existing scanner producer must emit the discovery ADT, retain namespace/import evidence for each DTO, and avoid treating a missing scan root as an empty inventory. Then `LaravelControllerScanInput` and the response evidence production/integrated judgment inputs can be migrated together. Only after those contracts are satisfied should the existing response attribute path delegate to the DTO resolution authority and publish `response_dto_declaration` evidence. The existing invocation authority and integrated response authority remain the semantic owners.

## Verification status

Static source inspection only. Full build/typecheck was not run. No claim is made that the scanner is already wired to these contracts.
