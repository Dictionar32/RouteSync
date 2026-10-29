# Phase 1547 — Controller Variable Semantic Interface-First

## Scope

Trace `packages/core/src/types/upstream` and `packages/core/src/compiler/scanner`, focusing on the controller-variable semantic path left open after Phase 1546.

## Trace finding

`frontend/php/controllerDataflowAnalyzer.ts` contained `solveSemanticCandidate()` and locally selected among `parameter`, `DB::table`, and `external` candidates. That meant the scanner still owned a semantic decision even though the wider architecture had upstream semantic decision algebra and runtime interfaces.

## Contract-first changes

- Added `controllerVariableSemanticInterface.ts` with parser-neutral evidence ADTs, a typed resolution request, a closed judgment, and separate authority/runtime-executor contracts.
- Added `controllerVariableSemanticAuthority.ts`, which owns the controller-variable rules as a declarative contract executed by the existing `semanticDecisionAlgebra`. No second solver was added.
- Added `controllerVariableSemanticRuntimeExecutor.ts`, whose only role is to invoke an injected authority through its interface.
- Added `scanner/wiring/controllerVariableSemanticEvidenceAdapter.ts` to translate PHP AST shapes into neutral evidence. It records variable-reference and static-call shape; it does not decide that `DB::table` means a table origin.
- Added `scanner/wiring/controllerVariableSemanticRuntimeBinding.ts` as the production composition root.
- Changed `controllerDataflowAnalyzer.ts` to receive `ControllerVariableSemanticRuntimeExecutorInterface`; removed its local candidate solver and semantic rule selection.
- Changed `controllerBodyParser.ts` to consume the analyzer through the composition root.
- Extended `ControllerVariableDefinition` with `semanticResolution`, preserving the full upstream rule/evidence/closed judgment beside the compatibility `semantic` projection.
- Exported the new contract, authority, and executor through the upstream barrel.

## Contract flow

```text
PHP AST source evidence
  -> scanner evidence adapter
  -> ControllerVariableSemanticResolutionRequest
  -> ControllerVariableSemanticRuntimeExecutorInterface
  -> ControllerVariableSemanticAuthorityInterface
  -> existing SemanticDecisionAlgebra
  -> closed ControllerVariableSemanticJudgment
  -> controller model + legacy projection
```

## Invariants

1. The interface owns request/result vocabulary and separates authority from runtime execution.
2. The scanner adapter may describe AST evidence but must not assign semantic meaning to it.
3. The controller semantic authority is the only owner of the parameter-binding / DB-table / external-fallback decision rules.
4. The executor is an injected composition, not a second reasoning engine.
5. A legacy `semantic` projection is retained for current consumers, while `semanticResolution` preserves the complete upstream judgment and selected rule.
6. Unknown authority rule identity becomes a contract violation; it is not silently relabeled as the external fallback.

## Verification

- `npm run audit:phase1547-controller-variable-semantic-interface-first`: 13/13 static contract checks passed.
- Targeted TypeScript invocation emitted no diagnostics in the changed controller semantic files; the command still exited non-zero due to unrelated existing diagnostics in other upstream/scanner modules.
- Full build and Vitest were not run: workspace has no `node_modules`, so project dependencies are unavailable.

## Remaining work

- Audit other scanner semantic producers for local rule selection, not just controller variable semantics.
- Migrate consumers that need more than the legacy `semantic` projection to consume `semanticResolution` directly.
- Resolve existing unrelated TypeScript errors and run full build/regression tests with project dependencies installed.
