# Phase 2660 — source-ledger conflict preservation

## Implemented source correction

`packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts`

- Resource ambiguity and route-vs-FormRequest resource mismatch are represented in the route's primary disposition before request disposition is selected.
- Request ambiguity witnesses are collected from `preparedInput.requestResolutionLedger`, independently of the single primary route disposition.
- Resource ambiguity and mismatch witnesses are collected from `preparedInput.resourceResolutionLedger`.
- The existing canonical upstream conflict ADT is reused; it already contains `ambiguous_resource_identity` and `resource_identity_mismatch`, so no duplicate interface or parallel authority contract was introduced.

## Behavioral regression added

`packages/core/src/compiler/semantic/request-type-derivation/__test__/requestTypeDerivationIndependentConflictLedger.phase2660.test.ts`

The test sets up one route with both (1) two same-identity FormRequest candidates and (2) a route resource name that differs from the FormRequest binding resource name. It asserts that both witnesses survive in the conflict judgment and that the route receipt keeps the source-grounded resource mismatch disposition.

## CLI → manifest → upstream trace

`packages/cli/src/index.ts` → `standaloneCompositionLoader.ts` → `upstreamCompositionFactory.ts` → `controllerInvocationManifestCompositionAuthority` + semantic composition → canonical assembler → preparation/inventory/identity → request/resource resolution ledgers → reasoning → verifier → decision → authority/integrity → manifest projection.

At the original Phase 2660 checkpoint, the standalone loader substituted an in-repository diagnostic composition when no host module was configured. Phase 2661 below corrects that source-level fallback: the missing upstream module is now reported at the CLI composition boundary. The broader production pipeline remains incomplete because contribution/group-fold producers and complete decision/authority/integrity capabilities are still missing.

## Laravel upstream boundary

Laravel `ResourceRegistrar` derives resource wildcards from the resource name (including singularization, parameter mapping, and hyphen-to-underscore conversion), while `FormRequest` owns request validation behavior. These are related but distinct authorities. RouteSync must retain the route resource identity and the FormRequest binding identity separately until the resolution ledger establishes a relation; it must not silently overwrite one with the other.

## Verification — strict status

- `audit-phase2660-resource-resolution-conflict-witnesses.cjs`: structural source audit only; run locally after patch packaging.
- `audit-phase2659-identity-conflict-policy-alignment.cjs`: 14/14 structural assertions passed.
- Focused Vitest regression: **added, not executed** because this archive has no `node_modules`.
- Full TypeScript typecheck/build, full Vitest, CLI end-to-end, and complete verification of all 34 canonical laws: **not verified / still open**.
- Full contribution receipts, group-fold transitions, final derived `RequestType` production, and complete decision/authority/integrity implementation: **still open blockers**.

This patch fixes the independent conflict-witness loss path only. It does not claim the entire RequestType derivation pipeline is production-complete.


## Phase 2661 follow-up — CLI composition boundary correction

A second source-level issue was identified in the CLI composition path: `standaloneCompositionLoader.ts` returned the in-repository diagnostic composition when `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` was absent. The CLI already had a `composition_module_missing` failure branch, but the fallback made that branch unreachable for the missing-module case and deferred failure until an unsupported semantic operation threw a producer-gap error.

Correction:
- The loader now returns the typed `composition_module_missing` result for undefined, empty, or whitespace-only module paths.
- The CLI's existing branch sets a non-zero exit code and explains the required host capability bundle.
- The loader no longer imports or substitutes `requestTypeDerivationSemanticComposition`.
- A Vitest regression and structural audit were added for the missing-composition boundary.

This corrects the composition boundary so missing upstream authority is surfaced at its source rather than masquerading as an assembled pipeline. It does not implement the still-missing contribution/group-fold producers, full 34-law verification, or decision/authority/integrity production capabilities.

Verification status for Phase 2661:
- Structural audit: 5/5 assertions passed in the packaged source tree.
- Vitest regression: added, not executed in this environment.
- Typecheck/build and CLI end-to-end: not verified.


## Phase 2662 follow-up — repair stale source-trace audits

The source trace exposed several audit scripts whose file paths and symbol assumptions lagged behind the current implementation. They were reporting false failures even where the active code had moved to its canonical owner. The audits were updated to inspect the active source path and current contract symbols rather than treating the retired path or old implementation spelling as authoritative:

- Phase 1347 now checks that the historical scanner adapter is retired and the active wiring adapter delegates to its injected producer.
- Phase 1407 now inspects `compiler/scanner/wiring/laravelSourceAstPipeline.ts` and verifies the active pipeline consumes the typed expression, assignment, and property products.
- Phase 1410 now checks the upstream-owned `types/upstream/routeProducer.ts` projection boundary and the manifest surface's injected semantic-dataflow judgment path.
- Phases 1415–1417 now assert the current rule-algebra, statement-boundary, and parser wiring symbols.

Focused structural audits after these corrections: Phase 1347 12/12; Phase 1407 10/10; Phase 1410 23/23; Phase 1415 8/8; Phase 1416 passed with residuals; Phase 1417 9/9. Phases 1408, 1409, 1411, 1413, 1414, 2659, 2660, and 2661 also returned successful structural-audit status in this workspace.

These are audit maintenance and source-ownership checks, not runtime proof. An actual architectural residual remains: `sourceAstSemanticProducer.produce(sourceProject)` still orchestrates source evidence acquisition and syntax parsing internally before producing semantic AST products. That separation is explicitly recorded as open; the audit does not claim it has been implemented. TypeScript build/typecheck, Vitest behavior, and CLI end-to-end remain unverified because workspace dependencies are absent.
