# Phase 2663 — CLI → Manifest → Upstream Source-Root Trace

## Concrete defect fixed

`packages/cli/src/commands/scan.ts` and `sync.ts` exposed optional composition factories and also exported module-level singleton commands by calling those factories with no composition. The active `createProgram` happened to use injected factories, but the module-level exports created an authority-free construction path and forced runtime guards to discover a dependency that the TypeScript API already knows is required.

The repair:
- makes `createScanCommand` and `createSyncCommand` require `RouteSyncCliUpstreamCompositionInterface`;
- removes their module-level `scanCommand` / `syncCommand` singleton exports, which had no repository consumers;
- removes the runtime `undefined` checks for properties declared mandatory by the composition interface;
- preserves the active route through `createProgram(composition)` → command factory → `manifestComposition.compose(...)` → preflight/projection → `createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project(...)`;
- does not create local reasoning, verifier, decision, or authority fallbacks.

This is a source-level interface/wiring repair, not a claim that the semantic producer is complete.

## Current source trace

| Boundary | Source | Responsibility / state |
|---|---|---|
| CLI host module | `packages/cli/src/standaloneCompositionLoader.ts` | Loads an explicitly host-owned semantic composition. Missing module configuration is a genuine missing dependency; it is not the primary semantic defect. |
| CLI composition root | `packages/cli/src/index.ts` | Calls `createProgramFromSemanticComposition` and binds the canonical manifest authority. |
| Composition assembler | `packages/cli/src/upstreamCompositionFactory.ts` | Calls `assembleRequestTypeDerivationProductionPipeline`; refuses to invent semantic capabilities. |
| Manifest producer | `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` and its interface | Acquires source documents and produces the controller-invocation manifest through an explicit authority. |
| Source AST pipeline | `packages/core/src/compiler/semantic/...` and Laravel source AST producer pipeline | Source discovery, AST evidence, source identity, and semantic dataflow must remain separately witnessed. |
| Request/resource preparation | `requestTypeDerivationSemanticInputPreparation.ts` | Builds canonical inventory and request/resource resolution ledgers. |
| Judgment producer | `requestTypeDerivationSemanticReasoning.ts` | Handles identity conflicts and unresolved cases; resolved contribution-eligible routes still hit a producer gap because action/response contribution receipts and group fold are missing. |
| Proof verifier | `requestTypeDerivationProofVerifier.ts` | Confirms one duplicate-identity correlation slice and returns `verification_incomplete`; it does not verify all 34 laws. |
| Decision/authority/integrity | `requestTypeDerivationSemanticComposition.ts` | Explicitly incomplete; each stage currently raises a typed producer-gap error. |

## Why `modulePath` is not the root fix

The missing-module branch is a legitimate configuration check: no host-owned module means no host-owned semantic capability. Removing it or substituting the diagnostic composition would merely defer failure to a later stage. The root semantic blockers are the incomplete judgment producer, the incomplete proof verifier, and the unimplemented decision/authority/integrity rules.

## Required next evolution

1. **AST/ADT:** finish source-grounded action and response contributions from Laravel route/controller AST evidence; preserve occurrence identity and provenance separately from canonical semantic identity.
2. **Semantic judgment:** implement deterministic initial-group and merge-existing-group fold transitions, each with replayable before/incoming/after receipts; detect incompatible group contributions as conflicts rather than dropping or overwriting them.
3. **Inventory/closure:** independently account for every route, resource, and request; closure counts must be derived from receipts, not initialized to expected counts by assertion.
4. **Verifier:** check each canonical law independently against raw input and receipts, return typed counterexamples, and emit `valid` only when all required laws are proven.
5. **Decision/authority/integrity:** consume the same inference packet and verification envelope; reject mismatched input/contract/object witnesses and never upgrade `verification_incomplete` to verified.
6. **CLI/manifest:** keep `createProgram` as the only composition root; commands receive mandatory typed capabilities and never construct local solvers.
7. **Tests:** add positive/negative source fixtures for exact and normalized request matching, ambiguous requests, resource identity mismatch, action/response merge conflicts, duplicate identities, stale/cross-input verification envelopes, and manifest serialization. Run typecheck/build/Vitest/CLI end-to-end once dependencies are installed.

## Verification status

The Phase 2663 audit is a structural source check. It does not prove TypeScript compilation or runtime behavior. Dependency installation, typecheck, build, Vitest, and CLI end-to-end remain unverified in this workspace. Laravel source semantics are cross-checked against the official Laravel 13.x `Router`, `ResourceRegistrar`, and `FormRequest` source/documentation; these are separate concerns: resource route registration and request validation must not be collapsed into one identity domain.
