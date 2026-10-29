# Phase 2801 — Typed Controller Declaration Parser Runtime Audit

## Scope

Migrate the controller declaration parser's public runtime surface from standalone exported functions to a named interface-first frozen operation object. Preserve the separate syntax-only and invocation-semantic entry points so callers cannot accidentally manufacture semantic response evidence from syntax-only parsing.

## Runtime trace

```text
CLI scan / sync
  -> manifest scan composition
  -> ManifestBuilder preparation/build
  -> Laravel source AST pipeline
  -> LaravelSourceLexer controller declaration facade
  -> controllerDeclarationParser.parseSyntaxOnly(...)
       OR controllerDeclarationParser.parseWithInvocationJudgment(...)
  -> controller method parsing / body projection
  -> controller declaration and method inventory ADTs
  -> source-model judgment
  -> SemanticDataflowManifestSurfaceInterface
  -> ManifestBuilderJudgment
  -> CLI manifest projection / validation / serialization
```

The production scanner continues to supply the canonical `LaravelControllerInvocationSemanticJudgmentInterface`; syntax-only consumers remain on the syntax-only operation. A blocked class-body inventory remains blocked and is not turned into an empty complete inventory.

## Contract decision

The existing upstream contracts were inspected, including `LaravelControllerAstProjectionSemanticAuthorityInterface`, `LaravelControllerInvocationSemanticJudgmentInterface`, and controller declaration semantic judgment contracts. These contracts own semantic judgment/provenance and declaration closure, not the concrete frontend parser function signature. The parser input/output types (`TokenDescriptor`, `AstIdentifier`, `ControllerDeclarationAst`) belong to the PHP frontend, so the operation contract is local to `compiler/frontend/php`; no duplicate upstream interface was introduced.

Public runtime shape:

```ts
export const controllerDeclarationParser: ControllerDeclarationParserInterface = Object.freeze({
  parseSyntaxOnly: (source, tokens, className, context, projectionAuthority, classNameResolutionAuthority) => ...,
  parseWithInvocationJudgment: (source, tokens, className, invocationJudgment, projectionAuthority, classNameResolutionAuthority) => ...,
});
```

The previous standalone exports `parseControllerDeclaration` and `parseControllerDeclarationFromInvocationJudgment` were removed. Internal overloads remain implementation details to preserve TypeScript correlation between projection context and return AST type.

## ADT and reasoning boundary

The explicit projection context discriminant (`syntax_only` vs `invocation_semantic_judgment`) remains the boundary. `controller_method_declaration_inventory_complete` and `controller_method_declaration_inventory_blocked` are preserved. No generic reasoning primitive, result wrapper, or collection abstraction was added. `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Verification

Run `npm run audit:phase2801-typed-controller-declaration-parser-runtime`. This is a structural audit. Syntax-only transpilation and ZIP integrity are checked separately. Full typecheck, build, all tests, and CLI scan/sync end-to-end are not claimed unless executed.
