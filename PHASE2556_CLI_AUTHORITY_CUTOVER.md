# RouteSync Phase 2556 — CLI Authority Cutover

## Intent

The active CLI manifest projection must go through the upstream RequestType semantic judgment path. A missing producer/verifier composition is an explicit blocker; the CLI must not fall back to the legacy `RequestType[]` solver.

## Source changes

- `routeManifestProjection.ts` now requires `RequestTypeDerivationSemanticPipelineInterface` and delegates to `createAuthorityBackedRouteManifestProjection`.
- CLI `scan` and `sync` now request that pipeline before projecting and exhaustively handle `projected | not_projectable`.
- `requireRequestTypeDerivationSemanticPipeline` is an explicit fail-closed composition boundary. It currently throws because this source snapshot has no concrete reasoning + full 32-law verifier + decision + authority composition.
- The legacy `routeManifestTypeLowering.ts` and solver remain in the tree but are no longer imported by the active `routeManifestProjection.ts` path. Retirement is deferred until the real producer/verifier is implemented and regressions pass.

## Deliberate limitation

This is a path cutover, not a functioning semantic producer. CLI scan/sync will fail at the explicit missing-composition boundary until the production pipeline is supplied. That is intentional and preferable to manufacturing a verified `derived` judgment from legacy output.

## Validation

Run `node scripts/audits/audit-phase2556-cli-authority-cutover.cjs`. This is a structural audit only. Typecheck, package build, and CLI integration tests have not been run in this workspace because dependencies are not installed.
