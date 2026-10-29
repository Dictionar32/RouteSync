# Phase 2802 — Typed Controller Body Parser Runtime Audit

## Scope

Move the public controller-body parser API from an exported overloaded function to a frozen, interface-first runtime operation. Preserve the existing overload correlation between syntax-only projection and invocation-semantic projection, migrate TypeScript runtime consumers, and trace the operation in the CLI manifest source-AST path.

## Runtime trace

```text
CLI scan.ts / sync.ts
  -> manifest scan composition
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelSourceLexer / controller declaration projection
  -> controllerMethodParser
  -> controllerBodyParser.parse(...)
       -> classifyPhpBlock(tokens)
       -> laravelControllerAstProjectionSemanticAuthority.judge(context)
       -> existing projection judgment ADT
            syntax_only_projection
            invocation_only_projection
            semantic_projection
  -> ControllerBodyAst ADT
  -> controller declaration / method inventory ADT
  -> source-model judgment
  -> SemanticDataflowManifestSurfaceInterface
  -> ManifestBuilderJudgment
  -> CLI manifest projection / validation / serialization
```

The parser continues to project syntax and any supplied canonical invocation judgment. It does not own upstream semantic closure or change the outcome of invocation analysis.

## API change

The old public `parseControllerBody(...)` overload family is now internal as `parseControllerBodyInternal(...)`. The exported runtime surface is:

```ts
export const controllerBodyParser: ControllerBodyParserInterface = Object.freeze({
  parse: parseControllerBodyInternal,
});
```

`ControllerBodyParserOperationInterface` preserves the overload signatures:

- syntax-only context -> `ControllerBodyAst<false>`;
- invocation-semantic context -> `ControllerBodyAst<true>`;
- general projection context -> `ControllerBodyAst<boolean>`.

`controllerMethodParser.ts` and `ecommerceShopDataflowPhase104.spec.ts` now call `controllerBodyParser.parse(...)`. The frontend barrel exports the runtime object and its two interface types.

## Upstream contract-first decision

Inspected existing contracts before adding any interface:

- `LaravelControllerAstProjectionSemanticAuthorityInterface` and `LaravelControllerAstProjectionContext` define the projection-context judgment boundary.
- `LaravelControllerInvocationSemanticJudgmentInterface` carries the canonical invocation judgment consumed by dataflow binding.
- `ControllerBodySemanticJudgmentAuthorityInterface` owns a different responsibility: deriving closed body meaning from body evidence, method evidence, and source identity.

None of these upstream contracts owns the frontend parser's concrete source/token input and `ControllerBodyAst` output. The new parser interfaces therefore remain local to `compiler/frontend/php`; no duplicate contract was added to `types/upstream`.

## ADT and reasoning boundary

The existing projection judgment remains explicitly discriminated by `syntax_only_projection`, `invocation_only_projection`, and `semantic_projection`. The body output retains the `controller_body_syntax_only` vs `controller_body_semantic` distinction. No new generic reasoning primitive, generic result wrapper, or collection abstraction was added. `packages/core/src/types/upstream/collections.ts` remains 0 bytes.

## Verification

- Phase2802 structural audit: 12/12 passed.
- Phase2801 structural audit: 12/12 passed.
- TypeScript syntax-only transpilation: 4 relevant `.ts` files, 0 syntax errors.
- Old exported `parseControllerBody` declaration absent from the TypeScript implementation.
- `collections.ts`: 0 bytes.

The standalone bundled artifact `scripts/scan-toko-online.cjs` still contains its own JavaScript `parseControllerBody` implementation; it was not regenerated because the workspace does not have the project dependency install/build available. This is an explicit remaining runtime artifact boundary.

Full TypeScript typecheck, production build, complete test suite, and CLI scan/sync end-to-end were not run and are not claimed as passing.
