# Phase 1893 — Integrated Response Provenance Path, Interface First

## Trace finding

The existing `LaravelControllerInvocationSemanticBoundaryContract` described `response.sourceBinding.identityJudgment` as if it were the provenance path for every integrated response outcome. The canonical integration union does not have that shape for every outcome:

- `php_source_invocation_integration_complete`: `response.sourceBinding.identityJudgment`
- `php_source_invocation_integration_blocked`: `response.sourceBinding.identityJudgment`
- `php_source_invocation_integration_source_binding_rejected`: `response.judgment.identityJudgment`
- `php_source_invocation_integration_not_connected`: explicit `response.evidence`; there is no source-binding proof to invent

This was an interface-contract inaccuracy: it described the rejected outcome using the closed-binding path. It did not require a new model; the existing discriminated union already owns the correct paths.

## Change

- Updated the existing `LaravelControllerInvocationSemanticBoundaryContract` from version 59 to 60.
- Corrected `canonicalSubjectProvenanceBoundary` to describe the provenance path for each outcome.
- Updated historical static audits that assert the current scanner-boundary version so they follow the current version number.
- Added `scripts/audits/audit-phase1893-integrated-response-provenance-path-interface-first.cjs` and registered it in `package.json`.

## Deliberately unchanged

- No invocation judgment model or inventory model was added.
- No runtime, scanner wiring, parser, source-binding authority, invocation authority, or inventory authority implementation was changed.
- `laravelControllerScanner.ts` remains byte-identical to Phase 1892.
- `semantic/foundation` remains unused by this work.

## Verification scope

The Phase 1893 audit checks the existing union's outcome-specific provenance paths, the boundary contract version, unchanged runtime implementation hashes, and absence of a parallel V2 model. `node --check`, JSON parsing, ZIP integrity, and the static audit are intended; TypeScript compilation/build are not run in this environment.
