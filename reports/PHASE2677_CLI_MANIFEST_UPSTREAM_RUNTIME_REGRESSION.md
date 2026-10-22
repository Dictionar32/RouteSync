# Phase 2677 — CLI / Manifest / Upstream Runtime Regression

## Change applied

Added `requestTypeDerivationInventoryAstGate.phase2677.test.ts` to exercise the proof verifier with a forged canonical resource inventory that remains internally self-consistent but disagrees with the raw AST. The regression was tightened to use a single source resource and assert that the semantic producer naturally emits `kind: 'derived'`. It then forges only the prepared inventory identity while preserving that genuine judgment, requiring the verifier to reject the inventory at its common entry gate before judgment-specific dispatch.

The expected outcome is the typed `RequestTypeDerivationSemanticProducerGapError` at stage `verification`, with the inventory/AST mismatch capability. No fallback, normalization, or successful projection is permitted.

Added `scripts/audits/audit-phase2677-cli-manifest-upstream-runtime-regression.cjs` and registered `audit:phase2677-cli-manifest-upstream-runtime-regression` in `package.json` to check that the regression and common verifier gate remain wired.

## Validation performed

- Existing Phase 2657, 2659–2661, and 2663–2676 structural audits: all 17 invoked scripts exited successfully.
- Phase 2676 CLI/manifest/upstream identity gate: 20/20 assertions passed.
- Phase 2677 regression source audit: 10/10 assertions passed (after tightening the natural-derived-path regression).
- Vitest regression execution: **not run**. `npm ci --ignore-scripts --offline` could not complete because the npm cache does not contain `verkit@0.3.2` (`ENOTCACHED`).
- TypeScript compilation: not run because dependencies could not be fully installed.
- Laravel CLI `scan`/`sync`: not run; this change does not claim live Laravel integration coverage.
- Full canonical semantic-law verification: remains incomplete.

## Scope and limits

The regression source and static audit are updated in the workspace. Runtime behavior is not verified until project dependencies are available and Vitest is executed. This closes a missing regression artifact, not all semantic laws or the end-to-end CLI/runtime proof.

## Upstream runtime trace and remaining root cause

Observed source path:

1. `packages/cli/src/index.ts` loads only the host module configured by `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE`; missing/invalid composition is a fail-closed CLI result.
2. `createProgramFromSemanticComposition` joins that host semantic bundle with `controllerInvocationManifestCompositionAuthority` through `composeRouteSyncCliUpstream`.
3. `scan.ts` and `sync.ts` consume the injected `composition.requestTypeDerivationPipeline`, compose the complete source manifest, call `routeManifestRequestResolutionPreflight.evaluate(completeManifest)`, and pass that exact preflight packet to `createRouteManifestProjectionComposition(...).project(...)`.
4. `routeManifestProjectionComposition.ts` lowers the manifest only for `kind: 'projected'`; a non-projectable judgment stays a typed blocked result.
5. The proof verifier now checks inventory-to-raw-AST identity before branching on the judgment. The Phase 2677 regression uses a genuine producer-created `derived` judgment and tampers only the prepared inventory.

**Remaining production blocker (not hidden):** `requestTypeDerivationSemanticComposition.ts` is explicitly diagnostic. Its decision, authority, and integrity operations throw typed producer-gap errors, and `requestTypeDerivationProductionComposition.ts` states that concrete production reasoning/verifier/decision/authority capabilities are not shipped here. Thus the repository contains the consumer wiring and fail-closed gate, but this does not prove a complete end-to-end successful `scan`/`sync` runtime. A host must provide real implementations sharing the exact `requestTypeDerivationContract`; do not point production at the diagnostic composition and do not restore the legacy `RequestType[]` fallback.

## Host composition usage contract

The configured host module must export `requestTypeDerivationSemanticComposition` with real, contract-identical `reasoning`, `verifier`, `decision`, `authority`, and `integrity` capabilities. The export name is a runtime loader contract, not merely a documentation convention. Conceptual shape (each referenced value must be a real implementation, not a placeholder):

```ts
import type { RequestTypeDerivationSemanticPipelineCompositionInterface } from '@routesync/core/upstream';
import { requestTypeDerivationContract } from '@routesync/core/upstream';

export const requestTypeDerivationSemanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface = Object.freeze({
  contract: requestTypeDerivationContract,
  reasoning: productionReasoning,
  verifier: completeProofVerifier,
  decision: productionDecision,
  authority: sourceBoundAuthority,
  integrity: completeIntegrityValidator,
});
```

This is an integration shape, not a drop-in implementation: those five capability values must be imported from or implemented by the host. Then set `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` to the built JavaScript module path before invoking the CLI. Runtime verification still requires dependency installation, Vitest, TypeScript build, and Laravel fixture integration tests.


## Phase 2678 — Runtime composition boundary tightening

### Root cause found

The standalone loader's type guard previously treated `authority.decisionRules` and `integrity.contractEquivalence` as valid whenever they were merely objects. That allowed a structurally incomplete host bundle to pass the loader boundary and fail later in semantic execution, despite the guard claiming the complete composition interface.

### Change applied in runtime path

- `packages/cli/src/standaloneCompositionLoader.ts` now imports the canonical `REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS` and verifies every required rule is present with value `required`.
- It now requires `integrity.contractEquivalence.equivalent` to be an executable function.
- `packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts` adds focused regressions for missing decision-rule coverage and missing contract-equivalence behavior.
- The Phase 2677 source audit now checks that these runtime gates and tests remain wired.

This change strengthens the actual CLI host-module loader. It does **not** implement the missing production semantic laws and does not turn the diagnostic composition into a production composition. The fail-closed semantic blocker remains explicit.
