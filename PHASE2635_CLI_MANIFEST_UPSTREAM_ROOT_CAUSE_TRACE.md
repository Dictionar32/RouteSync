# Phase 2635 — CLI → Manifest → Upstream Root-Cause Trace

## Scope

Audit `packages/cli/src/commands/{scan,sync}.ts`, the CLI composition root/factory, the manifest projection boundary, and the canonical upstream RequestType derivation contract under `packages/core/src/types/upstream`.

## Actual connected path

1. `packages/cli/src/index.ts:createProgramFromSemanticComposition` receives a host-owned `RequestTypeDerivationSemanticPipelineCompositionInterface`.
2. `packages/cli/src/upstreamCompositionFactory.ts:composeRouteSyncCliUpstream` passes that bundle to `assembleRequestTypeDerivationProductionPipeline`; it does not manufacture semantic capabilities.
3. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts` connects the injected reasoning, proof verifier, decision, and authority capabilities.
4. `packages/cli/src/commands/scan.ts` and `sync.ts` call the injected `manifestComposition.compose(...)`, retain the canonical manifest, and create one manifest-bound preflight packet.
5. `createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project(preflight, ...)` is the only RequestType projection gate. The closed `manifest_projected | manifest_projection_blocked` result controls lowering.
6. Preflight request/resource assessments are written as diagnostics; they no longer independently stop projection. The projection path does not import `semantic/foundation` or `semantic/relation`.

## Root cause (not a CLI wiring defect)

`packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts` explicitly documents that the repository does **not** ship concrete production reasoning, complete proof-verification, decision, and authority capabilities. `requestTypeDerivationSourceOccurrenceVerification.ts` verifies a limited source-occurrence subset and delegates the remaining laws to the injected verifier. The canonical upstream contract declares 34 laws; the law inventory is a specification of obligations, not evidence that they have been proven.

Therefore the missing production kernel cannot be repaired by adding another CLI gate, manufacturing an authority in the CLI, treating inventory/preflight output as proof, or reviving the legacy `RequestType[]` solver. Those would conceal the root cause or violate the authority boundary. The correct path is already fail-closed when a host does not provide the full capability bundle.

## Interface / AST / ADT / identity assessment

- **Interface authority:** reuse `RequestTypeDerivationSemanticPipelineCompositionInterface`, `RequestTypeDerivationSemanticReasoningInterface`, `RequestTypeDerivationProofVerificationInterface`, decision/authority interfaces, and the canonical assembler. Do not introduce parallel `V2` contracts.
- **Closed outcomes:** keep assembly rejection and `manifest_projected | manifest_projection_blocked` as explicit ADTs. Do not convert missing capabilities into fallback behavior.
- **Identity/inventory:** `requestTypeDerivationSourceEvidenceInventory` owns canonical identity and inventory; it is not a semantic judgment producer. Do not promote its result to proof.
- **Manifest packet:** `RouteManifestRequestResolutionPreflight` binds the manifest, derivation input, evidence inventory, and resolution ledgers; projection/lowering consume that same packet.
- **CLI boundary:** commands are orchestration and output surfaces, not semantic reasoning owners.

## Correct next implementation

The remaining implementation must be supplied as a real upstream production capability bundle:

1. implement reasoning that emits inference evidence for the canonical 34-law contract;
2. implement an independent verifier that checks every required witness against the inference and original input (including laws not covered by the source-occurrence decorator);
3. implement the closed decision and authority over the verified result;
4. assemble them through the existing canonical assembler and inject the result through `createProgramFromSemanticComposition` / `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE`;
5. add adversarial fixtures for missing, duplicated, conflicting, forged, and source-location-mismatched evidence, then run full typecheck, tests, build, and Laravel fixtures.

This ZIP does not contain enough implemented domain evidence to safely invent that kernel. No fake production verifier or permissive stub was added. The defect remains explicit and fail-closed rather than being disguised as a completed semantic fix.

## Verification evidence

Executed from the extracted workspace on 2026-10-21:

- `audit-phase2632-request-type-production-capability-root-cause.cjs`: **11/11 passed**.
- `audit-phase2633-cli-preflight-packet-identity.cjs`: **10/10 passed**.
- `audit-phase2634-cli-semantic-authority-single-gate.cjs`: **10/10 passed**.

These are structural audits only. Full typecheck, Vitest, package build, and Laravel fixture execution were not run; the three passing audits do not prove the missing production kernel exists.
