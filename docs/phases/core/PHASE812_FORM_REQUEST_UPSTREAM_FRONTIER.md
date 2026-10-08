# Phase 812 — FormRequest consumer upstream frontier

## Diagnostic frontier

`FormRequestScanner.ts` was the next DTS consumer after the ResourceScanner frontier. The build exposed four model leaks:

- scanner method names were treated as if `AstIdentifier` had a `.value` property;
- upstream `StringValue` objects were passed to host-string APIs;
- nested `relationOptionFold` returned a semantic AST list where the outer fold expected a `RelationOption`;
- the scanner's lexer type import referenced a non-existent path.

## Model correction

The consumer now uses the existing upstream vocabulary instead of reconstructing or widening it:

- `AstIdentifier` is consumed as the identifier itself by relation predicates;
- `RequestName` is produced through `createRequestName`;
- `SourceFile` is lowered to its `StringValue.value` only at the concrete file-I/O boundary;
- rules/authorization discovery is a single nested relation fold with explicit absence semantics;
- the lexer type reference points to the canonical `LaravelSourceLexer` boundary.

No `Parsed*Descriptor` compatibility layer was introduced.

## Validation

Static audit: all checks PASS.

A sandbox TypeScript invocation could not complete the repository graph because the sandbox lacks `@types/node` and `vitest/globals`; no `FormRequestScanner.ts` diagnostic was emitted by that invocation.

The local authoritative build remains `npm run build` in the user's workspace.
