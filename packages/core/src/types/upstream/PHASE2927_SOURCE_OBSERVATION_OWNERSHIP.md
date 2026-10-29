# Phase 2927 — Source Observation Decision Ownership

## Trace

CLI scan/sync → manifest scan operation → manifest composition → source AST pipeline → `LaravelRouteScannerInterface.prepare` → `LaravelRouteDeclarationCompositionAuthority.resolveSourceFiles` → source selection intent → `observeFiles(selectedFiles, missingFiles)` → route scan outcome → source AST projection → manifest judgment → CLI blocker/manifest projection.

## Root-cause change

Phase 2926 separated filesystem path construction from the source-selection ADT, but the missing-file policy was still implemented in `routeDeclarationComposition.ts`. That left the domain decision in a composition runtime and made the ADT mostly a carrier of intent. Phase 2927 moves the *policy decision* into the existing intent variants themselves:

- The default intent owns the rule that conventional route files may be absent and records each selected file as scanned or absent-optional.
- The explicit intent owns the rule that any explicitly selected missing file blocks the scan and preserves the exact missing inventory.
- Both result variants expose domain operations to visit their observations or missing-file evidence.
- `routeDeclarationComposition.ts` now delegates to `input.intent.observeFiles(...)`; it no longer checks the intent discriminator or decides whether absence blocks.
- The scanner contract reuses the source-observation judgment from the source-selection domain module instead of redeclaring it.

This is not a claim that every branch in the complete scanner/manifest pipeline has been eliminated. The scanner still consumes the blocked-versus-ready result to decide whether to schedule source reads, and the filesystem boundary still checks file existence. This phase specifically removes source-absence policy reasoning from the composition runtime and assigns it to the existing domain intent ADT.

## Verification

Run `npm run audit:phase2927-source-observation-ownership`. Focused tests were added for default-optional and explicit-blocked behavior. Full TypeScript semantic typecheck, Vitest, build, and CLI E2E must be reported only if actually run in an environment with the project's pinned dependencies.
