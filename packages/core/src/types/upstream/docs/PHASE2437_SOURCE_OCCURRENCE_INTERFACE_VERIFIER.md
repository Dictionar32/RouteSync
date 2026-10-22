# Phase2437 — Source Occurrence Verifier Interface Integration

## Change

The former standalone `verifyRequestTypeSourceOccurrences(input, evidence)` operation and its local success/failure ADT have been replaced with `createSourceOccurrenceGuardedRequestTypeDerivationProofVerifier(delegate)`.

The factory implements the existing `RequestTypeDerivationProofVerificationInterface<TContract, TInference>` by decorating a supplied verifier. It reads the exact inference packet's judgment and source evidence. When a source-occurrence violation exists, it returns a canonical `RequestTypeDerivationVerificationFailure` inside `RequestTypeDerivationSemanticVerificationFor`. When the source-occurrence checks pass, it delegates to the supplied verifier for the remaining contract laws. It never promotes a partial check to `valid`.

The existing `createRequestTypeDerivationSemanticPipelineAssembler` now installs this guard around the injected verifier before the pipeline executes verification. No new verifier interface or duplicate success ADT was added.

## Checks

The source-occurrence guard checks:

- semantic evidence key agrees with the source identity and source domain;
- source occurrence key is derived from source coordinates;
- evidence locations agree with source coordinates and the source occurrence is bound to the current input;
- source inventory key multisets match per domain;
- duplicate semantic identities do not reuse the same occurrence key/location.

Violations are represented by existing canonical verification failure variants. The complete verifier remains responsible for all other derivation laws, including proof closure, receipts, contributions, resolution, and judgment/output coherence.

## Boundaries

This phase connects the source-occurrence checks to the existing verifier interface and pipeline assembler. It does not supply the missing complete reasoning/verifier/decision/authority production implementations and does not claim that the active CLI manifest path is fully migrated. It adds no imports from `semantic/foundation` or `semantic/relations`.
