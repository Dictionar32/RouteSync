# Phase 2841 — Semantic Dataflow Authority Operations

## Contract-first finding

The live CLI-to-manifest trace reaches `semanticDataflowManifestSurface`, which calls the existing `SemanticDataflowReasoningAuthorityInterface.judge` operation. The same authority is also consumed by `semanticDataflowRuntimeExecutor`. The existing interface was therefore the correct contract to evolve; introducing another authority interface or parallel solver would duplicate ownership.

The implementation previously exported `createSemanticDataflowJudgment` and `validateSemanticDataflowDerivations` as independent functions, even though the runtime's stable entry point was already `semanticDataflowReasoningAuthority`. That left derivation validation outside the named authority operation surface.

## Applied changes

- Extended the existing `SemanticDataflowReasoningAuthorityInterface` with `validateDerivations`, a domain operation that verifies derivation conclusions and premises belong to the closed fact closure.
- Bound both `judge` and `validateDerivations` on `export const semanticDataflowReasoningAuthority: SemanticDataflowReasoningAuthorityInterface = Object.freeze({...})`.
- Removed the separately exported `createSemanticDataflowJudgment` and `validateSemanticDataflowDerivations` functions; derivation construction remains private to the authority implementation.
- Preserved the invariant check before returning a judgment. The runtime executor and manifest surface continue to consume the same existing authority.
- Did not add a generic reasoning primitive, a duplicate ADT, or a second authority. Existing semantic reasoning-contract fields are retained for compatibility with the current admission contract and downstream semantic interface; removing those is a separate migration because admission explicitly validates them.
- Kept `packages/core/src/types/upstream/collections.ts` at zero bytes.

## Runtime trace

```text
CLI scan/sync
  -> manifest builder
  -> Laravel source-AST projection judgment
  -> complete source model
  -> semanticDataflowManifestSurface.inputsFromSourceModel
  -> semanticDataflowManifestSurface.judgmentsFromInputs
  -> semanticDataflowReasoningAuthority.judge
  -> closed SemanticDataflowJudgment
  -> existing semantic policy projections / manifest result
```

The runtime executor also consumes `semanticDataflowReasoningAuthority.judge` and is unchanged in its responsibility to compose admission. The manifest-surface call path remains the pre-existing direct judgment path; this phase does not claim to rewire manifest publication through the runtime executor.

## Verification boundary

Run `npm run audit:phase2841-semantic-dataflow-authority-operations -- --silent` for structural source assertions. This audit is not a full TypeScript build, full test suite, or end-to-end scan/sync verification.
