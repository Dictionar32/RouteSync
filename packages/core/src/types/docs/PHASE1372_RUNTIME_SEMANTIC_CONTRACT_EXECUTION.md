# Phase 1372 — Runtime Semantic Contract Execution

## Finding

The production dataflow adapter directly imported `createSemanticDataflowJudgment`. The same concrete constructor was also called by the deprecated AST compatibility analyzer. Although both calls delegated to the upstream solver, the call sites depended on the implementation symbol rather than an executable upstream contract.

## Change

- Added `SemanticDataflowReasoningAuthorityInterface` to the canonical upstream semantic-dataflow types.
- Exported `semanticDataflowReasoningAuthority` from the upstream authority module. Its `judge` operation is the only binding to `createSemanticDataflowJudgment`.
- Changed the runtime adapter to accept the authority contract and call `authority.judge(...)` for both initial projection and subsequent `seed` operations.
- Bound the canonical authority explicitly in `semanticDataflowRuntimeComposition.ts`.
- Routed the deprecated AST compatibility analyzer through the same authority contract.
- Exported the contract and authority through the core public entry point.

## Resulting flow

`SemanticDataflowInput -> upstream SemanticDataflowReasoningAuthorityInterface.judge -> closed SemanticDataflowJudgment -> runtime DataFlowInterface -> analysis / IR / policy consumers`

The runtime adapter executes the upstream contract. It does not implement closure, derive semantic facts, or call the concrete solver directly. `SemanticDataflowJudgment` remains the canonical closed ADT; `SemanticDataflowInterface` remains a read-only projection of that judgment. AST nodes and dataflow nodes are not conflated.

## Validation boundary

The focused audit checks the contract declaration, authority binding, runtime injection, compatibility analyzer, operation identity chain, AST/dataflow ADTs, and downstream boundaries. This is a static source audit. A full TypeScript build and runtime test suite must still be run in an environment with dependencies installed.
