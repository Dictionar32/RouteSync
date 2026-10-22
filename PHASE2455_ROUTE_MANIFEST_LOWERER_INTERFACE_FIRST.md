# Phase 2455 — Route Manifest Lowerer Interface-First Closure

## Scope

This phase makes the existing RouteManifest lowering operation an explicit, typed operation contract and removes the lowerer's direct `semantic/relations` dependency. It is a focused ownership repair, not a claim that the entire Laravel scanner or upstream manifest path is closed.

## Changes

- Added `RouteManifestLowererInterface` as the explicit contract for the downstream lowering operation.
- Replaced the exported free function as the public operation with `routeManifestLowerer: RouteManifestLowererInterface`.
- Migrated the integrated manifest authority and projection composition to call `routeManifestLowerer.lower(...)`.
- Removed direct `semantic/relations` imports from the lowerer. Channel descriptors now project the already-closed `ChannelKind` discriminant and its upstream `requiresAuthentication` judgment rather than invoking relation combinators.
- Exported the operation object and its contract from the core entry point.
- Added a focused audit script and package command.

## Validation

Run `npm run audit:phase2455-route-manifest-lowerer-interface-first` from the repository root. Full TypeScript typecheck, tests, package build, and CLI end-to-end validation have not been run in this workspace because dependencies are not installed here.

## Remaining architectural debts

- `routeManifestLowerer` still receives `RouteSyncManifest` and reads `manifest.ast.ast` for route flows, models, resources, and channels. Therefore the upstream manifest flow is not yet the sole downstream input; this remains a priority for a follow-up contract evolution.
- `laravelSourceAstPipeline.ts` still has direct `subscanners` imports and directly invokes the legacy `ChannelScanner`. The existing `LaravelChannelScannerInterface` requires source-backed subscription evidence and an authoritative kind judgment; wrapping the legacy scanner without those inputs would be a cosmetic and semantically invalid migration.
- This phase does not claim a repository-wide transitive closure for `semantic/foundation` or `semantic/relations`.
