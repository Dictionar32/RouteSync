# Phase 1305 — Semantic Reasoning Interface/Contract Boundary Strengthening

## Canonical topology

```text
Laravel evidence
  -> SemanticReasoningExecutionAlgebraInterface
  -> SemanticReasoningContractInterface
  -> SemanticReasoningInterface (consumer/read-only)
  -> SemanticCapabilityContract / SemanticDataflowInterface
  -> UpstreamWiringInterface
  -> Manifest / Graph / IR / SDK / React
```

## Changes

- Split the named reasoning execution algebra from the public `SemanticReasoningInterface`.
- Kept producer execution/relation/rewrite/fixed-point/judgment methods upstream-only.
- Kept proof, provenance, closure and strategy in the closed reasoning contract.
- Added canonical `RouteCapabilityContract.actionName`; CLI projection consumes it instead of deriving action names from HTTP methods.
- Preserved generic `DataFlowInterface` as domain-neutral execution; downstream authority remains `DataFlowConsumerInterface` / `DataFlowWiringInterface`.
- Kept `SemanticDataflowInterface` as the closed semantic judgment boundary.
- Extended semantic ownership audit to enforce the new action-name and reasoning-algebra boundaries.

## External design alignment

MLIR interfaces exist specifically so analyses and transformations can consume semantic capabilities without knowing concrete operation/dialect implementations. TypeScript interfaces name contracts structurally. CodeQL separates generic data-flow machinery from semantic configuration. TanStack Query keeps query identity/query functions in typed query options rather than making consumers infer them from transport details. Axios remains transport response machinery, not semantic authority.

## Invariant

**Reason once upstream → prove → close → interface → wire → consume.**
