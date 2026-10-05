# Phase 949 — Relation Foundation Ownership

The generic relation algebra is now owned by `packages/core/src/semantic/foundation/` rather than by `types/upstream` or the semantic kernel.

## Boundary

```text
relation foundation
        ↑
semantic kernel       types/upstream
        ↑                   ↑
        └──── compiler/scanner
```

`Sequence<T>` is a generic recursive relation collection and is therefore owned by `semantic/foundation/relationalSequence.ts`. `types/upstream/collections.ts` re-exports that type for semantic API compatibility but does not own its implementation.

The kernel files `relationFoundation.ts`, `relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` remain compatibility facades for existing kernel consumers. They no longer contain the generic authority or import upstream types.

## Prohibited ownership edges

- `semantic/foundation -> types/upstream`
- `semantic/foundation -> compiler`
- `semantic/foundation -> scanner`
- `semantic/kernel -> types/upstream`
- `types/upstream -> semantic/kernel`

## End-to-end semantic lanes

Laravel policy remains a source-model semantic lane and is deliberately excluded from structural graph projection.

```text
Laravel evidence
  -> policy relation
  -> source model
  -> manifest consumers
```

Dataflow remains an authority-owned closure lane.

```text
seed dependency/value-flow
  -> SemanticDataflowJudgment
  -> semanticDataflowInterfaceFromJudgment
  -> AstAnalysisInterface
  -> SSA/lowering consumers
```

`reaches` is derived by the authority and is not accepted as an upstream seed.
