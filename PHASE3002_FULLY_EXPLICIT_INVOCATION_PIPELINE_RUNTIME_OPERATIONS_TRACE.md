# Phase 3002 — Fully Explicit Invocation Pipeline Runtime Operations

## Scope

Phase 3002 continues from the Phase 3001 workspace and targets two parameterized construction exports in `packages/core/src/types/upstream/invocationSemanticPipeline.ts`. They are part of the upstream invocation semantic runtime used by the Laravel scanner and therefore lie on the scanner/runtime path rather than being an unrelated global rewrite.

## Changes

- Added `InvocationSemanticPipelineFactoryInterface`.
- Added `InvocationSemanticIntegratedResponseCompositionFactoryInterface`.
- Replaced `createInvocationSemanticPipeline(...)` with `invocationSemanticPipelineFactory.create(...)`.
- Replaced `createInvocationSemanticIntegratedResponseComposition(...)` with `invocationSemanticIntegratedResponseCompositionFactory.create(...)`.
- Updated the public core barrel to export the two factory operation objects and their interface contracts.
- Bumped `INVOCATION_SEMANTIC_PIPELINE_CONTRACT.version` from 61 to 62 to reflect the public construction-contract change.
- Preserved the exact injected invocation authority, batch authority, inventory, and publication authority. The factory only composes existing domain owners; it does not duplicate semantic analysis.

## Runtime trace

```text
Laravel scanner source-bound knowledge projection
  → invocationSemanticIntegratedResponseComposition.integrate(...)
  → invocationSemanticPipeline.analyzeKnowledge(knowledge)
  → semanticInterproceduralDataFlowAuthority.analyze(knowledge)
  → coverage publication authority
  → integrated response judgment
  → scanner-facing integrated-response result

This trace establishes the invocation semantic composition path. It does not prove a field-by-field bridge from route schema evidence to the separate CLI invocation manifest.
```

Construction path:

```text
invocationSemanticPipelineFactory.create(existing invocation authority, existing batch authority)
  → invocationSemanticPipeline

invocationSemanticIntegratedResponseCompositionFactory.create(existing inventory, pipeline, publication authority)
  → invocationSemanticIntegratedResponseComposition
```

The composition continues to use the one canonical `input.semanticKnowledgeProjection.knowledge` value for inventory and analysis. No duplicate knowledge graph is introduced.

## Explicitly not claimed

- This phase does not prove the schema-evidence bridge between route manifest and the separate CLI invocation manifest.
- This phase does not migrate every exported parameterized function across the repository; it changes the two construction exports in the traced invocation pipeline.
- The audit is structural. Full typecheck, Vitest, and Laravel CLI end-to-end tests were not run in this phase.

## Verification

- Repeatable structural audit: recorded in `PHASE3002_AUDIT.json`.
- TypeScript syntax transpilation: the runtime file, interface file, and public barrel are checked with the globally installed TypeScript transpiler; all three report zero syntax diagnostics.
- Full typecheck was attempted but could not meaningfully start: the globally installed compiler rejects the repository tsconfig target/lib values and cannot resolve the `node` and `vitest/globals` type definitions. This is not a successful typecheck.
- No deleted relation foundation module was restored.
- `packages/core/src/types/upstream/collections.ts` remains intentionally empty.

## Laravel/PHP semantic basis

Laravel routes may use closures or controller actions, and route callbacks may receive typed dependencies through the service container. The scanner must preserve source-derived facts and delegate semantic interpretation to upstream authorities instead of reconstructing framework meaning in the CLI. See the official [Laravel Routing documentation](https://laravel.com/framework/docs/routing) and [Laravel Controllers documentation](https://laravel.com/framework/docs/13.x/controllers).
