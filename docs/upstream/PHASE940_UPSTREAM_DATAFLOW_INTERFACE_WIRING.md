# Phase 940 — Upstream Dataflow Interface Wiring

Phase 940 closes the remaining production interface-wiring gap after the upstream dataflow input/seed boundary.

## Canonical path

```text
scanner semantic knowledge
  -> semanticDataflowInputAdapter
  -> SemanticDataflowInput
  -> createSemanticDataflowInterface
  -> SemanticDataflowJudgment
  -> AstAnalysisJudgment
  -> semanticDataflowInterfaceFromJudgment
  -> AstAnalysisInterface
```

The producer remains responsible only for seed facts (`dependency` and `value_flow`). Reachability remains owned by `astDataflowAuthority`.

## Wiring change

`astAnalysisInterface` previously reconstructed `SemanticDataflowInterface` inline. That duplicated the upstream interface shape at a downstream boundary.

It now calls the canonical upstream `semanticDataflowInterfaceFromJudgment` factory. The factory preserves the authoritative judgment by identity and only reconnects it to the closed interface wrapper.

No source/target identities or facts are re-encoded at the analysis boundary.

## Production constructor audit

The only production constructions of `semantic_dataflow_interface` are now:

1. `packages/core/src/compiler/analysis/astDataflowAuthority.ts` — authority creates the interface from `SemanticDataflowInput`.
2. `packages/core/src/types/upstream/semanticDataflowInterface.ts` — canonical factory reconnects an existing authoritative judgment for downstream interface wiring.

`packages/core/src/compiler/analysis/astAnalysisInterface.ts` no longer constructs the interface shape itself.

## Scope decision

No `packages/core/src/upstream/` directory is introduced. The canonical contract remains under `packages/core/src/types/upstream/`, while producer-specific adapters remain next to their producer boundary.

## Verification

`audit:phase940-upstream-dataflow-interface-wiring` reports `clean: true`.

A targeted TypeScript invocation still reports pre-existing unrelated errors in:

- `packages/core/src/semantic/authority/declarativeDispatch.ts`
- `packages/core/src/types/domain/resourceModelMethodResolverOperation.ts`
- `packages/core/src/types/domain/resourceModelMethodResolverProjection.ts`
- `packages/core/src/types/domain/resourceModelSurface.ts`
- `packages/core/src/types/upstream/highLevelSourceModel.ts`

No reported TypeScript error points to the Phase 940 dataflow files.
