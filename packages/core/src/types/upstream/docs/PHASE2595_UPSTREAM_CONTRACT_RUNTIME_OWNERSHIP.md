# Phase 2595 — Upstream Contract / Runtime Ownership Cutover

## Scope

Move the RequestType derivation integrity executors out of `core/src/types/upstream` while preserving the canonical upstream interfaces and closed ADTs. This is a narrow ownership correction for the CLI → manifest → RequestType derivation path; it does not claim the whole upstream directory is runtime-free.

## Changes

- Moved `requestTypeDerivationAuthorityIntegrityRuntime.ts` to `compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrity.ts`.
- Moved `requestTypeDerivationAssessmentIntegrityRuntime.ts` to `compiler/semantic/request-type-derivation/requestTypeDerivationAssessmentIntegrity.ts`.
- Moved `requestTypeDerivationAuthorityIntegrityGate.ts` to `compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrityGate.ts`.
- Moved `RequestTypeDerivationAuthorityIntegrityGateInterface` and `RequestTypeDerivationAuthorityIntegrityGateResult` into the canonical `types/upstream/requestTypeDerivationInterface.ts` contract owner.
- Removed those executable implementation exports from `types/upstream/index.ts` and rewired the core public exports and semantic pipeline assembler to the implementation owner.
- Updated existing integrity tests to import runtime operations from the semantic implementation layer and contract types from the upstream contract.

## Trace after cutover

`CLI createProgramFromSemanticComposition`
→ `composeRouteSyncCliUpstream`
→ `assembleRequestTypeDerivationProductionPipeline`
→ `createRequestTypeDerivationSemanticPipelineAssembler`
→ supplied `reasoning.infer(input)`
→ supplied verifier + source-occurrence guard
→ decision
→ integrity gate / authority
→ closed semantic assessment
→ manifest projection.

## Remaining blockers (not hidden)

The repository still does not provide a concrete production `RequestTypeDerivationSemanticReasoningInterface` implementation that creates the complete source-bound judgment/proof packet, nor one independent production verifier establishing all 34 canonical laws. The standalone CLI executable still calls `createProgram()` without a semantic capability composition. These are real semantic-production and composition-root gaps; fabricating a producer or declaring a partial guard a complete verifier would break the authority boundary.

## Verification

- `audit-phase2595-upstream-contract-runtime-ownership.cjs`: structural ownership assertions.
- `audit-phase2594-cli-program-operation-interface.cjs`: 8/8 assertions passed.
- `audit-phase2593-cli-composition-root-wiring.cjs`: 8/8 assertions passed.
- `audit-phase2592-cli-manifest-upstream-production-path.cjs`: 3/6 passed; 3 expected production blockers remain.
- `audit-phase2552-canonical-evidence-identity-integrity.cjs` is stale for this ZIP: it attempts to read a missing `requestTypeDerivationSolver.ts` and fails before assertions. This was not treated as a regression or a passing check.
- Full TypeScript typecheck, Vitest, package build, and live Laravel CLI run were not executed because this extracted ZIP has no `node_modules`.
