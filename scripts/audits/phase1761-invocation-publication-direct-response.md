# Phase 1761 — Interface-first invocation publication response

## Trace finding

`InvocationSemanticIntegratedResponse` duplicated the publication result's discriminated union. The composition executor translated `validated-publication` / `rejected-publication` into a second `validated-integrated-response` / `rejected-integrated-response` wrapper. This introduced another discriminator and a runtime reconstruction step even though the integrated response contract says publication is the single owner of correspondence validation and its exact analysis receipt.

## Interface correction

- `InvocationSemanticIntegratedResponse` is now an alias of `InvocationSemanticCoveragePublicationResult`.
- The composition executor forwards the exact result from `publicationAuthority.publish(...)` rather than reconstructing a second response variant.
- Scanner consumers read the analysis from the canonical publication discriminator.
- Bumped the integrated response contract to v6, composition contract to v9, invocation pipeline contract to v57, and Laravel controller scanner boundary to v36.
- Kept the composition result's source knowledge alongside the exact publication result; scanner still calls only `integrate(...)`.

## Boundaries

This change does not claim static invocation coverage has been implemented. It does not retire the PHP AST/resource expression subscanner; that requires a separate trace of all expression-mapping consumers and an upstream-owned evidence contract.

## Verification

Run `node scripts/audits/phase1761-invocation-publication-direct-response.mjs` for the focused static audit. TypeScript typecheck, Vitest, and full build are not claimed as run.
