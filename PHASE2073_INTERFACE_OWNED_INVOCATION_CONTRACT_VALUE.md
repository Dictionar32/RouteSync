# Phase 2073 — Interface-Owned Invocation Contract Value

## Trace finding

Phase 2072's static audit checked that the authority imported a symbol named `LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT` from `laravelControllerInvocationSemanticJudgmentInterface.ts`, but the interface module declared only the contract type and reasoning contract. The claimed canonical value was therefore not actually exported by its purported owner. The audit verified the import text but not that the imported symbol was defined at the source boundary.

## Interface-first correction

- Added the canonical frozen `LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT` value beside its interface declaration.
- Kept the contract type, version, default reasoning contract, and declarative ownership rules in the interface module.
- Changed the authority's exported contract value to reference the exact canonical interface-owned value rather than spreading/rebuilding it.
- Preserved per-authority reasoning injection as an explicit authority configuration, without forking the canonical default contract.
- Updated Phase 2072's audit to verify identity-style forwarding instead of a spread operation.
- Added `audit:phase2073-interface-owned-invocation-contract-value` to check the actual source export and the existing scanner/runtime boundaries.

## Trace boundary

The controller scanner continues to forward the correlated integrated judgment. The invocation runtime executor continues to delegate to the upstream authority. The four integrated-response discriminants remain distinct. No `relation/foundation` subscanner or parallel invocation authority was introduced.

## Verification

- Phase 2073 static audit: 8/8 passed.
- Phase 2072 audit: rerun after updating its canonical-contract expectation.
- Full TypeScript typecheck, project build, and Vitest suite were not run; this phase does not claim they pass.
