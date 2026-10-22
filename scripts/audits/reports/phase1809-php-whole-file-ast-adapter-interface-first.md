# Phase 1809 — PHP Whole-File AST Adapter, Interface First

## Trace

- The upstream `PhpSourceFrontendInterface` v3 already required whole-file traversal evidence, namespace-region/import/declaration inventory, invocation syntax inventory, and source-bound spans.
- The CLI already declared `php-parser` as a dependency and had an expression-only parser adapter. No implementation connected that parser to the upstream whole-file frontend contract.
- The scanner's core analyzer intentionally accepted a completed pipeline result and did not import or instantiate a parser. This boundary remains unchanged.

## Changes

- Added `packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts` implementing `PhpSourceFrontendInterface` using the existing `php-parser` dependency.
- The adapter parses the complete source document with source positions, recursively walks the AST, collects namespace regions, namespace/function imports, named function declarations, ordinary named function calls, callee segments, and argument source spans.
- Parser failure or unrepresentable evidence produces incomplete extraction evidence rather than a false complete claim.
- Added `packages/cli/src/parsers/php/sourceInvocationPipeline.ts` to inject the AST frontend into the existing upstream source-invocation semantic pipeline authorities.
- Exported the adapter and pipeline entry point from `packages/cli/src/parsers/php/index.ts`.
- Exported required upstream contracts and authority entry points from `packages/core/src/index.ts`.
- Added `scripts/audits/audit-phase1809-php-whole-file-ast-adapter-interface-first.cjs`.

## Verification

- Phase 1809 static audit: 26/26.
- Phase 1808 regression audit: 14/14.
- Phase 1807 regression audit: 12/12.
- Phase 1806 regression audit: 12/12.
- Phase 1805 regression audit: 16/16.
- Phase 1804 regression audit: 16/16.
- Phase 1803 regression audit: 12/12.
- Build and TypeScript typecheck were not run.
- The extracted workspace does not include installed node_modules, so runtime parser execution could not be exercised here. The audit is static and does not claim a runtime parser test.

## Known follow-up

- Validate actual `php-parser` AST node shapes against representative Laravel files with installed dependencies, especially group imports, mixed imports, and namespace region boundaries.
- The current argument adapter deliberately carries each argument as `unsupported_expression` with its source span. It preserves argument occurrence/provenance but does not claim expression-semantic decoding; that belongs to a later typed expression adapter.
- Wire the returned `PhpSourceInvocationSemanticPipelineResult` into the CLI's controller analysis call site and then retire old subscanner consumers only after import/call-site audits.
