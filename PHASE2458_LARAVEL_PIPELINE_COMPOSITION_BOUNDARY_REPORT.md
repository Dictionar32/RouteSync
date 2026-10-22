# Phase2458 — Laravel Pipeline Composition Boundary

## Scope

Focus A: reduce direct legacy-scanner ownership inside the active `laravelSourceAstPipeline.ts` runtime module. This phase reuses `LaravelSourceAstPipelineDependenciesInterface`; it does not introduce a duplicate scanner or composition interface.

## Changes

- Extracted the existing typed `laravelSourceAstPipelineDependencies` value and its scanner adapter values into `compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts`.
- Kept the actual input-bound `createLaravelSourceAstPipeline` executor in `laravelSourceAstPipeline.ts`; the executor still exposes a parameterless `execute()`.
- Updated `upstreamManifestBuilder.ts` to import the dependency value from its canonical composition owner.
- Retained a compatibility re-export from `laravelSourceAstPipeline.ts` so existing tests and internal consumers do not break due to an unrelated import-path migration.
- Added a static audit to guard the composition boundary.

## Root-cause trace and remaining debt

This is a boundary correction, not a claim that the subscanner subsystem is retired. The composition module still selects legacy implementations for models, Form Requests, migration, DTO inventory, query, schema, service, middleware, and provider scanning. Moving their selection out of the runtime executor makes the dependency boundary explicit, but does not by itself change the semantic owner of those implementations. Those need to be migrated operation-by-operation to existing upstream contracts and genuine upstream implementations before deleting `subscanners`.

`ChannelScanner.scanCanonicalAsts(sourceProject)` remains a direct legacy call. The existing `LaravelChannelScannerInterface` requires source-backed subscription evidence and `BroadcastChannelKindJudgmentAuthority`, neither of which is available in the active pipeline input. This phase deliberately does not fake that evidence, add an empty evidence list, or invent a second interface. Channel migration remains blocked until its upstream evidence producer and authority are connected.

No claim is made that all `semantic/relations` or `semantic/foundation` dependencies have been eliminated transitively. This phase targets A only.

## Verification

Run:

```bash
node scripts/audits/audit-phase2458-laravel-pipeline-composition-boundary.cjs
node scripts/audits/audit-phase2457-upstream-resource-evidence.cjs
node scripts/audits/audit-phase2456-existing-contract-reuse.cjs
```

Typecheck, build, Vitest, and CLI end-to-end are not claimed as run in this workspace snapshot because `node_modules` is not present.
