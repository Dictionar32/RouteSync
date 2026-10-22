# Phase 2446 — Active Manifest Path: Explicit Operation Data, Parameterless Execution

## Root cause

Phase 2445 changed `ManifestBuilderInterface.build` to a parameterless operation, but the active CLI composition still referenced a removed `manifestBuilder` singleton and called the previous `build(input)` contract. This left the production CLI wiring inconsistent with the upstream interface. In addition, `LaravelSourceAstPipelineInterface.execute(input)` still accepted runtime arguments even though its input was already modeled as `LaravelSourceAstPipelineExecutionInput`.

## Changes

- Evolved the existing `LaravelSourceAstPipelineInterface` to carry the exact `input` ADT and its declared `dependencies` as operation data; `execute()` now takes no arguments.
- Evolved the existing `createLaravelSourceAstPipeline` preparation boundary to bind both the dependency contract and source-AST input before execution. Removed the parameterized `executeLaravelSourceAstPipeline(dependencies, input)` helper and the unbound `laravelSourceAstPipeline` singleton.
- Updated `prepareManifestBuilderOperation` to prepare the source-AST operation with the exact invocation inventory receipt and route-selection intent, then call `sourceAstPipeline.execute()` without arguments.
- Fixed the active CLI composition path: it no longer imports or expects a removed `manifestBuilder` singleton. On a validated inventory receipt, it prepares `ManifestBuilderInput` through the existing upstream operation preparer and calls `.build()` without arguments.
- Removed the stale manifest-builder dependency from `ControllerInvocationManifestCompositionDependencies` and advanced that composition contract to version 6.
- Updated directly affected tests and audit scripts so they verify current ownership and signatures instead of stale parameterized execution contracts.

## Architectural boundary

The preparation boundaries still accept typed data because they must construct an explicit operation. The execution methods `ManifestBuilderInterface.build()` and `LaravelSourceAstPipelineInterface.execute()` do not accept parameters. Their request data remains inspectable through each operation's `input` property; it is not hidden in a closure or global mutable state. Source acquisition, scanner operations, and CLI filesystem reads still require their own typed source inputs and are not claimed to be parameterless.

No `semantic/foundation` or `semantic/relations` dependency was added by this phase. This phase does not claim to migrate every remaining runtime executor in RouteSync.

## Verification

- Phase 2446 active manifest operation wiring: 14/14 structural assertions passed.
- Phase 2445 runtime forwarder removal audit: 13/13 passed.
- Phase 2390 evolved CLI composition audit: 13/13 passed.
- Phase 2387 evolved manifest operation audit: 12/12 passed.
- Phase 2311 evolved source-AST operation audit: 10/10 passed.
- Phase 2415 route-response blocker regression audit: 14/14 passed.
- Syntax-only TypeScript transpilation: 8/8 changed TypeScript files passed.
- Full TypeScript typecheck, package build, Vitest, and CLI end-to-end were not run. The extracted workspace has no `node_modules`, and the available global TypeScript 5.8.3 cannot parse this repository’s ES2025 tsconfig and encounters two pre-existing syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts`.
