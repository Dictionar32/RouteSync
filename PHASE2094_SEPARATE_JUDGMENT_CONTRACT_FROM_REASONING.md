# RouteSync Phase 2094 — Separate Judgment Contract from Reasoning

## Goal

Correct the architecture defect where `laravelControllerInvocationSemanticJudgmentInterface.ts` contained both type declarations and executable/declarative semantic reasoning values. The interface module now declares judgment ADTs and structural correlation metadata only.

## Changes

1. `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts`
   - Removed the runtime `LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_REASONING_CONTRACT` value and its rule ADT.
   - Removed the runtime `LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT` value from the interface module.
   - Reduced `LaravelControllerInvocationSemanticJudgmentContract` to structural metadata: closed judgment shape, canonical source identity, and invocation-indexed integrated response correlation.
   - Removed the AST projection interface's `reasoning` property.
   - Retained the named four-outcome invocation judgment ADT and correlated response/projection types.

2. `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts`
   - Authority implementation now owns the runtime structural contract value.
   - Pipeline absence is supplied as the explicit upstream evidence discriminant; the interface no longer supplies a rule object for the authority to interpret.
   - Existing source-binding and integration authorities remain the semantic evidence producers.

3. `packages/core/src/types/upstream/laravelControllerAstProjectionSemanticAuthority.ts`
   - Removed dependency on the interface module's reasoning-rule object.
   - Projection dispatches on the already-closed context ADT and forwards the exact invocation and response judgment references.
   - This is structural ADT projection, not Laravel invocation reclassification.

4. Updated the existing AST projection test to assert the absence of a runtime reasoning object and the structural contract shape.
5. Updated upstream exports and added `scripts/audits/audit-phase2094-separate-judgment-contract-from-reasoning.cjs`.

## Verification

- Phase 2094 structural audit: 11/11 passed.
- Phase 2093 explicit judgment ADT audit: 10/10 passed.
- ZIP integrity checked after packaging.
- TypeScript build, typecheck, and Vitest were not run.

## Still unresolved

- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still imports `semantic/relations` and calls `scanControllerAction` from the controller subscanner.
- The ancestry lattice/fixed-point contract still uses runtime witness fields whose truth is not established by TypeScript types alone.
- This phase does not claim full Laravel scanner migration or retirement of relation/foundation/subscanner dependencies.
