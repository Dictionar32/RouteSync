# Phase 1738 — Publication Receipt as the Single Correspondence Authority

## Trace finding

Phase 1737 introduced `InvocationSemanticIntegratedResponseAuthorityInterface` to validate analysis/publication correspondence. The existing `InvocationSemanticCoveragePublicationAuthorityBoundaryContract` already owns inventory uniqueness, publication bijection, analysis bijection, judgment binding, and source-evidence binding. A second authority therefore duplicated the same semantic invariant owner.

## Interface-first correction

- Removed the second integrated-response authority boundary, input, violation/rejection layer, and operational interface.
- Evolved `InvocationSemanticCoveragePublicationAuthorityBoundaryContract` to v2 and made its receipt binding explicit.
- The validated publication receipt now carries the exact `InvocationSemanticAnalysis` input.
- Ordinary correspondence now carries the exact analysis judgment alongside its canonical inventory entry and publication entry.
- Evolved the integrated-response contract to v3. An accepted response exposes the validated receipt and does not carry a second, independently supplied analysis field; consumers read the analysis from `publication.validation.analysis`. A rejected response retains the analysis beside the typed rejected publication.
- Bumped `InvocationSemanticPipelineContract` to v47 and `LaravelControllerInvocationSemanticBoundaryContract` to v26.
- Kept scanner production code unchanged: it remains a delegator. No wiring or authority implementation was claimed.
- Did not introduce `core/src/semantic/foundation` dependencies.

## Validation

- Phase 1738 direct interface audit: 18/18 PASS.
- Phase 1738 regression audit: 5/5 PASS; aggregate recorded audit checks: 249/249, no recorded failures.
- Phase 1737 duplicate-authority audit now verifies the superseded interface is removed: 6/6 PASS.

Run `npm run audit:phase1738-publication-receipt-single-authority` for the 18 interface checks. Targeted `tsc --noEmit --strict` exits with code 2 and reports 88 diagnostic lines in pre-existing unrelated resource-model/domain/upstream files; zero diagnostics reference the two changed interface files. No full package build is run in this phase.

The type-level receipt contract establishes intended ownership but does not prove runtime identity preservation until the publication authority implementation exists and is tested. This phase intentionally stops before wiring.

## Official design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- TypeScript Narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

These references support explicit interface ownership and typed result variants; they do not imply the RouteSync implementation is complete.
