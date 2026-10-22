# Phase 2295 Trace — Laravel Attribute Scan Discovery Closure

## Actual CLI path

`packages/cli/src/commands/scan.ts` → `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` → `manifestBuilder.build(...)` / `constructRouteSyncManifest(...)` in `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` → `laravelSourceAstPipeline.execute(...)` → `dependencies.attributeScanner.scan(sourceProject)` → `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts` → `collectPhpFiles(app/Attributes)` and `scanAttribute(...)`.

## Root-cause trace

- `attributeAstCanonical.ts` scopes the scan to `<projectRoot>/app/Attributes`.
- `scannerUtils.collectPhpFiles` currently returns an empty list when the directory does not exist.
- File read and declaration parsing errors may reject the scan promise instead of becoming typed blocked outcomes.
- The old complete judgment does not retain a file-level discovery receipt; `attributes` and contextual declarations are separate output collections.
- Therefore, `closed: true` alone did not prove the discovery boundary had been closed, and an absent scan root could be confused with a successful empty scan.

## Phase 2295 changes

- Evolved `LaravelAttributeScannerInterface` from contract version 12 to 13.
- Introduced a typed scope for `app/Attributes`.
- Added a closed discovery receipt with a source-ordered sequence of per-file AST and contextuality evidence.
- Removed the parallel AST array from the complete judgment; AST products are carried by the receipt's per-file evidence.
- Added typed discovery blockers, distinct from PHP name-resolution blockers.
- Made blocked outcomes require at least one typed failure and preserve only partial discovered-file paths.
- Attached the declared scan scope to the contextual inventory.

## Remaining work

1. Migrate `attributeAstCanonical.ts` to produce the receipt and typed discovery blockers.
2. Change `scannerUtils.collectPhpFiles` ownership so missing/unreadable directories and traversal failures cannot silently become empty results; do not retain `semantic/relations` on the migrated path.
3. Migrate `laravelSourceAstPipeline.ts` to consume file evidence from the complete receipt and preserve blocked judgments.
4. Update `upstreamManifestBuilder.ts` / CLI handling for the new failure ADT without flattening discovery failures into generic errors.
5. Add PHP fixtures for absent scope, empty existing scope, unreadable file, parse failure, alias import, multiple interfaces, and unresolved interface names.

No TypeScript typecheck or build was run.
