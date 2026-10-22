# Phase 2435 — Manifest interface composition

## Change made

Added `createRouteManifestProjectionComposition` as an explicit composition root for the already-existing interface-first path:

`RequestTypeDerivationSemanticPipelineInterface → runtime executor → authority-backed lowering → authority-backed projection → RouteManifest lowerer`.

The factory requires the semantic pipeline as an argument. It does not manufacture a pipeline, fabricate a verified judgment, or fall back to the legacy solver. Its result is a closed ADT: `manifest_projected` or `manifest_projection_blocked`.

## Important limitation

This phase does **not** claim the production semantic pipeline is complete. Repository tracing still finds no concrete production implementation of the reasoning, proof verifier, decision, and authority capabilities needed to assemble that pipeline. Consequently, this composition root cannot yet be installed into `scan.ts` / `sync.ts` without first supplying those real capabilities. The CLI's current default projection path remains the legacy path; this phase adds and validates the missing composition connection but does not misrepresent the CLI cutover as complete.

## Validation

Run:

`node scripts/audits/audit-phase2435-manifest-interface-composition.cjs`

This is a source-structure audit only. It is not a substitute for typecheck, unit tests, build, or CLI integration tests.
