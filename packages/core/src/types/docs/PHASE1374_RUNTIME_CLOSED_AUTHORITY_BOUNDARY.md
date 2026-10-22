# Phase 1374 — Runtime Closed Authority Boundary

## Trace

`SemanticDataflowInput -> SemanticDataflowReasoningAuthorityInterface.judge -> SemanticDataflowJudgment -> DataFlowAuthorityInterface -> analysis/policy/IR consumers`

The upstream authority remains the only binding to the concrete fixed-point solver. The runtime composition root selects that authority; the adapter does not import the solver.

## Change

The runtime adapter previously returned `DataFlowInterface`, including `seed`, `derive`, and `close` operations even though its state was already a closed `SemanticDataflowJudgment`. The `derive` and `close` functions merely returned their input, and `seed` invoked a second authority judgment. This mixed producer execution with the read-only consumer boundary.

The adapter, runtime boundary, and `SemanticDataflowAnalysisResult.interface` now use `DataFlowAuthorityInterface`. The output exposes canonical `input`, `state`, `reasoning`, `closed`, and identity-aware `reaches`; it does not advertise producer operations. `SemanticDataflowJudgment` remains the canonical ADT, and `SemanticDataflowReasoningAuthorityInterface` remains the authority contract.

## Preserved ownership

- AST/ADT producer supplies typed evidence; upstream authority closes it.
- Runtime composition binds the concrete authority.
- Wiring preserves the exact reasoning proof and closed state.
- Policy and IR query the closed state without running a second solver.
- Structural graph relations remain separate from runtime value dataflow.
- Operation identity, manifest, SDK, React, and CLI contracts are not reclassified.

## Validation boundary

`audit-phase1374-runtime-closed-authority-boundary.cjs` checks the boundary and related consumers. This is a static source audit; TypeScript build and runtime tests require installed project dependencies.
