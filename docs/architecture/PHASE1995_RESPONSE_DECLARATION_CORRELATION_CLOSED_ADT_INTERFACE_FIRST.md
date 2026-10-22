# Phase 1995 — Response Declaration Source Correlation Closed ADT (Interface First)

## Scope

This phase changes upstream semantic contracts only. It does not add a relation/foundation subscanner, change scanner runtime wiring, or claim that response judgments are integrated into the scanner artifact.

## Trace and root cause

Phase 1994 required a successful declaration-source correlation receipt on response-evidence production input, but the named correlation type represented only the success case. That made the contract incomplete as a semantic model: the authority could type successful production, but there was no companion ADT member describing the mismatched-source outcome at this boundary.

## Contract change

- `LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment` now models both `controller_response_evidence_declaration_source_correlated` and `controller_response_evidence_declaration_source_correlation_rejected`.
- Both outcomes retain the exact invocation source, declaration source, and existing `SourceFileIdentityRelationJudgment` result.
- `LaravelControllerResponseEvidenceProductionSourceCorrelation` remains the successful receipt alias, so production input and inventories only accept/retain the correlated outcome.
- The production contract explicitly says the different-source outcome is rejected before evidence production. Identity comparison remains owned by `LaravelSourceIdentitySemanticsInterface`.
- Public exports include the new judgment ADT. Production contract version advances to 4.

## Important boundary

The ADT is a type-level contract, not proof that runtime wiring already emits the rejection outcome. The current scanner is still not wired to the response evidence producer and its `LaravelControllerScanArtifact` construction still needs `responseJudgment`. Descriptor-derived response references remain candidates, not direct evidence of PHP return expressions.

## Validation

The phase audit checks the closed two-outcome ADT, successful-only production input, exact source-identity judgment variants, contract version, public export, and absence of relation/foundation subscanner additions. Syntax transpilation is checked for the changed TypeScript files. Full project typecheck/build is not run.
