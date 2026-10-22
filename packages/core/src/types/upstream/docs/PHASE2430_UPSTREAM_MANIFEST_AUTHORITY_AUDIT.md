# Phase2430 — Upstream Authority and Active Manifest CLI Trace

## Verdict

The upstream RequestType contract is substantially present. The blocker is not a missing declaration of the pipeline interface. The blocker is the absence of a production semantic producer that satisfies the existing contract, plus the fact that the active CLI projection still selects the legacy derivation path.

## Evidence: upstream capabilities already present

- `types/upstream/requestTypeDerivationInterface.ts`
  - canonical `RequestTypeDerivationInput` and evidence reference ADTs;
  - 32 required law identifiers and closed verified-law coverage;
  - source, route, resource, request and contribution receipts;
  - judgment/proof/verification/authority assessment ADTs;
  - reasoning, verifier, decision, authority, pipeline and assembler interfaces.
- `compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts`
  - checks that reasoning, verifier, decision and authority share the canonical contract instance;
  - assembles the existing consumer pipeline and validates the closed assessment.
- `compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts`
  - performs the authority trust-boundary flow over an injected semantic kernel;
  - checks verification and law coverage before classifying the authority outcome.
- `types/upstream/requestTypeDerivationAssessmentIntegrityRuntime.ts`
  - validates integrity/coherence of an assessment without deriving source semantics.
- `compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts`
  - consumes the pipeline, checks input binding and assessment integrity, then projects only a verified judgment.
- `compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts`, `routeManifestProjectionAuthority.ts`, and `integratedRouteManifestAuthority.ts`
  - provide the authority-backed lowering, projection, and integrated-manifest path.

## Actual active CLI trace

`packages/cli/src/commands/scan.ts` and `sync.ts`
→ `projectRouteSyncManifestForRouteManifest(completeManifest)`
→ `compiler/scanner/wiring/routeManifestProjection.ts`
→ `routeManifestTypeLowering.project(manifest)`
→ `compiler/scanner/wiring/routeManifestTypeLowering.ts`
→ `requestTypeDerivationProjectionPipeline.derive(...)`
→ `requestTypeDerivationSolver.ts:createDerivationContext(...)`
→ `aggregateRequestTypeGroups(...)`
→ raw `RequestType[]`.

This active route bypasses `createAuthorityBackedRouteManifestProjection` and the runtime executor.

## Exact root cause

The production tree contains declarations for `RequestTypeDerivationSemanticReasoningInterface`, `RequestTypeDerivationProofVerificationInterface`, `RequestTypeDerivationSemanticDecisionInterface`, and `RequestTypeDerivationSemanticAuthorityInterface`, but source search finds no production composition implementing all four and producing source-bound judgments/proofs for the current input. `createRequestTypeDerivationAuthority` is an adapter around an injected `RequestTypeDerivationSemanticKernel`; it is not itself the source-reasoning kernel or independent verifier. The assembler is also composition infrastructure, not a producer.

The legacy solver only returns `RequestType[]`. It does not emit the receipts, source disposition ledger, transition receipts, closure, conflicts, or verified-law evidence required by the existing proof contract. Converting its result into a `derivation_verified` assessment would fabricate evidence.

## Contract sufficiency assessment

The upstream contract already expresses the required authority boundary and the required evidence in enough detail to define the producer. Do not duplicate these interfaces or add a second policy contract. The remaining work is to implement the existing reasoning and independent verifier capabilities, construct decision/authority through the existing interfaces, assemble the pipeline, then inject it into the active manifest/CLI composition root.

A source-coordinate inventory is already present in `requestTypeDerivationSourceEvidenceInventory.ts`; it preserves route declaration spans and resource/request spans. This resolves the prior source-occurrence-coordinate gap in the current snapshot, but does not establish the remaining 32 semantic laws by itself.

## Why no fake producer or fallback was added

The contract explicitly requires independent proof-law verification and complete source dispositions. A wrapper around `aggregateRequestTypeGroups` cannot honestly satisfy those laws. Wiring a fabricated proof would make the architecture appear interface-first while violating the semantic contract. Therefore this audit does not claim end-to-end closure.

## Technical reference

TypeScript's discriminated-union exhaustiveness and narrowing guidance supports exhaustive handling of closed ADTs, but it does not prove semantic law coverage: https://www.typescriptlang.org/docs/handbook/2/narrowing

## Validation boundary

This report is backed by repository source search and the active CLI import/call chain. It is not a claim that full typecheck, package build, Vitest, or a live CLI run passed. Those remain blocked until the actual producer is implemented and connected.
