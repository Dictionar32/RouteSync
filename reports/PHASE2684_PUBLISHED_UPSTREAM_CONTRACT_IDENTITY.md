# Phase 2684 — Published Upstream Contract Identity Repair

## Root cause found

Phase 2683 documented `@routesync/core/upstream` as a public package specifier. That is a workspace source alias used by TypeScript path resolution, not the public package subpath declared by the root package. The published package is named `routesync` and its `package.json` exports `./upstream` to `./dist/upstream.mjs` / `./dist/upstream.js`.

A second runtime bug followed from the previous fix: the CLI's bundled contract and the separately built `routesync/upstream` module can be different JavaScript object instances even when their contract values are identical. Requiring `composition.contract === requestTypeDerivationContract` therefore rejects the public built entrypoint for module-identity reasons unrelated to semantic compatibility.

## Changes

- Updated runtime usage to `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE=routesync/upstream`.
- Updated the regression integration test to load the published package subpath rather than the workspace-only alias.
- Changed the loader's cross-module contract check to recursive structural equality against the canonical contract value. This is not a loose shape-only check: all contract fields, policy values, and law coverage must match exactly.
- Retained exact object identity binding between the loaded composition's own `contract` and each capability (`reasoning`, `verifier`, `decision`, `authority`, `integrity`). This preserves internal source/capability coherence while allowing a separately bundled canonical contract instance.
- Added tests for accepting a structurally identical contract from another module graph and rejecting a contract whose policy differs.
- Corrected the Phase 2683 and Phase 2661 source audits to assert the actual published-export behavior rather than the old object-identity assumption.

## Runtime trace

`ROUTESYNC_UPSTREAM_COMPOSITION_MODULE=routesync/upstream` → root package `exports["./upstream"]` → built `dist/upstream.mjs`/`dist/upstream.js` → named `requestTypeDerivationSemanticComposition` → exact canonical contract value comparison → same-composition capability identity checks → CLI assembly → `scan`/`sync` → complete manifest preflight → projection.

## Verification

Source audits executed:

- Phase 2684 published upstream contract identity: 9/9
- Phase 2683 runtime package-export trace: 8/8
- Phase 2680 CLI manifest interface-first runtime trace: 20/20
- Phase 2682 semantic producer/runtime wiring: 9/9
- Phase 2677 runtime regression: 16/16
- Phase 2661 fail-closed loader: 6/6

These are structural audit results. TypeScript compilation, Vitest, package build, and end-to-end execution of the published package export remain unverified because dependencies/build outputs are not present in the extracted workspace. The verifier's incomplete proof-law coverage also remains an explicit limitation; this phase repairs package-export/runtime identity, not the remaining semantic proof obligations.
