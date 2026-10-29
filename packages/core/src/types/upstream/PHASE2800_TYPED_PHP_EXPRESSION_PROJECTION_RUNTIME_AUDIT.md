# Phase2800 — Typed PHP Expression Projection Runtime Audit

## Scope

This phase audits the expression-structure projection on the frontend path feeding the upstream scanner and ultimately the CLI manifest. It removes a standalone exported function API in favor of a typed runtime operation object, without changing the projection's domain behavior.

## Runtime trace

```text
CLI scan / sync
  -> manifest scan composition
  -> ManifestBuilder preparation/build
  -> Laravel source AST pipeline
  -> PHP expression classifier runtime
  -> structured ExpressionStructure judgment
  -> phpExpressionStructureProjectionOperation.project(...)
  -> PhpAstValue
  -> controller/route/source AST assembly
  -> source-model judgment
  -> SemanticDataflowManifestSurfaceInterface
  -> ManifestBuilderJudgment
  -> CLI manifest projection / validation / serialization
```

The projection consumes an already-resolved `ExpressionStructure`; it does not choose precedence, select expression candidates, or derive semantic dataflow closure.

## Contract decision

`PhpExpressionStructureProjectionOperationInterface` is intentionally local to `compiler/frontend/php`. Its inputs and output are frontend-owned types (`ExpressionStructure<TokenDescriptor, ...>`, `TokenDescriptor`, `PhpAstValue`, and `PhpExpressionStructureProjection`). Existing `packages/core/src/types/upstream` contracts do not own this concrete frontend projection API, so promoting it into the upstream types layer would invert dependency direction. No upstream interface was added.

Runtime export shape:

```ts
export const phpExpressionStructureProjectionOperation:
  PhpExpressionStructureProjectionOperationInterface = Object.freeze({
    project: (structure, sourceTokens, projection) => {
      // Explicit ADT projection; existing implementation retained.
    },
  });
```

The old `projectPhpExpressionStructure(...)` export was removed and `astClassifierRuntime.ts` now invokes `.project(...)`.

## ADT and reasoning boundary

The projection retains explicit cases for `short_ternary`, `ternary`, `array_access`, `call`, `binary`, and `unary`. This switch is exhaustive elimination of the resolved expression-structure ADT inside its owning projection operation, not a new reasoning primitive. Semantic authority and closure remain outside this module.

`packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Verification

Run `npm run audit:phase2800-typed-php-expression-projection-runtime` for structural checks. Syntax-only TypeScript transpilation and ZIP integrity are checked separately for this artifact. Full typecheck, build, complete tests, and CLI scan/sync end-to-end are not claimed unless executed.
