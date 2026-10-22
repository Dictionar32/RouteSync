# Phase 1755 — Invocation input contract closure

## Trace

- Canonical interface: `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`
- Authority boundary: `packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts`
- Domain algebra: `packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts`
- Integrated response composition/projection: `packages/core/src/types/upstream/invocationSemanticPipeline.ts` and `invocationSemanticPipelineInterface.ts`
- Laravel scanner consumer: `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts`

## Finding

The input interface requires a discriminated positional-evidence disposition, and the domain algebra consumes it. However, the authority validated the resulting judgment without first validating that the *input* positional evidence referred to the requested invocation and exact ordered argument sequence. A foreign evidence object could therefore be downgraded to an unresolved disposition by the algebra rather than rejected as a malformed authority request. The interface contract also still described this evidence as optional after the input had become required.

## Change

1. Bumped `InvocationSemanticContract` from version 35 to 36.
2. Updated the contract to require an explicit upstream positional-evidence judgment and to reject foreign invocation/argument-sequence evidence before derivation.
3. Added `assertInvocationSemanticInputContract`, an authority-boundary invariant validator. It validates identity and ordered argument coverage; it does not classify source syntax or derive semantic meaning.
4. Routed the single-invocation authority through this validator before calling the algebra.
5. Preserved the existing discriminated-union status for unproven evidence; no `null` sentinel was reintroduced.
6. Preserved integrated-response ownership: publication remains the only inventory/analysis correspondence authority, and the Laravel scanner still delegates composition/projection rather than reclassifying publication outcomes.

## Validation

Run `node scripts/audits/phase1755-invocation-input-interface-contract.cjs` from the repository root. This is a focused static contract audit, not a TypeScript typecheck, unit-test run, or full build.

## Remaining boundary

`controllerDataflowAnalyzer.ts` still imports `mapResourcePhpAstToUpstream` from `compiler/scanner/subscanners/resource`. The subscanner retirement is therefore not complete. That migration is a separate source-evidence/interface task and must not be falsely reported as completed by this invocation-contract phase.
