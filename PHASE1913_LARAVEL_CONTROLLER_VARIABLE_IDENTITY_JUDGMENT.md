# Phase 1913 — Laravel Controller Variable Identity Judgment

## Trace finding

`controllerDataflowAnalyzer.ts` reconstructed a `VariableName` by searching semantic knowledge and, when no variable/value fact matched, silently using `KnowledgeId.identity.slot.value`. That fallback confused an opaque identity slot with a proven source variable name.

## Interface-first correction

- Added `ControllerDataflowVariableIdentityAuthorityInterface` and a closed judgment with `resolved`, `missing`, and `ambiguous` outcomes.
- The upstream authority resolves names only from canonical `SemanticVariable` facts matching the complete knowledge identity (role, slot, source file/span, and evidence provider).
- The analyzer now delegates the lookup and preserves all identity judgments in `ControllerDataflowAst.variableIdentityJudgments`.
- Definitions are projected only when both binding-payload correspondence and variable identity are resolved. Missing or ambiguous identity is retained as a judgment instead of fabricating a name.
- The production composition root wires the authority. The canonical invocation judgment and integrated response composition remain unchanged and distinct.
- Scanner boundary contract advanced from version 78 to 79.

## Remaining work

The analyzer still performs PHP AST payload traversal, invokes the existing semantic variable executor, and groups definitions into `ControllerSemanticVariableFlow`. This phase does not claim that the scanner is wiring-only. Those responsibilities require a consumer trace and compatible upstream ownership before migration.

## Verification boundary

The accompanying audit is static source inspection only. Build, typecheck, and test suites were not run.
