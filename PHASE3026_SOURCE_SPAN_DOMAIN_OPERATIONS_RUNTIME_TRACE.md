# Phase 3026 — SourceSpan Domain Operations Runtime Trace

## Objective

Raise source-position knowledge into an explicit upstream model. The change centralizes equality, bounds validity, containment, and document-coverage judgments behind `SourceSpanOperationsInterface` and an interface-backed `sourceSpanFactory`.

## Runtime path traced

1. The PHP parser adapter reads node start/end offsets at the syntax boundary.
2. `packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts` converts those boundary offsets into `NumberValue` evidence and constructs spans through `sourceSpanFactory`.
3. The route AST payload adapter in `packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter.ts` uses the same span factory for source evidence attached to payloads.
4. `phpSourceFrontendExtractionValidationAuthority` delegates span equality, validity, containment, and whole-document coverage to `sourceSpanOperations`.
5. `phpFunctionResolutionSourceInventoryAuthority` delegates source-span equality, validity, and region containment to the same domain operations.
6. These upstream judgments remain part of the evidence pipeline consumed by invocation resolution and ultimately the CLI manifest composition path; the change does not replace the CLI manifest authority or alter its public input/output contract.

## Domain contract

- `SourceSpan` retains the canonical source file identity and both boundaries.
- `sourceSpanFactory: SourceSpanFactoryInterface` is the only constructor used by the migrated runtime adapters.
- `sourceSpanOperations: SourceSpanOperationsInterface` returns closed ADT judgments for equality, bounds validity, containment, and full-document coverage.
- Empty spans are distinguished from reversed bounds; a zero-width span is not automatically mislabeled as malformed.
- Primitive offsets remain at the parser/serialization boundary for compatibility. Domain consumers should use the operations instead of independently repeating offset arithmetic.

## Laravel relevance

The parser should preserve source evidence for route declarations, controller actions, route parameters, and model-binding conventions. Laravel's official routing documentation describes route parameter ordering and implicit model binding, including the relationship between `{user}` and a typed `User $user` action parameter. That domain knowledge should be retained as evidence and typed judgments rather than rediscovered from raw text downstream: https://laravel.com/framework/docs/routing.

## Verification

- Phase 3025 static audit: passed.
- Phase 3026 static audit: 10/10 checks passed.
- `package.json` parses successfully.
- The repository's `collections.ts` one-newline-byte sentinel remains intact.
- Deleted relation foundation modules remain absent.
- Full TypeScript typecheck, Vitest execution, and CLI-to-manifest end-to-end test were not run because `node_modules` is absent from the workspace.

## Explicit remaining debt

- `SourceSpan` still stores offsets as `NumberValue`; raw offset comparisons remain in other producers and consumers and require a consumer-by-consumer migration.
- Not all scanner fixtures and producers use `sourceSpanFactory` yet.
- `StatementIndex` still retains a numeric ordinal as boundary/serialization evidence.
- `numberValue` and `truthValue` remain function-valued exports; domain name factories still accept raw strings in places.
- Repository-wide `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, empty-array defaults, `??`, ternaries, and traversal arithmetic are not globally removed. Such removal requires ownership tracing and must not erase parser-boundary facts or source evidence.
- No generic relation foundation was restored.
