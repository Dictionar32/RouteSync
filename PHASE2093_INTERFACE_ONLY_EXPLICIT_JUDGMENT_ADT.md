# RouteSync Phase 2093 — Interface-Only Explicit Judgment ADT

## Objective
Remove the distributive conditional-type mapper from the Laravel scanner artifact contract. The scanner interface should declare the four artifact cases explicitly rather than compute the public outcome union through a type-level conditional program.

## Source changes

1. `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts`
   - Added named judgment aliases for the four canonical outcomes: not-connected, source-binding-rejected, complete, and blocked.
   - Defined the canonical invocation judgment as an explicit union of those named judgment cases.
2. `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`
   - Replaced `LaravelControllerScanArtifactForOutcome` and `LaravelControllerScanArtifactForEveryOutcome` conditional-type derivation with an explicit four-branch artifact ADT.
   - Each artifact branch indexes its response judgment with the exact named invocation judgment.
3. Added `scripts/audits/audit-phase2093-interface-only-explicit-judgment-adt.cjs`.

## Architectural result
The scanner interface no longer contains the distributive conditional type used to compute the artifact outcome union. It declares the product ADT as four explicit cases. Semantic outcome meaning remains owned by the canonical invocation judgment; the scanner contract only associates each judgment branch with its matching integrated response/projection type.

This does not eliminate every conditional type in the upstream type model: `Extract` remains used to name exact members of the canonical source integration result, and generic projection contracts still express type-level correlations. Those are type relationships, not runtime semantic classification. This phase does not claim that all reasoning contracts elsewhere in the upstream interface files have been removed.

## Scope discipline
Only two existing TypeScript interface/type-contract files were changed. Runtime scanner, wiring, relation helpers, foundation modules, and subscanner implementations were not modified. Their migration remains open.

## Verification
- `node scripts/audits/audit-phase2093-interface-only-explicit-judgment-adt.cjs`: PASS 10/10.
- ZIP integrity: checked after packaging.
- TypeScript build/typecheck/Vitest: not run.
