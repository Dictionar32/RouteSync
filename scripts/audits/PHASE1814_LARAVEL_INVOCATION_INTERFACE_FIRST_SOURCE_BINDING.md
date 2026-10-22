# Phase 1814 — Laravel Invocation Interface-First Source Binding

## Scope

This phase strengthens the upstream scanner boundary before changing parser wiring. It does not claim that the production controller scanner is connected yet.

## Trace

`ControllerScanner.ts` reads each controller file and tokenizes it. `controllerMethodParser.ts` slices method-body tokens and calls `parseControllerBody()`. `controllerBodyParser.ts` currently calls `analyzeControllerDataflow()`, whose default composition evidence is `php_source_invocation_pipeline_not_connected`. The CLI owns `analyzePhpSourceInvocationSemanticPipeline(document)`, while the core scanner must not import a CLI adapter.

Therefore the missing architectural seam is not another invocation authority: it is a source-bound input contract at the Laravel scanner composition boundary that carries the already-closed whole-file pipeline result into per-method projection.

## Interface-first contract changes

`LaravelControllerInvocationSemanticBoundaryContract` is version 37 and now states four mandatory constraints:

- whole-file invocation input must be bound before method-body projection;
- source-file identity must be validated across controller document, frontend extraction, and pipeline result;
- complete, blocked, and not-connected outcomes remain distinct;
- method/body parser runtime must project the existing result rather than launch a second semantic analysis.

## Required next implementation

1. Define the source-bound carrier using existing `PhpSourceDocument`, `PhpSourceInvocationSemanticPipelineResult`, and `SourceFile` domain types. Do not introduce a second semantic authority.
2. Have the CLI composition root produce the pipeline result once per source file and pass that result through the scanner boundary without a core-to-CLI dependency.
3. Bind the result to the exact `fullPath` source identity before it reaches each method's integrated response.
4. Preserve blocked/not-connected status; never convert them into an empty successful batch.
5. Only after the new path is exercised by tests, retire the disconnected default for the production scanner path and migrate/remove duplicated legacy subscanner responsibility.

## Verification boundary

This phase is interface-contract-only. No build, typecheck, or end-to-end runtime test is claimed. The existing Phase 1813 audit is a static trace and continues to identify the active disconnected call path; it must not be reported as successful integration.

## External technical references

- TypeScript discriminated unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- PHP-Parser AST, source locations, and traversal: https://github.com/nikic/PHP-Parser
- Laravel routing/controller context: https://laravel.com/docs/12.x/controllers
