# RouteSync Phase 2400 — CLI Path Resolution Regression

## Audit and trace

The Phase 2399 manifest-flow change added invocation judgment serialization to both `scan` and `sync`. Tracing the actual `sync` command exposed a concrete CLI execution defect unrelated to semantic judgment ownership: `sync.ts` called `path.resolve(...)` before declaring/importing `path`. The only later declaration was `pathModule`, and that name was also used for manifest and IR paths. The first route-input resolution therefore raised a `ReferenceError` before the source pipeline could execute.

## Root cause

The `sync` command used a Node path API without a binding in module scope. This prevented the newly connected invocation judgment → manifest flow → CLI path from being exercised by `sync` at all.

## Change

- Imported Node's `path` module as `path` from `node:path`.
- Routed route-input, manifest, dataflow, dataflow IR, and IR output path resolution through that imported module.
- Removed the inconsistent `pathModule` local binding.
- Kept invocation judgment serialization on the existing manifest-flow ADT. No judgment reconstruction, response classification, new semantic interface, `semantic/foundation`, or `semantic/relations` dependency was added.
- Added `scripts/audits/audit-phase2400-cli-path-resolution-regression.cjs` to guard the path-binding regression and scan/sync artifact boundary.

## Verification

The Phase 2400 source audit and TypeScript syntax transpilation were run on the changed CLI source. Previous structural audits for Phases 2396–2399 were also run. Package build, full typecheck, Vitest, and live `scan`/`sync` execution were not run because dependencies are not installed in this workspace; therefore end-to-end CLI success is not claimed.

## Remaining work

Run `scan` and `sync` with the project's supported dependency installation and a Laravel fixture, then assert that the invocation artifact contains the expected source identities and every canonical response outcome. Continue tracing runtime executor outcomes and route scanner ownership separately.
