# RouteSync Phase 2632 — RequestType Production Capability Root-Cause Audit

## Scope

Trace the active CLI → manifest composition → RequestType semantic pipeline → upstream contracts and existing operations. This phase deliberately does not claim to close semantic production while the required producer and independent verifier are absent.

## Trace

1. `packages/cli/src/index.ts` loads a host-provided `requestTypeDerivationSemanticComposition` and exits non-zero when it is missing or invalid.
2. `packages/cli/src/upstreamCompositionFactory.ts` invokes `assembleRequestTypeDerivationProductionPipeline`; it does not manufacture semantic capabilities.
3. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts` wires `reasoning.infer` → `verifier.verify` → coverage → decision → authority/integrity. It is orchestration, not a producer.
4. `requestTypeDerivationSourceEvidenceInventory.ts` creates canonical source identities and occurrence locations. Its own module contract says it does not resolve routes or produce semantic judgments.
5. `requestTypeDerivationSourceOccurrenceVerification.ts` guards occurrence laws, then delegates remaining law verification to an injected verifier. It cannot establish all 34 laws independently.
6. `requestTypeDerivationAuthority.ts` is an adapter around an injected semantic kernel (`deriveJudgment` and `verify`); it is not that kernel.
7. `requestTypeDerivationProductionComposition.ts` explicitly records that concrete production reasoning/verifier/decision/authority capabilities are not shipped.

## Root cause

The blocking gap is not a missing export or CLI wiring defect. The repository has contracts, identity inventory, request/resource resolution operations, a pipeline assembler, authority adapters, and a partial source-occurrence verifier, but it does not have a concrete source-bound reasoning producer plus an independent verifier that establishes the complete 34-law proof contract and composes the existing capabilities for production.

The legacy solver's bare `RequestType[]` is not a valid substitute: it does not provide the closed judgment, source disposition ledger, contribution receipts, closure, counterexamples, and verified-law evidence required by the contract. Promoting its output into a `derived` judgment or filling law coverage with literals would fabricate authority.

## Safe next implementation sequence

1. Implement the existing `RequestTypeDerivationSemanticReasoningInterface` in the upstream request-type derivation owner. Its output must preserve exact input identity, canonical source inventory, route/request/resource identity judgments, every source disposition, contribution receipts/transitions, closure and typed conflicts/incompleteness.
2. Implement an independent `RequestTypeDerivationProofVerificationInterface` that recomputes/correlates the evidence against all 34 canonical law obligations. The source-occurrence guard remains a decorator, not the full verifier.
3. Connect the verified producer, verifier, existing decision and authority/integrity capabilities through the existing `RequestTypeDerivationSemanticPipelineCompositionInterface` and assembler. Do not duplicate contracts.
4. Supply that real composition through the existing host composition module and keep CLI fail-closed until it exists.
5. Add behavioral fixtures for exact match, normalized unique match, missing/ambiguous request, duplicate occurrence, conflicting group contributions, incomplete closure, and invalid input; run typecheck, Vitest, build and CLI end-to-end in a dependency-enabled environment.

## Laravel source-model constraints

Laravel resource routes expand to a defined set of controller actions, and can be customized with `only`, `except`, names, parameters, and nested resources. Therefore route/action identity must originate in parsed Laravel source evidence; do not infer a generic CRUD mapping when the source declaration provides a different mapping. Official references:

- https://laravel.com/framework/docs/12.x/routing
- https://laravel.com/framework/docs/12.x/controllers

## Verification boundary

This phase adds an executable structural audit only. It does not claim the production semantic pipeline is implemented, and it does not claim typecheck, full Vitest, package build, or CLI end-to-end passed. Those commands were not run here.
