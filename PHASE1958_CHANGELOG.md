> Superseded for the classifier request boundary by Phase 1959: `PhpSourceText` was still too weak because it only wrapped text.

# Phase 1958 Changelog

- Replaced `AstClassifierValueRequest.raw: string` with `source: PhpSourceText`.
- Added `phpSourceTextOf()` to construct the existing source domain type at scanner ingress.
- Made the single `AstClassifierEvidenceInterface.classify` operation overloaded by request variant, preserving request/result correspondence.
- Simplified typed facade projections by removing impossible result-kind runtime checks.
- Exported the source domain and concrete request/result ADTs through the core public barrel.
- Added `audit:phase1958-ast-source-domain-correlated-adt-interface-first` and its machine-readable report.
- Updated the Phase 1399 audit for the strengthened overload contract.
