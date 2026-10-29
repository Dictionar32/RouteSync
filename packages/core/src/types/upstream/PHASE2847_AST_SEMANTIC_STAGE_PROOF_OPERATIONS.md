# Phase 2847 — AST Semantic Stage Proof Operations

## Runtime path

`AstSemanticStageAuthority` and `resourceSemanticMappingAlgebra` now consume `astSemanticStageProofOperations`, an interface-first operation object. Proof construction remains internal to the module; consumers use `resolve`, `obligations`, `nextStage`, or `continueFrom`.

## Example

```ts
const continuation = astSemanticStageProofOperations.continueFrom(stage, contract);
if (continuation.result.kind === 'proof') {
  consumeProof(continuation.result.proof);
}
consumeObligations(continuation.obligations);
continueAt(continuation.next);
```

The discriminated result preserves the distinction between a proof-bearing transition and a terminal stage. It is not replaced with an empty success-shaped value. `packages/core/src/types/upstream/collections.ts` remains empty.

## Validation

Run `npm run audit:phase2847-ast-semantic-stage-proof-operations` for structural contract checks. This audit does not claim full project typecheck or end-to-end success.
