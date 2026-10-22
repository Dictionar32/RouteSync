# Phase 1915 — Laravel Controller Variable-Flow Composition, Interface First

## Trace result

`controllerDataflowAnalyzer.ts` no longer owns `canonicalSemanticVariables`, its `RelationIndex<string, ...>` grouping, or its local sequence constructors. The production analyzer receives `ControllerSemanticVariableFlowCompositionAuthorityInterface` and passes already-resolved, source-backed `ControllerVariableDefinition` values to its `compose` operation.

## Upstream contract

- `controllerSemanticVariableFlowCompositionInterface.ts` declares the typed input, closed `empty` / `composed` judgments, and the authority contract.
- `controllerSemanticVariableFlowCompositionAuthority.ts` composes the canonical `ControllerSemanticVariableFlow`.
- Grouping uses `variableNameEquals(VariableName, VariableName)` rather than a primitive string-key index.
- Definitions are retained in each variable's original order; the composed judgment also retains the original definition evidence.
- The empty case is an explicit judgment and produces an empty canonical sequence.

This is not an AST adapter and it does not duplicate invocation or variable-semantic judgment authority. It owns construction of the canonical variable-flow aggregate from already-judged definitions.

## Production wiring

`controllerVariableSemanticRuntimeBinding.ts` injects the single upstream composition authority into `createControllerDataflowAnalyzer`. The analyzer consumes `judgment` and preserves `judgment.response` as the input to integrated response composition; `invocationJudgment` and `invocationSemanticIntegratedResponse` remain separate fields in the resulting model.

## Remaining work

The analyzer still prepares PHP-AST evidence and parameter bindings for `ControllerVariableSemanticRuntimeExecutorInterface.execute`. That is a source-adaptation / runtime orchestration seam that needs a consumer trace before redesign. This phase does not claim the analyzer is wiring-only. Build and typecheck were not run.
