# Phase 3012 — Fully Explicit Simplicity Typed Runtime Scanner Operations Audit

## Objective

Continue Phase 3011 by raising two connected boundaries on the reachable CLI → PHP invocation pipeline → manifest path:

1. The controller invocation semantic preparation input must carry a domain operation that continues preparation, not merely `kind` and data fields.
2. The exported PHP source invocation pipeline authority factory must be an explicitly typed interface object, called through a named operation rather than as a bare callable.

## Implementation A — operational preparation input ADT

Changed files:

- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationInterface.ts`
- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationAuthority.ts`
- `packages/core/src/types/upstream/index.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`

The preparation input now has a typed operation:

```ts
readonly continueToPreparation: (
  dependencies: LaravelControllerInvocationSemanticJudgmentPreparationDependencies,
) => LaravelControllerInvocationSemanticJudgmentPreparationJudgment;
```

The caller supplies only `LaravelControllerInvocationSemanticJudgmentPreparationInputData` to the canonical factory. The factory creates a frozen input ADT and attaches `continueToPreparation`, closing over the canonical input. The continuation forwards that exact input and typed dependencies to the existing preparation authority.

The production composition now constructs the input through the factory and calls `preparationInput.continueToPreparation(...)`. It no longer invokes `laravelControllerInvocationSemanticJudgmentPreparationFactory.prepare(...)` directly at that runtime boundary.

## Implementation B — interface-first PHP pipeline authority factory

Changed files:

- `packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts`
- `packages/core/src/types/upstream/index.ts`
- `packages/core/src/index.ts`
- `packages/cli/src/parsers/php/sourceInvocationPipeline.ts`

The previous callable export `createPhpSourceInvocationSemanticPipelineAuthority` was removed from source code and public source barrels. It is replaced with:

```ts
export const phpSourceInvocationSemanticPipelineAuthorityFactory:
  PhpSourceInvocationSemanticPipelineAuthorityFactoryInterface = Object.freeze({
    kind: 'php_source_invocation_semantic_pipeline_authority_factory',
    create: createPipeline,
  });
```

The reachable CLI composition calls `phpSourceInvocationSemanticPipelineAuthorityFactory.create(...)`. This matches the requested interface-first pattern: a named domain operation is exposed through an explicitly annotated frozen object, rather than relying on a standalone callable export's inferred shape.

## Runtime trace

1. CLI composition injects the PHP frontend adapter and existing upstream authorities into `phpSourceInvocationSemanticPipelineAuthorityFactory.create(...)`.
2. The resulting pipeline authority exposes `analyze(document)` through `PhpSourceInvocationSemanticPipelineInterface`.
3. Controller source documents are passed to the pipeline and each pipeline result is used to create a canonical invocation semantic input.
4. `laravelControllerInvocationSemanticJudgmentPreparationInputFactory.create(...)` creates a frozen preparation input carrying documents and both project identities.
5. `preparationInput.continueToPreparation(dependencies)` invokes the preparation authority through the ADT-owned domain operation.
6. The authority delivers pipeline results, creates invocation judgments using the canonical `laravelControllerInvocationSemanticInputFactory.withPipeline(...)`, and constructs source inventory evidence.
7. The preparation judgment's `continueWith(...)` delivers evidence to inventory closure.
8. Inventory closure validates source inventory and judgments before passing the validated receipt with the existing route-selection intent to manifest builder preparation.
9. The manifest terminal judgment continues to the CLI/drift-audit consumer through its existing domain operation.

The source-project identity from discovery and the requested/canonical identity remain distinct. Route-selection intent remains a separate input and is not recreated from controller discovery.

## Why this is a model improvement

The preparation input ADT now carries an operation that advances it to semantic preparation. The composition root creates the model and invokes the model's operation. Separately, the pipeline authority factory is no longer exported as a bare callable; its `create` operation is governed by an explicit interface and used by the production CLI path.

This is a targeted migration based on a reachable call graph, not a repository-wide syntax rewrite. The legacy `prepare(input, dependencies)` method remains for compatibility and is called by the ADT continuation. Other callable exports require their own reachability and domain-contract audit before migration.

## Verification

- Structural audit: `PHASE3012_AUDIT.json` — 16/16 source-shape and constraint checks passed.
- Syntax-only transpilation: `PHASE3012_SYNTAX_CHECK.json` — 7 TypeScript files, zero syntax diagnostics.
- Full project typecheck: not run.
- Unit tests: not run.
- Laravel CLI end-to-end: not run.

These checks do not prove full type correctness or end-to-end runtime behavior.

## Preserved constraints

- `packages/core/src/types/upstream/collections.ts` remains whitespace-only.
- `relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` remain absent; no kernel re-exports were restored.
- No global mass replacement of `export function`, inferred arrow exports, `if`, `switch`, `===`, `??`, or ternaries was attempted. Those constructs must be reviewed on the reachable runtime call graph and elevated only where their meaning belongs in the domain model.

## PHP / Laravel semantic context

Laravel routing distinguishes route parameters, controller actions, dependency injection, and route-model binding. These are distinct source semantics that should remain represented upstream rather than be re-inferred by the CLI. See the official [Laravel Routing documentation](https://laravel.com/framework/docs/routing).

PHP type declarations constrain parameter and return values at runtime, but type annotations alone do not establish provenance or prove that source data is semantically valid. See the official [PHP Type Declarations manual](https://www.php.net/manual/en/language.types.declarations.php).
