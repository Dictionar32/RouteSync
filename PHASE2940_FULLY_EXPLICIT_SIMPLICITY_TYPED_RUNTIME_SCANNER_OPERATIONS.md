# Phase2940 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope

Integrate the existing `PhpSourceDocumentReaderInterface` and source-read ADTs into the Laravel route scanner, so a file read failure remains a typed blocker instead of escaping as a rejected `readFile` promise.

## Changes

1. Added `packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts` as an interface-first runtime adapter and made CLI manifest composition reuse this same reader rather than keeping a duplicate private implementation. It translates Node filesystem errors at the platform boundary to the existing `FilesystemFailureCode` ADT, then creates the existing `PhpSourceDocumentReadResult` complete/blocked judgment.
2. Injected `PhpSourceDocumentReaderInterface` into `LaravelRouteScannerInterface` and its factory authorities.
3. Replaced direct `fs.promises.readFile` in `laravelRouteScanner.ts` with the injected reader and the existing `phpSourceDocumentReadBatchFactory`.
4. Added the distinct `LaravelRouteScanSourceReadBlockedJudgment`; it preserves partial documents and the exact blocked read evidence rather than misreporting the event as an explicitly selected missing file. The ADT owns `continueToSourceAstProjection()` to carry that exact judgment into the AST-projection domain operation.
5. Added `laravel_source_ast_projection_route_source_read_blocked` so the manifest pipeline preserves this blocker through the existing AST judgment and manifest blocked terminal.
6. Updated route-scanner contract version to 38, prepared route-scan operation version to 3, and AST-pipeline contract version to 19.
7. Exported the source reader and the new judgment through the public core barrel. `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime trace

`CLI manifest composition -> LaravelSourceAstPipelineInterface.execute -> LaravelRouteScannerInterface.prepare -> source observation -> PhpSourceDocumentReaderInterface.read -> PhpSourceDocumentReadBatchJudgment.continueWith -> route scan complete OR LaravelRouteScanSourceReadBlockedJudgment.continueToSourceAstProjection() -> AST projection judgment -> ManifestBuilderJudgment -> CLI terminal operation`. The CLI manifest composition reuses the same exported reader; its previous private duplicate reader was removed.

## Structural audit

`node scripts/audits/audit-phase2940-simple-typed-route-source-read.cjs`

Result: 11/11 structural checks passed. The checks cover no direct `fs.promises.readFile` in route scanner, interface-first reader export, use of existing read-result and batch ADTs, explicit read-blocked route judgment, AST blocker propagation, barrel export, no exported function declaration in the new reader, and empty `collections.ts`.

## Repository-wide export-function audit

A repository-wide text scan of TypeScript under `packages/core/src` and `packages/cli/src` found 480 `export function` declarations. This phase does not claim to remove all 480; its implementation scope is the source-reader and route-manifest path. Global migration must be staged module-by-module against existing interfaces and callers.

## Verification limits

- TypeScript `transpileModule` syntax checks passed for all seven changed TypeScript files.
- Full typecheck could not run in this workspace: required global types for `Array`, `Object`, etc., `@types/node`, and `vitest/globals` are unavailable; installed global TypeScript also does not accept this repository's `ES2025` target/lib settings.
- Unit tests, build, and CLI end-to-end were not verified.
- This phase does not claim that all repository runtime exports have been globally audited or that every downstream domain conditional has been removed.
