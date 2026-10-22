# Phase 2349 — Legacy RouteScanner Barrel Closure

## Finding

The canonical route path is already wired through `LaravelRouteScannerInterface` in `laravelSourceAstPipelineDependencies`. A repository-wide source trace found no production import or instantiation of `compiler/scanner/subscanners/RouteScanner`; its only source-level export was the internal `subscanners/index.ts` barrel. The class still contains its own route scanning implementation and `semantic/relations` imports, so leaving it on the barrel makes a retired competing path discoverable and encourages accidental re-entry.

## Change

Removed the `RouteScanner` export from `compiler/scanner/subscanners/index.ts`. The legacy source file is retained and not deleted or rewritten in this phase. The canonical `LaravelRouteScannerInterface` and its existing pipeline wiring remain the active route boundary. No replacement scanner, second authority, or V2 contract was added.

## Scope and limits

This closes only the internal barrel export. It does **not** claim that the legacy file is empty, that all route-emission helpers under `subscanners/route-scanner` have migrated, or that all `semantic/relations` imports have been removed from the active route producer path. Those require a separate dependency/consumer migration.
