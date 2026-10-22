# Phase 1896 — Parser Caller Disposition Contract (Interface First)

## Goal

Strengthen the existing `LaravelControllerInvocationSemanticBoundaryContract` before any parser wiring changes. No duplicate invocation judgment or integrated-response model is introduced.

## Trace

The canonical production scanner uses `parseControllerDeclarationFromInvocationJudgment`, which takes one `LaravelControllerInvocationSemanticJudgmentInterface`. Legacy `parseControllerDeclaration` callers were traced across four production structural consumers, three test files, and the `LaravelSourceLexer` public facade.

The four structural consumers are attribute, provider, middleware, and response scanners. They currently parse local AST structure and are not evidence that the canonical invocation pipeline ran. The test files are explicitly test fixtures, not production semantic coverage. The facade is a separate compatibility surface because it still exports the legacy signature.

## Interface change

The existing upstream boundary is advanced from v62 to v63 and now exposes `legacyParserCallSiteInventory`, typed as `LaravelControllerLegacyParserCallSiteDisposition`. Its discriminated variants distinguish structural AST consumers, test fixtures, and the legacy public facade. Each variant declares that it is not an invocation semantic authority and states its migration requirement.

## Deliberately not changed

- No parser/scanner runtime changes.
- No `InvocationSemanticJudgmentV2` or parallel response model.
- No `packages/core/src/semantic/foundation` dependency.
- No subscanner deletion until each production consumer has an explicit syntax-only contract or receives the canonical judgment.
- No build or TypeScript compilation was run.

## Validation

Run `npm run audit:phase1896-parser-caller-disposition-contract-interface-first`. This is a static source-contract audit, not a TypeScript compile.
