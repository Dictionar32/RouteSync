# Phase 2803 — Typed Controller Method and Return Runtime Audit

## Scope

This phase migrates the controller method parser, parameter-attribute parsing entry point, and controller return-expression parser to interface-first frozen runtime operation objects. It continues the CLI manifest trace from Phase 2802 and checks upstream contracts before introducing contracts.

## Runtime trace

```text
packages/cli/src/commands/scan.ts / sync.ts
  -> manifestScanOperation.scan(input)
  -> CLI controller-invocation manifest composition
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelSourceLexer / controller declaration parser
  -> controllerDeclarationParser
  -> controllerMethodParser.parse(...)
       -> controllerMethodParser.parseParameterAttributes(...)
       -> controllerReturnParser.parse(source, bodyTokens)
       -> controllerBodyParser.parse(...)
  -> controller method declaration inventory
       -> controller_method_declaration_inventory_complete
       -> controller_method_declaration_inventory_blocked
  -> source-model judgment
       -> complete | blocked
  -> SemanticDataflowManifestSurfaceInterface
  -> ManifestBuilderJudgment
       -> manifest_builder_complete | manifest_builder_blocked
  -> CLI manifest projection / validation / serialization
```

The method and return parsers produce frontend-owned syntax AST. They do not own or synthesize semantic closure. Existing blocked/complete inventory ADTs and the distinction between `syntax_only` and `invocation_semantic_judgment` remain intact.

## Applied API shape

- `controllerMethodParser: ControllerMethodParserInterface = Object.freeze({...})`
  - `parse` retains overloads correlating the projection context with `ControllerMethodAst<false>`, `ControllerMethodAst<true>`, or the broader union result.
  - `parseParameterAttributes` is exposed as an operation member instead of a standalone exported function.
- `controllerReturnParser: ControllerReturnParserInterface = Object.freeze({...})`
  - `parse(source, tokens)` returns `readonly ReturnStatementAst[]`.
- Call sites use `controllerMethodParser.parse(...)`, `controllerMethodParser.parseParameterAttributes(...)`, and `controllerReturnParser.parse(...)`.
- Old standalone exports `parseControllerMethod`, `parseParameterAttributes`, and `parseControllerReturns` are removed. Their implementation helpers remain module-private.

## Upstream contract-first review

Reviewed existing contracts:

- `controllerRuntimeReturnProjectionInterface.ts`: downstream consumer projection from an exact method and source-file identity into the existing runtime-return ADT; it is not the syntax parser contract.
- `controllerReturnSemanticProductionInterface.ts`: produces the existing `ControllerReturnSemantic` ADT from method evidence, source identity, and a response-reference judgment; this is not equivalent to parsing return statements from PHP tokens.
- `controllerEvidence.ts`: defines upstream-owned `ControllerReturnExpressionEvidence` with source spans and expression kind, intentionally avoiding concrete frontend AST types.
- `controllerBodySemanticJudgmentInterface.ts`: owns semantic body judgment, not method declaration syntax parsing.

No new interface or ADT was added to `packages/core/src/types/upstream`: parser contracts depend on frontend-owned `TokenDescriptor`, `ControllerMethodAst`, and `ReturnStatementAst`, so they remain in `compiler/frontend/php`. This avoids reversing the dependency direction or creating a duplicate upstream contract. `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Runtime example

```ts
const parsedMethod = controllerMethodParser.parse(
  source,
  tokens,
  functionIndex,
  context,
  projectionAuthority,
);

const returnStatements = controllerReturnParser.parse(source, bodyTokens);
```

## Verification

Structural audit command:

```bash
npm run audit:phase2803-typed-controller-method-return-runtime
```

The audit checks the interface-first exports, legacy API removal, migrated call sites, overload/ADT preservation, contract-first review, CLI manifest trace, and the empty collections module. Syntax-only transpilation and ZIP integrity are reported separately from full typecheck/build/test claims.

Official TypeScript references:

- [Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces)
- [More on Functions — Function Overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [Unions and Intersection Types — Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html)
