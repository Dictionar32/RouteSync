# Phase 2845 — Interface-first semantic dataflow runtime executor factory

## Runtime trace

`scanner/AST request` → `semanticDataflowRuntimeExecutor.execute(request)` → for evidence requests, `authority.judge(input)` → `boundary.admit(judgment)`; for no-evidence requests, a closed `semantic_dataflow_no_evidence` ADT is returned and is not represented as an accepted judgment.

## Contract

`createSemanticDataflowRuntimeExecutor(authority, boundary)` is no longer an exported free-standing constructor. Runtime composition is exposed through `semanticDataflowRuntimeExecutorFactory: SemanticDataflowRuntimeExecutorFactoryInterface`, with a typed `create` operation. The canonical singleton is constructed through that interface-first operation. The existing authority and admission contracts are reused; no duplicate reasoning authority or generic reasoning primitive is introduced.

## Example

```ts
const executor = semanticDataflowRuntimeExecutorFactory.create(
  semanticDataflowReasoningAuthority,
  semanticDataflowJudgmentBoundary,
);
const result = executor.execute(request);
```

## Verification boundary

The Phase 2845 audit verifies the typed factory, removal of the exported constructor, authority/admission composition, no-evidence ADT preservation, public type export, and empty `collections.ts`. It is a structural audit, not a substitute for a full TypeScript build or CLI end-to-end test.
