# Phase 2862 — Fully Typed Runtime Scanner Operations Audit

## Scope

This phase migrates the upstream AST semantic stage-proof operation from relation utility combinators to a closed, actionable domain ADT. It does not claim that all relation imports across scanner/upstream/CLI have been migrated.

## Runtime trace: CLI manifest

```text
CLI scan/sync
  → CLI PHP controller invocation manifest composition
  → composition manifest scan operation
  → upstream controller invocation manifest composition authority
  → source discovery and identity binding
  → inventory judgment ADT continuation
  → manifest builder preparation
  → ManifestBuilderJudgment
  → manifest validation / generation / persistence terminal operations
```

The AST stage-proof pipeline is a supporting semantic path, not the manifest builder itself:

```text
AstSemanticStageAuthority
  → astSemanticStageProofOperations.resolve(stage, contract)
  → proof-result.continueWith({ onProof, onTerminal })
  → proof obligations / next-stage handoff
```

## Implementation

`astSemanticStageProof.ts` no longer imports `semantic/relations`. Stage transitions are selected by exhaustive `switch` cases. The result is an explicit ADT:

- `kind: 'proof'` carries a typed `AstSemanticStageProof` and `continueWith`.
- `kind: 'terminal'` carries `continueWith` without inventing a sentinel proof.

The authority uses the interface-first runtime export:

```ts
export const astSemanticStageProofOperations: AstSemanticStageProofOperationsInterface = Object.freeze({
  kind: 'ast_semantic_stage_proof_operations',
  resolve: resolveStageProofImplementation,
  obligations: resolveStageProofObligationsImplementation,
  nextStage: nextStageImplementation,
  continueFrom: /* typed domain continuation */,
});
```

Example consumer:

```ts
const proofResult = astSemanticStageProofOperations.resolve(stage, contract);
return proofResult.continueWith({
  onProof: proof => consumePreservationObligation(proof),
  onTerminal: () => closeStagePipeline(),
});
```

## Verification boundaries

Run `npm run audit:phase2862-fully-typed-runtime-scanner-operations` for the structural audit. The audit reports remaining relation import counts for the scanner/upstream/CLI scope; zero imports in the migrated proof module must not be misrepresented as a complete repository migration. `collections.ts` remains intentionally empty. Runtime build, Vitest, and full typecheck must be reported separately from structural checks.
