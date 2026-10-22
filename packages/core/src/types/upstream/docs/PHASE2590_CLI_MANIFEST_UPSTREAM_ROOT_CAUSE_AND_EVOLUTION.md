# Phase 2590 — CLI → Manifest → Upstream Root-Cause and Contract-Path Audit

## Scope

Trace the supplied Phase 2589 repository snapshot across the executable CLI entry, `scan`/`sync`, manifest composition, canonical upstream contracts, semantic producer/verification boundary, AST/ADT, semantic judgment, inventory, and identity. The goal is to correct the architectural path, not to make a false success judgment by suppressing errors.

## Confirmed active path

```text
packages/cli/src/index.ts
  createProgram(composition?)
  executable currently calls createProgram() without an argument
    → createScanCommand(composition) / createSyncCommand(composition)
      → requestTypeDerivationSemanticPipelineResolution.resolve(...)
        → reject missing composition before source acquisition
      → when supplied:
        composition.manifestComposition.compose(sourceProject + routeSelection)
          → source discovery / document reads / source identity binding
          → invocation semantic judgment inventory
          → manifest builder authority
        → request/resource source evidence inventory and resolution assessments
        → RequestTypeDerivationSemanticPipelineInterface.derive(input)
          → integrity validation
          → project only the verified `derived` judgment
          → manifest projection/output
```

## Root cause (not an export typo)

1. `packages/cli/src/index.ts` creates the actual executable with `createProgram()` and therefore supplies no `RouteSyncCliUpstreamCompositionInterface`.
2. `packages/cli/src/upstreamCompositionFactory.ts` is a wiring operation. It calls `assembleRequestTypeDerivationProductionPipeline`; it does not produce semantic reasoning or proof.
3. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts` explicitly documents that the production tree does not provide the four concrete capabilities: `reasoning`, independent `verifier`, `decision`, and `authority` (with integrity validation).
4. The canonical contract and operation interfaces already exist in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`. The canonical `requestTypeDerivationContract` has required laws and closure policy; coverage identity was repaired in Phase 2589. Those changes do not produce a source-bound inference packet or prove the laws.
5. The legacy `requestTypeDerivationSolver` yields `RequestType[]`, not the complete source-bound judgment, contribution receipts, proof ledger, independent verification result, and authority decision required by the consumer interface.

Therefore the true missing edge is:

```text
source evidence + request/resource resolution receipts
  → upstream semantic reasoning packet
  → contribution/proof receipts + complete closure ledger
  → independent verifier for every required contract law
  → closed decision proof
  → authority assessment + integrity validation
  → canonical RequestTypeDerivationSemanticPipelineInterface
  → CLI composition root
```

Wrapping `RequestType[]` as `derived`, marking law IDs verified with literals, or moving reasoning into CLI/runtime would make the graph look connected while violating its contract. This phase intentionally does not fabricate that edge.

## Existing contract inventory and identity findings

- Canonical owner: `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- Consumer operation: `RequestTypeDerivationSemanticPipelineInterface.derive(input)` plus `validateAssessment(assessment)`.
- Composition ADT/interface: `RequestTypeDerivationSemanticPipelineCompositionInterface` carries one shared `contract`, `reasoning`, `verifier`, `decision`, `authority`, and `integrity` capability.
- Assembler: `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts` checks capability contract identity before exposing the pipeline.
- CLI composition boundary: `packages/cli/src/upstreamCompositionInterface.ts` combines the existing manifest authority with the assembled canonical pipeline.
- Composition factory: `packages/cli/src/upstreamCompositionFactory.ts` preserves typed assembly rejection.
- Source inventory and occurrence identity already have upstream owners; preserve their canonical identity and receipts through the reasoning/verifier boundary. Do not reconstruct identity in CLI.
- Manifest source-inventory identity and RequestType derivation proof identity are separate obligations; neither substitutes for the other.

## Correct evolution order

1. Implement the missing reasoning operation against the existing input/evidence and resolution receipt types. Every route, resource, request, exclusion, and unresolved/conflicting source must receive an explicit disposition.
2. Produce contribution receipts and before/after transitions from the same semantic result; close output groups and proof ledgers against those receipts.
3. Implement an independent verifier that checks the complete required-law union against source evidence, receipts, transitions, closure, and identity. It must emit typed counterexamples; it must not trust producer claims of verification.
4. Connect the existing decision, authority, and integrity capabilities to the same exact `requestTypeDerivationContract` value through the existing assembler.
5. Supply that assembled pipeline together with the existing manifest composition authority at the executable composition root. Keep absence as a typed fail-closed result.
6. Add integration tests for complete/derived, incomplete, conflict, invalid input, duplicate identity/occurrence, and evidence/source mismatch. Assert the executable reaches manifest projection only for a valid verified judgment.

## Explicitly rejected shortcuts

- No new owner in `core/src/semantic/foundation` or `core/src/semantic/relation`.
- No return to `subscanner` as a semantic owner.
- No legacy `RequestType[]` fallback as authority.
- No fabricated proof receipts, literal verified-law inventory, fallback judgment, or CLI/runtime semantic classification.
- No duplicate `v2` contract where the canonical upstream interface already exists.
- No claim that structural audit or syntax transpilation proves typecheck/build/CLI end-to-end success.

## Laravel source grounding

Laravel's routing documentation states that route files are loaded according to the application's routing configuration and provides `php artisan route:list` as an inspection command. Route listing can be a useful external cross-check, but it is not a replacement for RouteSync's source-bound AST/evidence model: runtime route registration output alone cannot prove controller-source inventory closure or RequestType derivation laws.

## Verification status

This is a source-trace/root-cause artifact based on the supplied ZIP. It does not claim the missing semantic producer/verifier has been implemented, nor that typecheck, package build, Vitest, or real CLI scan has passed. The next code phase must implement the missing upstream operations, not merely add another composition wrapper.
