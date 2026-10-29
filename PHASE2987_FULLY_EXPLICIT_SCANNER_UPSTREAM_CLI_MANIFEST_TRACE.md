# Phase 2987 — Fully Explicit Scanner Operations: Upstream → CLI → Manifest

## Changes

- `packages/core/src/compiler/frontend/php/phpControlEvidence.ts` no longer imports `RelationOption` or `relationOptionFold` from the deleted `relationalSequence` foundation.
- Its exported runtime entry is now `export const phpControlEvidence: PhpControlEvidenceInterface = Object.freeze({ resolve: ... })`.
- The compatibility facade delegates directly to `scannerStatementControlContractAlgebra.resolve`; it does not own a duplicate PHP keyword table or rebuild the scanner judgment.
- Added `scripts/audits/audit-phase2987-fully-explicit-scanner-upstream-cli-manifest.cjs`, npm script `audit:phase2987-fully-explicit-scanner-upstream-cli-manifest`, and a machine-readable audit result.

## Verified source trace

```text
PHP TokenDescriptor evidence
  → compiler/frontend/php/astClassifierRuntime.ts
  → scannerStatementControlContractAlgebra.resolve(...)
  → closed ScannerStatementControlJudgment

CLI runtime composition
  → routeSyncCliUpstreamCompositionFactory.compose(...)
  → requestTypeDerivationProductionPipelineAssembler.assemble(...)
  → routeSyncCliManifestScanOperationFactory.create(authority)
  → authority.compose(input)
  → routeSyncManifestScanOperationFactory.create(preparation)
  → preparation.prepare(input).build()
  → laravelSourceAstPipeline.execute()
  → completeLaravelSourceModelBuilder.build(...)
  → ManifestBuilderJudgment
  → continueToFlow(projection)
  → RouteSyncManifestFlow
```

The scanner-control edge and the CLI/manifest composition chain are separate source traces; this audit does not falsely claim that the specific statement-control judgment is serialized as a manifest field. The PHP compatibility facade has no in-repository call sites; the actual AST runtime calls the upstream scanner algebra directly.

## Audit results and remaining work

- Structural checks verify explicit interface-typed runtime objects and visible call edges for scanner, CLI composition, manifest scan, and manifest projection.
- The audit also recounts imports from the three intentionally deleted relation modules. Any remaining imports are migration blockers, not a reason to restore the generic foundation. See `PHASE2987_FULLY_EXPLICIT_SCANNER_UPSTREAM_CLI_MANIFEST_AUDIT.json` for exact counts.
- Other PHP AST runtime areas still contain legacy relation-based helpers. This phase does not claim the full scanner or repository is relation-free.
- Laravel docs describe PHP route definitions, controller actions, and resource routes. RouteSync's TypeScript interface-typed operation objects are an internal architecture choice, not a Laravel syntax requirement.
- Full workspace typecheck/build/test status remains unverified because dependencies are absent in this workspace.
