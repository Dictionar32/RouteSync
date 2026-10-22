# Phase 1739 — Rejection Analysis Binding

## Trace finding

Phase 1738 correctly removed the duplicate integrated-response authority, but its rejected variant still carried `analysis` independently from `publication`. The `rejected-publication` result only owned violations, so a caller could theoretically combine analysis A with a rejection produced while evaluating analysis B. This weakened the single-authority model even though the accepted path already read analysis from the validated receipt.

The public export list also retained a stale export of `INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_AUTHORITY_BOUNDARY_CONTRACT` after that duplicate authority had been removed.

## Interface-first correction

- `InvocationSemanticCoveragePublicationResult`'s `rejected-publication` variant now retains the exact `InvocationSemanticAnalysis` input evaluated by the publication authority alongside its non-empty typed violation ledger.
- `InvocationSemanticIntegratedResponse` no longer has an independent `analysis` field on its rejected variant. Both accepted and rejected analysis ownership now flows through the corresponding publication result.
- The publication authority's failure-result contract explicitly requires retaining the rejected analysis input and typed violations while never returning a validated receipt after a violation.
- `InvocationSemanticIntegratedResponseContract` evolves v3 → v4; pipeline contract v47 → v48; Laravel scanner boundary v26 → v27.
- Removed the stale public export of the deleted integrated-response authority boundary constant.
- No new authority interface, duplicate correspondence checker, scanner semantic logic, wiring, or `semantic/foundation` dependency was added.

## Scope and status

This is an interface/model correction only. The publication authority implementation and Laravel integrated-response wiring remain unimplemented. The existing scanner's `analyzeKnowledge` delegation was not changed. Full package build was not run.
