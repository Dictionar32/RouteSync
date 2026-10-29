# RouteSync Phase 1734 — Publication Receipt Authority Binding

## Scope
Interface-first refinement only. No production wiring or publication authority runtime implementation was added.

## Trace
- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`: the operational `InvocationSemanticCoveragePublicationInterface` already existed. The gap was that a successful receipt carried the coverage contract but did not carry the exact publication authority boundary contract whose invariants it claims were enforced.
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`: scanner boundary did not explicitly require preserving both contract identities on the validated receipt.
- `packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts`: existing delegation to `invocationSemanticPipeline.analyzeKnowledge(...)` remains unchanged.

## Changes
- Successful `validated-publication` receipt now includes `authorityBoundary: InvocationSemanticCoveragePublicationAuthorityBoundaryContract` alongside the coverage contract and entry-by-entry correspondences.
- Publication authority interface documentation states that the authority constructs the receipt from validated input; callers cannot self-assert success.
- Coverage contract v26 adds `publicationReceiptAuthorityBinding`.
- Pipeline contract v43 accurately says the interface and boundary contract exist, while runtime implementation and Laravel wiring remain pending.
- Laravel scanner boundary v22 adds `publicationReceiptContractBinding` requiring exact forwarding without reconstruction.
- Historical audit expectations were synchronized to current versions.

## Verification
See `PHASE1734_AUDIT.json` and the regression audit output. This phase does not claim end-to-end publication validation, a complete typecheck, or a full package build.
