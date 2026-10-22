# Phase 1576 Changelog

- Canonicalized the 32 semantic law identifiers into `REQUEST_TYPE_DERIVATION_LAW_IDS`; `RequestTypeDerivationLawId` now derives from the runtime registry.
- Added a concrete `createRequestTypeDerivationAuthority` boundary around an injected semantic kernel.
- Enforced exact law coverage at runtime for the contract and successful verification results.
- Added explicit outcomes for rejected inputs that fail verification, mismatched rejection witnesses, and inconsistent judgment/verification kinds.
- Added structural audit and 10-case executable behavior test.
- Updated Phase 1571–1575 regression audits for the canonical law registry representation.
- Scanner and runtime executor remain unchanged by design.
- Audit: Phase 1576 14/14; behavioral matrix 10/10; Phase 1571–1575 regressions 10/10, 11/11, 12/12, 10/10, and 9/9.
- Targeted TypeScript check remains blocked by 35 imported dependency diagnostics; no direct diagnostics on the Phase 1576 files. Full build/Vitest not run because dependencies are not installed.
