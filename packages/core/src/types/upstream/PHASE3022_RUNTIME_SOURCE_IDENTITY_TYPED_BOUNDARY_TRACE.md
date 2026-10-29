# Phase 3022 — Runtime Source Identity Typed Boundary Trace

## Scope
Trace the concrete `scan` / `sync` route that builds the upstream controller-invocation manifest. This phase makes a narrow runtime conversion at the source-file identity boundary; it does not claim repository-wide elimination of primitive types.

## Runtime trace (observed in source)

1. `packages/cli/src/commands/scan.ts` and `sync.ts` acquire the process root with `process.cwd()` and resolve the selected route file with `path.resolve(...)`.
2. Both commands now explicitly ingest those boundary path texts through `stringValue.create(...)` and hand the typed text to `sourceFileIdentityFactory.create(...)`.
3. The resulting `SourceFile` is supplied to `createLaravelSourceProjectIdentity.create(...)` and `sourceFileInventoryFactory.empty().include(...)`.
4. `laravelRouteSourceSelectionAuthority.explicitFiles(...)` owns the selected source-file inventory and `explicitIntent(...)` owns the route-selection intent.
5. `controllerInvocationManifestCompositionInputFactory.create(...)` builds the typed composition request.
6. `RouteSyncCliManifestScanOperationInterface.scan(...)` delegates to `ControllerInvocationManifestCompositionAuthorityInterface.compose(...)`.
7. Upstream composition canonicalizes project identity, discovers and reads source documents, binds source identity, prepares semantic judgments, closes the invocation inventory, and builds the manifest. The returned manifest is an executable terminal ADT consumed through `continueForDriftAudit(...)`, not a raw success/failure sentinel.

## Change

`sourceFileIdentityFactory` is an explicit interface-backed domain constructor. It accepts `StringValue`, not raw path text, and creates the `SourceFile` identity without recreating the source-text wrapper. The CLI runtime now uses this contract for both project-root and selected-route-file identities.

## Why this is not a complete primitive-removal claim

The operating system and Node path APIs provide path text as JavaScript strings. That is a legitimate leaf I/O boundary. The goal is to prevent raw text from crossing further domain boundaries without a typed representation, not to pretend external path text does not exist. The existing legacy `createSourceFile(value: string)` export and other upstream primitive-taking operations remain migration debt and are deliberately recorded rather than hidden by this phase.

## Findings / next source-owned migrations

- `packages/core/src/types/upstream/names.ts` still exports several name constructors as callable functions that accept raw text (for example `createModelName`, `createClassName`, `createControllerName`, and legacy `createSourceFile`). Convert them by domain family and migrate all call sites together; do not add another generic wrapper layer.
- `semanticDataflowKnowledge.ts` still has `semanticText(value: string)`, `semanticNumber(value: number)`, and `semanticBoolean(value: boolean)`. These are primitive-backed semantic facts; their owning ADT needs domain-specific construction/continuation, not just a renamed factory.
- CLI scan/sync still have platform boundary values such as `process.cwd()`, `path.resolve(...)`, CLI options, and `baseURL`. Keep those at ingestion boundaries, then represent route path, project root, and API base URL with their own domain values before semantic operations.
- `RouteSyncCliManifestScanOperationInterface`, `RouteSyncCliUpstreamCompositionInterface`, and the manifest terminal ADT are already interface-first at the observed CLI/manifest boundary. The remaining gap is upstream data construction, not a missing generic CLI factory.

## Constraints preserved

- No deleted `packages/core/src/semantic/relations/` foundation was restored.
- `packages/core/src/types/upstream/collections.ts` must remain the existing one-byte newline file.
- This phase does not claim all `string`, `number`, `boolean`, `undefined`, `null`, `??`, ternary, `reduce`, or array usage has been removed repository-wide.
