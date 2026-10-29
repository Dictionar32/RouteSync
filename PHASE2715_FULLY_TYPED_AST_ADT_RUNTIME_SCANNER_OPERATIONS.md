# Phase 2715 — Fully Typed AST ADT Runtime Scanner Operations

## Scope and source changes

This phase makes one concrete ownership correction in the active syntax path. The implementation of `sourceAstSyntaxParser` moved from `compiler/semantic/sourceAstSyntaxParser.ts` to `compiler/frontend/php/sourceAstSyntaxParser.ts`.

Changes applied:

- Moved the syntax parser implementation into `compiler/frontend/php` and removed the old semantic-owned implementation file.
- Removed the parser's dependency on `scanner/LaravelSourceLexer`; it now calls `phpSourceTokenizer` and `phpMethodParser` directly, both owned by the PHP frontend.
- Rewired the semantic producer, resource source evidence, model scanner, FormRequest scanner, and subscanner consumer to the frontend-owned parser.
- Added explicit named exports for the parser and upstream syntax contract through `compiler/frontend/php/index.ts`.
- Added `sourceAstSyntaxParser.adt.phase2715.test.ts`, which checks the `source_ast_syntax_parse` and `source_ast_parsed_file` discriminants, `closed: true`, and typed `class_property` nodes.
- Added `npm run audit:phase2715-ast-adt-runtime-scanner-operations`.

The runtime operation follows the requested interface-first form:

```ts
export const sourceAstSyntaxParser:
  SourceAstSyntaxParserInterface<PhpMethodAst, PhpClassPropertyAst, TokenDescriptor> = Object.freeze({
    kind: 'source_ast_syntax_parser_interface',
    closed: true,
    parseProperties: parsePropertiesFromSource,
    parse: (files) => { /* typed AST parse contract */ },
  });
```

This is an interface-typed object with discriminated AST output, not an exported function or an untyped callable alias.

## AST/ADT contract

The existing upstream syntax contract already defines tagged output variants:

- `SourceAstSyntaxParseContract.kind = 'source_ast_syntax_parse'`
- `SourceAstParsedFile.kind = 'source_ast_parsed_file'`
- each contract carries `closed: true`
- individual PHP syntax nodes use their own discriminants, such as `class_property` and the `PhpMethodAst` variants.

The parser remains syntax-only. It identifies owner, tokens, methods, and model properties; semantic capability and manifest validity remain the responsibility of upstream semantic judgments and authorities.

## CLI → upstream → manifest trace

The source-level path inspected in this workspace is:

```text
packages/cli/src/index.ts
  -> routeSyncCliUpstreamCompositionFactory.compose(...)
  -> routeSyncCliManifestScanOperationFactory.create(authority)
  -> controllerInvocationManifestCompositionAuthority
  -> source acquisition / source identity binding
  -> PHP source invocation and syntax evidence
  -> invocation judgment + source-to-judgment inventory authority
  -> manifestBuilderOperationPreparation.prepare(input).build()
  -> manifest_builder_complete | manifest_builder_blocked
  -> CLI scan/sync projection only after accepted authority results
```

Relevant source files:

- `packages/cli/src/index.ts`
- `packages/cli/src/upstreamCompositionFactory.ts`
- `packages/cli/src/manifestScanOperationInterface.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
- `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts`
- `packages/core/src/compiler/frontend/php/sourceAstSyntaxParser.ts`
- `packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts`

The CLI composition uses a discriminated resolution (`routesync_cli_upstream_composition_available` or `routesync_cli_upstream_semantic_assembly_rejected`) and exhaustive `never` checking. The manifest builder also preserves blocked outcomes rather than coercing them to success.

## Static audit

The audit script reports **13/13 structural checks passing**. It checks parser ownership, lack of scanner imports in the syntax parser, frontend tokenization ownership, typed object export, AST discriminants, closed contracts, rewired consumers, and the CLI composition/manifest operation contracts.

The audit also inventories the remaining scanner surface so it cannot be mistaken for a completed wiring-only migration:

- 342 TypeScript files under `compiler/scanner`
- 88 `export function` declarations remain
- 37 `export const name = (` arrow declarations remain
- top-level directories still include `binders`, `descriptors`, `operations`, `orchestrator`, `resolvers`, `semantic`, `subscanners`, `symbols`, `upstream`, and `wiring` (plus tests/audit)

Therefore, **scanner is not yet wiring-only**. This phase fixes the syntax parser ownership and typed AST runtime path, but does not claim all scanner implementation folders have been removed. Remaining declarations need call-graph-aware ownership migration; blindly rewriting signatures without moving their implementation to its correct owner would not fix the architecture.

## Validation boundaries

- Static audit: passed (13/13).
- Relative-import checks for the changed source set: passed (0 unresolved imports).
- TypeScript typecheck: not run; this extracted workspace has no `node_modules/.bin/tsc`.
- Vitest/unit tests: not run; this extracted workspace has no `node_modules/.bin/vitest`.
- Build and CLI scan/sync end-to-end: not run.

Do not interpret static checks as a successful typecheck or runtime test.
