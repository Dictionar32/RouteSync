# Phase 2792 — Fully Typed Runtime Scanner Operations

## Runtime trace: upstream CLI manifest

```text
packages/cli/src/commands/scan.ts / sync.ts
  -> composition.manifestScanOperation.scan(...)
  -> controller-invocation manifest composition
  -> upstream manifest scan operation
  -> manifestBuilderOperationPreparation.prepare(input)
  -> laravelSourceAstPipelineFactory.create(...)
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelSourceAstProjectionJudgment
       ├─ complete -> CompleteSourceAst
       └─ blocked  -> preserve source-AST blocker
  -> completeLaravelSourceModelBuilder.build(...)
       ├─ complete -> source model and semantic capabilities
       └─ blocked  -> manifest_builder_blocked(stage: source_model)
  -> ManifestBuilderJudgment
       ├─ manifest_builder_complete -> CLI manifest projection
       └─ manifest_builder_blocked -> preserve blocker
  -> validation / serialization
```

The CLI `scan` and `sync` commands continue to share the injected `manifestScanOperation`. The manifest-builder ADT remains the publication boundary: blocked scanning/model construction is not reinterpreted as a successful empty manifest.

## Interface-first runtime operation

`phpAstExpressionMappings.ts` no longer exports its mapping helpers as individual `export function` declarations. The helpers are private implementation details, exposed through one typed operation surface:

```ts
export interface PhpAstExpressionMappingOperationsInterface {
  readonly resolveArguments: (arguments_: readonly PhpArgument[], resolveExpression: UpstreamExpressionMapper, file: string) => readonly ExpressionArgument[];
  readonly resolveLiteral: (value: PhpLiteralValue, source: SourceSpan) => Expression;
  // Remaining operation signatures are explicit in the source interface.
}

export const phpAstExpressionMappingOperations:
  PhpAstExpressionMappingOperationsInterface = Object.freeze({
    resolveArguments,
    resolveLiteral,
    memberExpression,
    methodExpression,
    propertyPath,
    resolveBinaryOperator,
    resolveUnaryOperator,
    resolveCastType,
    resolveArrayEntry,
    resolveArrayKey,
    resolveAssignmentOperator,
    assignmentReferenceMode,
    resolveAssignmentTarget,
    resolveClosureParameter,
    resolveParameterType,
  });
```

Scanner and semantic producers call `phpAstExpressionMappingOperations.resolveAssignmentTarget(...)`, `...resolveAssignmentOperator(...)`, `...resolveClosureParameter(...)`, etc. rather than importing individual exported functions. The closure traversal has its own `PhpAstExpressionClosureOperationsInterface` and frozen `phpAstExpressionClosureOperations` object; its former free-function exports are also private implementation details.

## Low-level relation-helper removal in this mapping boundary

The PHP AST expression-mapping and closure-traversal modules no longer import generic `semantic/relations` utilities. It uses explicit TypeScript `switch` statements over the existing parser-owned discriminated unions for literal kinds, argument kinds, access modes, array keys/entries, assignment targets, destructuring entries, and optional closure parameter values. Array mapping uses the source evidence's `.map`; `sequence` constructs the existing `Sequence` ADT directly. No new generic collection wrapper was added.

This change is scoped to the PHP AST expression-mapping boundary. It does **not** claim that every generic relation utility has been removed from every RouteSync low-level module; remaining call sites still require their own domain-by-domain migration.

## Domain ADTs remain

Semantic relationships are data, not generic collection utilities. `SemanticDataFlowRelationDefinition` and `SemanticDataFlowEdge` remain preserved as domain ADTs; relation codes `depends_on` / `flows_to` and the edge endpoints/role remain explicit domain data. The scanner's complete/blocked judgments also remain distinct. `packages/core/src/types/upstream/collections.ts` remains 0 bytes, and no `Sequence` replacement or generic collection wrapper is introduced.

## Verification

Run:

```bash
npm run audit:phase2792-fully-typed-runtime-scanner-operations
npm run audit:phase2791-php-ast-projection-runtime-operations
```

The Phase 2792 structural audit and syntax transpilation do not prove full repository typecheck, build, tests, or CLI end-to-end behavior. Those must be reported separately if not executed successfully.

## Official TypeScript references

- Interfaces as named contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- Discriminated unions and variant narrowing: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
