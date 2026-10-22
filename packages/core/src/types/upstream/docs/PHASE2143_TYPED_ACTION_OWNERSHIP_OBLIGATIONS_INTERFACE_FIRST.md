# Phase 2143 — Typed Action Ownership Obligations, Interface First

## Why this change

Phase 2142 made action semantic coverage truthful, but the open ownership frontier was still encoded as tuples of string labels plus a long closure sentence. That is readable to a human but weak as an interface: a label cannot state which implementation currently owns a derivation or which existing authority is expected to own it next.

## Interface evolution

`laravelControllerActionSemanticJudgmentInterface.ts` now models two different frontiers as typed contracts:

- `LaravelControllerActionProjectionRemainder` describes `body_source_ast` still carried by compiler projection, with `compiler_projection` as current owner and `upstream_body_semantic_knowledge` as target.
- `LaravelControllerActionDerivationOwnershipObligation` is a closed union for `body_source_ast`, `resource_binding_aggregation`, and `request_binding_compatibility_adapter`. Each variant records the legacy current owner and its existing upstream semantic target.

This does not create a new authority, relation/foundation layer, or subscanner. The values identify migration obligations only; they do not claim the target migration has already happened. Action judgment contract version advances from 12 to 13 and production composition uses the same coverage value.

## Trace retained

1. `LaravelControllerScanner` passes the exact `invocationJudgment` to `actionJudgment.judge`.
2. The production action authority still calls `scanControllerAction`, which calls `resolveControllerActionContract`. This remains explicit legacy derivation debt.
3. `actionExecution.execute` forwards the exact published action judgment without rebuilding it.
4. `judgeIntegratedResponse` receives the same invocation judgment and declaration evidence through the existing controller response pipeline.
5. The scanner passes the exact invocation and response judgments to the existing AST projection authority.

## Remaining architectural debt

- Body source AST ownership has not moved out of the legacy action contract.
- Resource-binding aggregation still traverses the legacy action contract even though individual binding semantics are published.
- Request binding still uses the compatibility adapter.

The next implementation must close these derivations using existing upstream authorities before removing the legacy contract. Moving `scanControllerAction` or wrapping the resolver in another interface would not count as semantic migration.

## Verification boundary

The Phase 2143 structural audit checks the typed obligations, version synchronization, exact invocation correlation, response pipeline ownership, executor pass-through, and absence of relation/foundation/subscanner additions. Syntax-only transpilation is performed separately. Full build, full typecheck, and Vitest are not run in this environment.
