# Phase 1346 — Portable declaration generator boundary

## Change

The declaration generator in `tsdown.config.ts` now selects `tsc` rather than `tsgo`. The previous local build stopped before declaration analysis because TypeScript 7's `tsgo` path could not resolve the platform package `@typescript/typescript-linux-x64`.

The dedicated `tsconfig.dts.json` remains in place with `isolatedDeclarations: false`, while the root `tsconfig.json` keeps its existing `isolatedDeclarations: true` setting. This avoids relying on the missing tsgo native binary and allows the declaration generator to infer exported declaration types through its compiler path.

## Scope and verification

- No upstream source files were emptied or removed.
- Existing package scripts were preserved; one audit script was added.
- Run `npm run audit:phase1346-dts-generator-portable-boundary` to verify the configuration boundary.
- A successful full build is not claimed here: this workspace does not contain the user's installed `node_modules`, so the actual local generator execution must be verified in the user's environment.
