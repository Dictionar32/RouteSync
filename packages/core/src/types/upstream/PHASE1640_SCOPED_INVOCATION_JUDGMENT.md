# Phase 1640 — Scoped Invocation Semantic Judgment

## Architectural change

The canonical one-in/one-judgment algebra no longer invokes aggregate analysis over the complete semantic knowledge model. It first scopes the model to the requested invocation and its semantic dependencies, then invokes the existing relation rewrite algebra on that scope.

- Retained facts: the requested invocation, callable knowledge, and emission knowledge needed by target/result/exception projections.
- Retained data-flow: only callable-target evidence sourced by the requested invocation identity.
- Excluded before rewrite: unrelated invocation facts and their data-flow edges.
- Missing requested invocation: a typed `invocation_evidence_missing` obligation with a complete rule trace; it does not silently become a closed empty result.
- Batch API: `analyzeInvocationSemanticAlgebra` / `analyzeAllInvocationSemantics` remains available for explicitly aggregate consumers.

## Ownership boundary

`InvocationSemanticContract` declares the execution scope. `invocationSemanticJudgmentAlgebra.ts` interprets that contract and constructs the judgment/proof. `invocationSemanticJudgmentAuthority.ts` binds the algebra. `invocationSemanticRuntimeExecutor.ts` delegates. The scanner facade only exposes the boundary and compatibility exports.

## Verification

Run from the repository root:

```sh
node packages/core/scripts/audits/audit-phase1640-invocation-scoped-judgment.cjs
```

The seven static boundary checks pass in this workspace. A full TypeScript build was not claimed as verified in this phase.
