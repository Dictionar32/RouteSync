# Phase 2683 — Runtime Package Export Trace

## Root cause

The CLI loader previously converted every configured module identifier into a filesystem URL. That made a package export specifier unusable even though the upstream composition was exported from the public `routesync/upstream` entrypoint declared by the root package's `exports` map and declared with `export const requestTypeDerivationSemanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface`.

This disconnected the interface-first runtime export from the loader path and encouraged filesystem/example wrappers.

## Change

- `packages/cli/src/standaloneCompositionLoader.ts` now distinguishes absolute/relative filesystem paths from bare package specifiers.
- Filesystem paths continue to resolve relative to the CLI working directory and are converted to `file:` URLs.
- Bare package specifiers are passed to Node's module resolver directly.
- The exact named export is still resolved and validated against the canonical contract and required executable capabilities. Missing/invalid modules remain fail-closed; no diagnostic fallback was added.
- A regression test loads `routesync/upstream` and checks that the loader returns the same exported runtime composition object.
- The host usage guide and previous Phase 2680 audit were updated to match the new resolver behavior.

## Runtime trace

`ROUTESYNC_UPSTREAM_COMPOSITION_MODULE=routesync/upstream` → package module resolution → `requestTypeDerivationSemanticComposition` named export → canonical composition shape/contract guard → CLI assembly → `scan`/`sync` → complete manifest preflight → projection.

## Structural audit results

- Phase 2683 runtime package-export trace: 8/8
- Phase 2680 CLI manifest interface-first runtime trace: 20/20
- Phase 2682 semantic producer/runtime wiring: 9/9
- Phase 2677 CLI manifest runtime regression: 16/16
- Phase 2661 CLI composition fail-closed: 6/6

These are source-structure audit results. They are not a substitute for executing Vitest, TypeScript build/typecheck, or end-to-end CLI runs. The in-repository verifier still explicitly reports incomplete proof-law coverage; this change does not claim that all 34 semantic laws are proven.

## Follow-up correction (Phase 2684)

The Phase 2683 package specifier was incorrect for the published package: `@routesync/core/upstream` is a workspace source alias, while the root package publishes `routesync/upstream` via `package.json` `exports`. Also, strict object identity against the CLI's bundled contract rejects the separately bundled upstream package. Phase 2684 changes the documented/runtime specifier and validates canonical contract structure across module graphs while retaining identity binding among capabilities inside the loaded composition.
