# Phase2433 — Manifest CLI Regression Repair and Authority Trace

## Change actually made

`packages/cli/src/commands/sync.ts` wrote `routesync.request-type-source-evidence.json` using `path.dirname(outputPath)`, but `outputPath` is not declared in the `sync` command. The evidence file now uses the same current-working-directory convention as the invocation/dataflow artifacts emitted by `sync`.

## Trace result

The active RequestType route remains:

`CLI scan/sync` → `projectRouteSyncManifestForRouteManifest` → `routeManifestProjection` → `routeManifestTypeLowering` → `requestTypeDerivationProjectionPipeline.derive` → `createDerivationContext` → `aggregateRequestTypeGroups`.

The authority-backed alternatives already exist:

- `createAuthorityBackedRouteManifestProjection(pipeline)`
- `createIntegratedRouteManifestAuthority(pipeline)`
- `createRequestTypeDerivationSemanticPipelineAssembler()`
- `createRequestTypeDerivationRuntimeExecutor(pipeline, consumer)`

However, this snapshot does not contain a production composition of the reasoning, proof verifier, semantic decision, and authority capabilities that can be passed into the assembler. The active projection does not receive an assembled pipeline. Wiring the existing authority path into CLI without that composition would require either inventing a judgment/proof from `RequestType[]` or introducing a semantic fallback. Neither is acceptable.

## Contract and safety decision

No interface or ADT was duplicated. No proof was fabricated. Runtime semantic behavior was not expanded. The remaining root cause is an integration gap between existing producer operations and the closed judgment/proof contract, followed by the missing composition root in the active CLI path.

## Validation scope

The Phase2433 audit script checks the repaired `sync` artifact path and confirms the active legacy projection plus the existing authority-backed alternatives. Its passing result is not evidence of complete RequestType authority integration. Full TypeScript typecheck, package build, Vitest, and end-to-end CLI execution are not claimed by this phase.
