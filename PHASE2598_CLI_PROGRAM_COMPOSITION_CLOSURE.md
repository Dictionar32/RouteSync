# RouteSync Phase 2598 — CLI Program Composition Closure

## Root cause

The CLI module still exposed two ways to obtain a command tree without the complete upstream composition:

- `createProgram` accepted an optional `RouteSyncCliUpstreamCompositionInterface`.
- the module constructed and exported a singleton with `createProgram()`.

Although `scan` and `sync` had local fail-closed checks, the public factory and singleton weakened the architecture boundary: a consumer could construct or import an uncomposed command tree and only discover the missing capability after command dispatch.

## Source change

- `createProgram` now requires `RouteSyncCliUpstreamCompositionInterface`.
- `createProgramFromSemanticComposition` remains the supported factory and passes the exact resolved composition to `createProgram`.
- the uncomposed `program` singleton is no longer constructed or exported.
- the standalone binary still resolves the explicit missing-composition case through the canonical upstream resolution ADT and exits without dispatching commands.

This closes an API/wiring bypass; it does **not** implement the missing semantic producer, full 34-law verifier, or production composition root. The standalone binary therefore remains intentionally blocked until those capabilities are supplied.

## Architecture path

```text
semantic capability bundle
  → composeRouteSyncCliUpstream(canonical manifest authority, bundle)
  → upstream semantic pipeline assembly
  → routesync_cli_upstream_composition_available
  → createProgram(resolution.composition)
  → command dispatch
```

The standalone entrypoint has no such bundle yet, so its path remains:

```text
missing composition → canonical upstream unavailable ADT → diagnostic + exit code 1
```

## Validation

Run:

```sh
node scripts/audits/audit-phase2598-cli-program-composition-closure.cjs
node scripts/audits/audit-phase2597-cli-manifest-upstream-root-cause.cjs
node scripts/audits/audit-phase2596-cli-executable-upstream-gate.cjs
```

These are structural assertions. Full TypeScript typecheck, Vitest, package build, and integration against a real Laravel project still need to be run in the repository's supported development environment.
