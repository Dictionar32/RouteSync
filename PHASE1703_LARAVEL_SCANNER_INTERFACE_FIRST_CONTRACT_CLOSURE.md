# Phase 1703 — Laravel Scanner Interface-First Contract Closure

## Scope

This phase corrects the interface contracts before any production wiring migration. It is not a scanner migration and does not claim that the semantic authorities already satisfy the strengthened contracts.

## Changes

- Route scanner contract now receives a `RouteControllerBindingJudgmentAuthority` explicitly and returns the binding judgments alongside ASTs and route semantic flows.
- Route source evidence is modeled separately from candidate-specific evidence. This permits a well-formed unresolved judgment when there is no controller candidate, while resolved/ambiguous outcomes require candidate-specific evidence.
- Ambiguous route bindings require at least two candidates at the type level.
- Resource scanner contract receives canonical `ModelDefinition[]`, source-backed relation evidence, and an explicit `ResourceModelBindingJudgmentAuthority`; it returns model-binding judgments as first-class output.
- Resource candidate evidence is attached to each candidate rather than stored in a shared list that could drift between models.
- Resource evidence basis now includes `structural`, matching the existing `ResourceModelCandidateSource` vocabulary.
- Controller scanner contract explicitly depends on the existing `InvocationSemanticPipelineInterface` and returns invocation analyses as first-class output; no second invocation resolver is introduced.

## Trace findings that remain open

1. `laravelSourceAstPipeline.ts` still invokes concrete scanner static methods directly. This phase intentionally does not change production wiring.
2. `resourceModelReasoning.ts` currently selects the first candidate by precedence and does not produce an explicit ambiguous outcome. The strengthened resource judgment contract is not yet implemented by that authority.
3. The new scanner interface inputs/outputs are not yet implemented by the legacy scanner classes. They must not be wired until their adapters/authorities are implemented and type-checked.
4. Full build/typecheck has not been run in this environment. The previous workspace lacked `tsdown`; this phase's static audit is not a substitute for compilation.

## Validation

Run:

```sh
npm run audit:phase1703-laravel-scanner-interface-first-contract-closure
```

The audit passes only if the interface contracts have the expected structure and the two known migration gaps remain explicitly detectable. Passing this audit does **not** mean migration is complete.

## Architecture rule

`Source evidence → semantic knowledge → closed judgment → interface contract → wiring → runtime executor → downstream projection`.

Do not move semantic classification into scanner facades or adapters. Do not add dependencies on `core/src/semantic/foundation`.
