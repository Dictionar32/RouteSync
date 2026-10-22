# Phase 1705 — Laravel Scanner Interface Contract Model

## Scope

This phase is intentionally interface-first. It changes Laravel scanner interface types and the Laravel scanner semantic-judgment contract only. It does **not** change `laravelSourceAstPipeline`, concrete scanner implementations, semantic authorities, or runtime wiring.

## Trace findings

1. The six scanner interfaces were previously type declarations with independently returned arrays. That allowed ASTs, definitions, semantic flows, and judgments to become misaligned by index or ordering.
2. `ResourceModelBindingSubject` carried both a `ResourceReference` and a separate `ResourceName`, duplicating canonical identity.
3. The resource `unresolved` outcome required `ResourceModelBindingEvidence[]`, but each such evidence item required a model identity. That made the no-model-candidate case unable to represent source evidence without fabricating a candidate.
4. The controller scanner interface should not own invocation analysis. The existing `controllerDataflowAnalyzer` already delegates to `invocationSemanticPipeline.analyzeKnowledge(...)`.
5. The existing invocation judgment contract already models closed/incomplete results, unresolved/ambiguous target outcomes, evidence, proof, rule traces, and obligations. This phase preserves that authority rather than introducing a parallel invocation resolver.
6. Resource input duplicated model/controller information through both AST arrays and canonical definitions/action contracts. The interface now consumes canonical model definitions and controller action contracts plus explicit relation evidence, without extra model/controller AST arrays.

## Contract corrections

- Versioned all six Laravel scanner interfaces at contract version 2.
- Paired scan products per subject:
  - route AST + semantic flow + route-controller judgment;
  - controller AST + its action contracts;
  - model AST + model definition;
  - FormRequest source evidence + AST + definition;
  - resource AST + definition + model-binding judgment;
  - channel ASTs in a tagged scan judgment.
- Made resource source evidence independent of model-candidate evidence and non-empty for unresolved outcomes.
- Removed duplicated resource name from `ResourceModelBindingSubject`; `ResourceReference` is canonical.
- Bumped `LaravelScannerSemanticJudgmentContract` to version 2.
- Exported artifact and channel judgment types from the public core barrel.

## Validation

Run:

```sh
npm run audit:phase1705-laravel-scanner-interface-contract-model
```

This audit checks contract shape, output correlation, evidence cardinality, public exports, invocation boundary ownership, and confirms the production pipeline remains unchanged.

## Explicitly not claimed

- No authority implementation was added in this phase.
- No scanner implementation was wired to these revised interfaces.
- No production pipeline migration was performed.
- Full TypeScript build/typecheck was not run because this workspace archive has no installed `node_modules` and `tsdown` is unavailable.

Next phase should continue interface validation against actual upstream evidence models and authority contracts before implementing adapters or changing production wiring.

A focused global TypeScript compiler run was attempted against the changed interface entrypoints. It reported pre-existing type errors in unrelated files including `resourceModelMethodResolverOperation.ts`, `resourceModelSurface.ts`, `modelPrimaryKey.ts`, `queryProducerSemanticInterface.ts`, `resourceModelKeyCapability.ts`, `routeSecurityAuthority.ts`, `semanticCapability.ts`, `semanticDataflow.ts`, `semanticDataflowAuthority.ts`, and `semanticReasoning.ts`; no diagnostics were emitted against the Phase 1705 interface files themselves. This is not a passing typecheck. The package build also cannot start because `tsdown` is not installed in the archive environment.
