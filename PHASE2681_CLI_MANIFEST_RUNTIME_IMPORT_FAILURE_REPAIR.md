# Phase 2681 — CLI manifest runtime import failure repair

## Root cause

The standalone CLI already required the named upstream export `requestTypeDerivationSemanticComposition` and validated the capability shape. However, a configured module that could not be resolved or threw during module evaluation escaped `loadRouteSyncStandaloneComposition` as a rejected promise. That bypassed the loader's explicit result ADT and the CLI's deliberate non-zero fail-closed diagnostic branch.

A second audit defect was stale: the Phase 2661 structural audit expected a single-line import spelling even though the loader correctly imported the canonical contract from `@routesync/core/upstream` in a multiline import. The stale matcher produced a false negative.

## Changes

- `packages/cli/src/standaloneCompositionLoader.ts`
  - Added `composition_module_import_failed` to `RouteSyncStandaloneCompositionLoadResult`.
  - Wrapped the configured dynamic `import()` in `try/catch` and returned the typed failure with module path and error message.
  - Did not add a diagnostic-composition fallback.
- `packages/cli/src/index.ts`
  - Added an explicit `composition_module_import_failed` branch that prints a diagnostic and sets `process.exitCode = 1`.
- `packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts`
  - Added a regression test for a configured but unresolvable module.
- `scripts/audits/audit-phase2661-cli-composition-fail-closed.cjs`
  - Corrected the stale import matcher and asserted the new typed import-failure branch.
- `scripts/audits/audit-phase2680-cli-manifest-interface-first-runtime-trace.cjs`
  - Extended runtime trace assertions to cover typed import failure and the regression test.

## Verification performed

- Phase 2680 interface-first runtime trace audit: **17/17** structural checks passed.
- Phase 2661 fail-closed audit: **6/6** structural checks passed.
- Phase 2620 public manifest interface/export audit: **14/14** structural checks passed.
- Phase 2621 upstream manifest authority/identity audit: **14/14** structural checks passed.

These are source-level audit results. Vitest, TypeScript typecheck/build, and Laravel scan/sync integration were not run because dependencies are not installed in this extracted workspace.

## Runtime path retained

`ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` → dynamic import → named export `requestTypeDerivationSemanticComposition` → canonical contract/capability validation → CLI program assembly → `scan` / `sync` → complete source manifest → request-resolution preflight → manifest projection.

The composition and host template continue to use the required interface-first declaration form:

`export const requestTypeDerivationSemanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface = ...`

## Remaining semantic blocker (not masked)

The repository's in-repository diagnostic composition still throws typed `RequestTypeDerivationSemanticProducerGapError` at decision, authority, and integrity. The example's `productionCapabilities.js` is intentionally a host-owned implementation seam and is not supplied by this repository. Therefore the workspace is not yet a self-contained production semantic composition; a passing shape audit does not prove semantic judgment correctness or end-to-end production execution.
