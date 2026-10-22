# Phase 1799 — PHP source frontend validation authority (interface-first)

## Trace result

- `phpSourceFrontendInterface.ts` defines a source-only frontend contract, but its extraction was not yet guarded by a dedicated upstream authority.
- `phpFunctionResolutionSourceInventoryAuthority` validates namespace/import/declaration inventory, while invocation batch closure validates source-to-judgment correspondence later. A clear validation boundary was missing between frontend extraction and those authorities.
- `controllerDataflowAnalyzer.ts` accepts an already-prepared `PhpFunctionInvocationSemanticIntegrationState`; it does not yet call a whole-file PHP frontend. This phase deliberately does not pretend that end-to-end parser wiring is complete.

## Changes

- Added `PhpSourceFrontendExtractionValidationAuthorityInterface` and a closed validated/rejected result.
- Added `phpSourceFrontendExtractionValidationAuthority`, validating document identity, whole-file source span, inventory identity, invocation spans, callee syntax spans, and consistency between complete frontend coverage and complete namespace inventory.
- Exported the interface and authority from the upstream index.
- Added a static audit in `scripts/audits/audit-phase1799-php-source-frontend-validation-interface-first.cjs`.

## Boundary decision

The validator only validates source provenance and completeness. It does not parse PHP, resolve names, classify builtins, create invocation judgments, or alter integrated response. The existing scanner-to-integrated-response wiring remains the downstream seam. Actual parser-to-frontend integration and removal of obsolete subscanners remain open work.

## Verification

The audit is static source-contract verification, not a TypeScript build or end-to-end parser test. Build/typecheck was not run.
