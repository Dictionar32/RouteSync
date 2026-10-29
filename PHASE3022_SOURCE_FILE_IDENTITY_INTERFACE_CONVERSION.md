# Phase 3022 — Source-file identity interface conversion

## Scope

This phase converts the source-file identity constructor on the real CLI manifest path. It is deliberately a domain-owned migration, not a repository-wide claim that every primitive has been removed.

## Runtime trace

`packages/cli/src/commands/scan.ts` / `sync.ts`
→ `RouteSyncCliManifestScanOperationInterface.scan(input)`
→ `controllerInvocationManifestCompositionAuthority.compose(input)`
→ source discovery / source-document identity construction
→ `sourceFileIdentityFactory.create(StringValue)`
→ source-file inventory / manifest composition.

The CLI commands continue to consume the existing manifest operation interface; no parallel manifest authority or relation-foundation module was introduced.

## Conversion

- Removed the legacy `createSourceFile(value: string): SourceFile` factory.
- Migrated production and test call sites to `sourceFileIdentityFactory.create(stringValue.create(sourcePath))`.
- Migrated the public core export and semantic-value compatibility export to the typed factory.
- The source-file identity factory now receives a `StringValue`, rather than a raw `string`.
- `StringValue` is still used at the raw-text ingestion boundary. This phase does **not** claim that all `string`, `number`, `boolean`, `null`, `undefined`, `reduce`, array literals, nullish coalescing, or ternaries have been removed repository-wide.

## Verification

- Audit: run `node scripts/audits/audit-phase3022-source-file-identity-interface-conversion.cjs`.
- TypeScript transpilation syntax scan: 2,368 `.ts` files, 0 syntax diagnostics.
- Full typecheck could not run: workspace has no installed project dependencies / type definitions, and the available global TypeScript 5.8.3 does not support the repository's configured target and lib options. No typecheck success is claimed.
- Tests were not run.

## Next conversion targets

1. Convert `names.ts` raw-string domain factories (model, class, controller, action, method, column, route) to explicit per-domain factory interfaces that accept domain-typed source text, migrating their runtime consumers.
2. Audit remaining `numberValue` / `truthValue` consumers by semantic ownership before choosing domain ADTs; do not replace primitives with aliases as a cosmetic wrapper.
3. Continue auditing the real CLI → manifest path for primitive fallbacks, `??`, ternaries, and duplicated semantic decisions; preserve source provenance and blockers.
