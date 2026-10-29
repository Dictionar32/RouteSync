# Phase 2791 — Fully Typed Runtime Scanner Operations: Upstream CLI Manifest Trace

## Runtime-path trace

```text
packages/cli/src/commands/scan.ts / sync.ts
  -> composition.manifestScanOperation.scan(...)
  -> controller-invocation manifest composition
  -> upstream manifest scan operation
  -> manifestBuilderOperationPreparation.prepare(input)
  -> laravelSourceAstPipelineFactory.create(dependencies, pipelineInput)
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelSourceAstProjectionJudgment
       ├─ complete -> CompleteSourceAst
       └─ blocked  -> preserve source-AST blocker
  -> completeLaravelSourceModelBuilder.build(...)
       ├─ complete -> semantic data-flow/resource capability construction
       └─ blocked  -> manifest_builder_blocked(stage: source_model)
  -> manifest_builder_complete(RouteSyncManifest)
  -> CLI manifest projection / validation / serialization
```

The manifest builder's complete/blocked judgment remains the gate between scanner output and manifest publication. The CLI scan/sync path consumes the injected `manifestScanOperation`; it must not create a second source interpretation path.

## Implemented runtime operation migration

`phpAstExpressionSemanticAuthority.ts` previously exported `projectPhpAstExpressionToUpstream(...)` and `projectPhpStatementsToSourceStatements(...)` as free function declarations. Those functions are now private implementation details. Consumers use the parser-local, interface-typed frozen operation object:

```ts
export const phpAstExpressionProjectionOperations:
  PhpAstExpressionProjectionOperationsInterface = Object.freeze({
    projectExpression: projectPhpAstExpressionToUpstream,
    projectStatements: projectPhpStatementsToSourceStatements,
  });
```

The parser-specific interface is intentionally declared in the PHP frontend rather than `types/upstream`: it accepts `PhpAstValue` and `PhpStatement`, which are frontend evidence types. This preserves the upstream dependency direction. The separate `phpAstExpressionSemanticAuthority` remains the upstream-contract adapter and still emits the existing `Expression` ADT.

Example use on the scanner/producer runtime path:

```ts
const expression = phpAstExpressionProjectionOperations.projectExpression(astValue, sourceFile);
const statements = phpAstExpressionProjectionOperations.projectStatements(method.body, sourceFile);
```

Both operations retain the original typed `Expression` / `SourceStatements` outputs; they do not introduce a generic result wrapper or reinterpret missing evidence as an empty successful scan.

The change migrates direct expression/statement projection consumers in scanner and semantic producers to the explicit operation object. It does not claim that all exported functions throughout the repository have been eliminated; the scope is the AST projection operation on the upstream manifest's source-acquisition/production path.

## ADT boundaries

- `LaravelSourceAstProjectionJudgment` still distinguishes complete from blocked projection.
- `ManifestBuilderJudgment` still distinguishes complete manifest from source-AST and source-model blockers.
- Domain relations such as `SemanticDataFlowRelation` remain domain data; generic relation utility removal is a separate migration and is not silently conflated with this phase.
- `packages/core/src/types/upstream/collections.ts` remains 0 bytes. No `Sequence` replacement or generic collection wrapper is added.

## Verification

Run `npm run audit:phase2791-php-ast-projection-runtime-operations`. This is a structural audit, not proof of TypeScript typecheck, build, unit tests, or real CLI end-to-end success. The repository environment may not have the project dependency tree installed; do not treat global TypeScript transpilation as a full typecheck.

## Official TypeScript reference

The TypeScript Handbook explains interfaces as named contracts and discriminated unions/control-flow narrowing as explicit variant handling:
- https://www.typescriptlang.org/docs/handbook/interfaces
- https://www.typescriptlang.org/docs/handbook/2/narrowing.html
